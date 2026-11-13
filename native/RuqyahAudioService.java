package com.dailyruqyah.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

// রুকইয়াহ অডিও চালায় (আয়াতের তালিকা ধরে একটার পর একটা, প্রতিটির ফলব্যাক লিংকসহ); নোটিফিকেশনে "বন্ধ করুন" বোতাম
public class RuqyahAudioService extends Service {
    static final String STOP = "com.dailyruqyah.app.STOP_AUDIO";
    static volatile boolean playing = false;
    static volatile int playingId = -1;

    private final Handler h = new Handler(Looper.getMainLooper());
    private MediaPlayer mp;
    private PowerManager.WakeLock wl;
    private List<List<String>> items = new ArrayList<>();
    private int repeat = 1, round = 0, idx = 0, cand = 0, fails = 0, attempts = 0;
    private boolean stopped = false;
    private JSONObject cur = null;      // চলতি অ্যালার্ম
    private int curId = -1;
    private boolean persist = false;    // true হলে শেষ না হওয়া পর্যন্ত থামে না (সূরা বাকারা)

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent in, int flags, int startId) {
        if (in != null && STOP.equals(in.getAction())) { finish(!in.getBooleanExtra("nonag", false)); return START_NOT_STICKY; }
        String title = "রুকইয়াহ অডিও";
        int startRound = 0, startIdx = 0;
        try {
            String js = in != null ? in.getStringExtra("alarm") : null;
            if (js == null) { // সিস্টেম সার্ভিসটা মেরে আবার চালু করলে: শেষ জানা জায়গা থেকে চালায়
                String rs = AlarmStore.sp(this).getString("resume", "");
                if (!rs.isEmpty()) { JSONObject r = new JSONObject(rs); js = r.optString("alarm"); startRound = r.optInt("round"); startIdx = r.optInt("idx"); AlarmStore.log(this, "সার্ভিস আবার চালু: আগের জায়গা থেকে (" + startIdx + ")"); }
            }
            JSONObject o = new JSONObject(js);
            cur = o;
            curId = o.optInt("id", -1);
            persist = o.optBoolean("persist", false);
            title = o.optString("title", title);
            repeat = Math.max(1, Math.min(20, o.optInt("repeat", 1)));
            JSONArray u = o.optJSONArray("urls");
            items.clear();
            if (u != null) for (int i = 0; i < u.length(); i++) {
                JSONArray c = u.optJSONArray(i);
                List<String> l = new ArrayList<>();
                if (c != null) for (int k = 0; k < c.length(); k++) l.add(c.optString(k));
                else l.add(u.optString(i));
                if (!l.isEmpty()) items.add(l);
            }
        } catch (Exception e) { }
        try { startFg(title); } catch (Throwable e) { AlarmStore.log(this, "ফোরগ্রাউন্ড শুরু হয়নি: " + e.getClass().getSimpleName()); }
        if (items.isEmpty()) { finish(false); return START_NOT_STICKY; }
        playing = true;
        playingId = curId;
        stopped = false;
        round = startRound; idx = Math.min(startIdx, items.size() - 1); cand = 0; fails = 0; attempts = 0;
        AlarmStore.log(this, "সার্ভিস শুরু: " + items.size() + "টি অডিও, " + repeat + " বার" + (persist ? ", শেষ পর্যন্ত চলবে" : ""));
        try {
            PowerManager pm = getSystemService(PowerManager.class);
            if (wl != null && wl.isHeld()) wl.release();
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "dailyruqyah:audio");
            wl.acquire((persist ? 8L : 3L) * 60 * 60 * 1000L);
        } catch (Exception e) { }
        try {
            AudioManager am = getSystemService(AudioManager.class);
            am.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN);
        } catch (Exception e) { }
        playCurrent();
        return persist ? START_STICKY : START_NOT_STICKY;
    }

    // বাকারার মতো লম্বা অডিও: প্রতিটি আয়াত শেষে জায়গা মনে রাখে (সার্ভিস মরে গেলে সেখান থেকে চলে)
    private void saveResume() {
        if (!persist || cur == null) return;
        try { AlarmStore.sp(this).edit().putString("resume", new JSONObject().put("alarm", cur.toString()).put("idx", idx).put("round", round).toString()).apply(); } catch (Exception e) { }
    }

    private void startFg(String title) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel("ruqyah_audio", "রুকইয়াহ অডিও", NotificationManager.IMPORTANCE_LOW));
        PendingIntent stop = PendingIntent.getService(this, 1, new Intent(this, RuqyahAudioService.class).setAction(STOP), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        PendingIntent open = PendingIntent.getActivity(this, 2, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new Notification.Builder(this, "ruqyah_audio")
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle("রুকইয়াহ অডিও চলছে")
                .setContentText(title)
                .setContentIntent(open)
                .setOngoing(true)
                .addAction(new Notification.Action.Builder(null, "বন্ধ করুন", stop).build())
                .build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(77, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(77, n);
    }

    private void release() {
        if (mp != null) { try { mp.reset(); mp.release(); } catch (Exception e) { } mp = null; }
    }

    // টগল/অ্যালার্ম বন্ধ করা হলে (সংরক্ষিত তালিকায় on=false) চলতি অডিও নিজেই থামে; পরীক্ষা-অ্যালার্ম (তালিকায় নেই) প্রভাবিত হয় না
    private boolean switchedOff() {
        try {
            if (cur == null || curId < 0) return false;
            JSONObject f = AlarmStore.find(this, curId);
            return f != null && !f.optBoolean("on", true);
        } catch (Throwable e) { return false; }
    }

    private void playCurrent() {
        if (stopped) return;
        if (switchedOff()) { AlarmStore.log(this, "অ্যালার্ম বন্ধ করা হয়েছে — অডিও থামানো হলো (id " + curId + ")"); finish(false); return; }
        if (idx >= items.size()) {
            round++; idx = 0;
            if (round >= repeat) { finish(false); return; }
        }
        List<String> c = items.get(idx);
        if (cand >= c.size()) { // এই আয়াতের সব লিংক ব্যর্থ: পরেরটায়
            idx++; cand = 0; fails++;
            if (fails >= 6) { // পরপর অনেকগুলো ব্যর্থ (নেট নেই?) — ২০ সেকেন্ড পরে আবার, সর্বোচ্চ ৫ বার (শেষ পর্যন্ত-চলা অডিওতে সীমা নেই)
                if (attempts < 5 || persist) {
                    attempts++; fails = 0; idx = 0; cand = 0;
                    AlarmStore.log(this, "অডিও চালানো যায়নি, ২০ সেকেন্ড পরে আবার চেষ্টা (" + attempts + "/৫)");
                    h.postDelayed(this::playCurrent, 20000);
                } else { AlarmStore.log(this, "বারবার চেষ্টা করেও অডিও চালানো যায়নি"); finish(false); }
                return;
            }
            h.post(this::playCurrent);
            return;
        }
        release();
        try {
            mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            mp.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            String src = c.get(cand);
            if (src.startsWith("/") && !new java.io.File(src).exists()) throw new java.io.FileNotFoundException(src);
            mp.setDataSource(src);
            mp.setOnPreparedListener(m -> { if (!stopped) { fails = 0; m.start(); AlarmStore.log(this, "অডিও বাজছে"); } });
            mp.setOnCompletionListener(m -> { idx++; cand = 0; saveResume(); h.post(this::playCurrent); });
            mp.setOnErrorListener((m, w, x) -> { AlarmStore.log(this, "প্লেয়ার ত্রুটি " + w + "/" + x); cand++; h.post(this::playCurrent); return true; });
            mp.prepareAsync();
        } catch (Exception e) {
            AlarmStore.log(this, "অডিও খুলতে ব্যর্থ: " + e.getClass().getSimpleName() + " " + e.getMessage());
            cand++;
            h.post(this::playCurrent);
        }
    }

    // manual = ব্যবহারকারী নিজে বন্ধ করেছেন; অ্যালার্মে "nag" (মিনিট) থাকলে সেই সময় পরে আবার বাজবে। শেষ পর্যন্ত বাজলে/ব্যর্থ হলে আবার-বাজা নেই
    private void finish(boolean manual) {
        stopped = true;
        playing = false;
        int id = curId; JSONObject o = cur;
        playingId = -1;
        h.removeCallbacksAndMessages(null);
        release();
        try { if (wl != null && wl.isHeld()) wl.release(); } catch (Exception e) { }
        try { getSystemService(AudioManager.class).abandonAudioFocus(null); } catch (Exception e) { }
        try { AlarmStore.sp(this).edit().remove("resume").apply(); } catch (Exception e) { }
        if (manual && o != null && id >= 0) {
            int nag = o.optInt("nag", 0);
            JSONObject fresh = AlarmStore.find(this, id);
            if (nag > 0 && fresh != null && fresh.optBoolean("on", true)) AlarmStore.scheduleNag(this, id, nag);
        }
        try { stopForeground(true); } catch (Throwable e) { }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        stopped = true;
        playing = false;
        playingId = -1;
        release();
        try { if (wl != null && wl.isHeld()) wl.release(); } catch (Exception e) { }
        super.onDestroy();
    }
}
