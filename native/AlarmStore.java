package com.dailyruqyah.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

// রুকইয়াহ অডিও অ্যালার্মের তালিকা (SharedPreferences-এ JSON) ও পরের সময়ে অ্যালার্ম বসানো।
// অ্যালার্ম: {id, time:"HH:MM", days:[0..6] (0=রবি; ফাঁকা = প্রতিদিন), on, title, repeat, urls:[[url,…ফলব্যাক],…]}
public class AlarmStore {
    static final String PREF = "dr_alarm";
    static final String ACTION = "com.dailyruqyah.app.AUDIO_ALARM";

    static SharedPreferences sp(Context c) { return c.getSharedPreferences(PREF, Context.MODE_PRIVATE); }

    static JSONArray load(Context c) {
        try { return new JSONArray(sp(c).getString("alarms", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static void save(Context c, JSONArray a) { sp(c).edit().putString("alarms", a.toString()).apply(); }

    static JSONObject find(Context c, int id) {
        JSONArray a = load(c);
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o != null && o.optInt("id") == id) return o;
        }
        return null;
    }

    // নির্ণয়ের লগ: শেষ ২৫টি ঘটনা (অ্যালার্ম এল কিনা, সার্ভিস চালু হলো কিনা, অডিও কেন চলেনি)
    static synchronized void log(Context c, String msg) {
        try {
            JSONArray a = new JSONArray(sp(c).getString("log", "[]"));
            JSONArray n = new JSONArray();
            String t = new java.text.SimpleDateFormat("dd/MM HH:mm:ss", java.util.Locale.US).format(new java.util.Date());
            int from = Math.max(0, a.length() - 24);
            for (int i = from; i < a.length(); i++) n.put(a.optString(i));
            n.put(t + "  " + msg);
            sp(c).edit().putString("log", n.toString()).apply();
        } catch (Exception e) { }
    }

    static JSONArray getLog(Context c) {
        try { return new JSONArray(sp(c).getString("log", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static boolean canExact(Context c) {
        AlarmManager am = c.getSystemService(AlarmManager.class);
        return Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
    }

    private static PendingIntent pi(Context c, int id, int flags) {
        Intent i = new Intent(c, AlarmReceiver.class).setAction(ACTION).putExtra("id", id);
        return PendingIntent.getBroadcast(c, id, i, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    // পরের বাজার সময় (মিলিসেকেন্ড); কোনো দিনই না মিললে -1
    // সূর্যোদয়/সূর্যাস্ত-ভিত্তিক সময় (rel = "sunrise" | "sunset", off = মিনিটের সমন্বয়, notBefore = "asr"): দিনের তারিখে ফোনের অবস্থান থেকে হিসাব (উইজেটের হিসাবের হুবহু)
    static long relMillis(Context c, JSONObject o, int dayOffset) {
        try {
            Cfg cfg = new Cfg(c);
            java.time.ZoneId z = java.time.ZoneId.systemDefault();
            java.time.LocalDate date = java.time.LocalDate.now(z).plusDays(dayOffset);
            double tz = z.getRules().getOffset(date.atStartOfDay(z).toInstant()).getTotalSeconds() / 3600.0;
            Prayer.T t = Prayer.INSTANCE.times(date, cfg.lat(), cfg.lng(), tz, 18.0, 18.0, cfg.getHanafi());
            double hrs = "sunrise".equals(o.optString("rel", "")) ? t.getSunrise() : t.getMaghrib();
            int mins = Prayer.INSTANCE.minutes(hrs) + o.optInt("off", 0);
            if ("asr".equals(o.optString("notBefore", ""))) mins = Math.max(mins, Prayer.INSTANCE.minutes(t.getAsr()));
            return date.atStartOfDay(z).plusMinutes(mins).toInstant().toEpochMilli();
        } catch (Throwable e) { return -1; }
    }

    static long nextTime(Context ctx, JSONObject o, long now) {
        try {
            String rel = o.optString("rel", "");
            if (!rel.isEmpty()) {
                JSONArray dd = o.optJSONArray("days");
                for (int d = 0; d <= 8; d++) {
                    long tt = relMillis(ctx, o, d);
                    if (tt < 0 || tt <= now + 1000) continue;
                    int dow = java.time.Instant.ofEpochMilli(tt).atZone(java.time.ZoneId.systemDefault()).getDayOfWeek().getValue() % 7; // 0 = রবিবার
                    boolean ok = dd == null || dd.length() == 0;
                    if (!ok) for (int k = 0; k < dd.length(); k++) if (dd.optInt(k, -1) == dow) ok = true;
                    if (ok) return tt;
                }
                return -1;
            }
            String[] hm = o.optString("time", "05:00").split(":");
            int h = Integer.parseInt(hm[0]), m = Integer.parseInt(hm[1]);
            JSONArray days = o.optJSONArray("days");
            for (int d = 0; d <= 7; d++) {
                Calendar c = Calendar.getInstance();
                c.setTimeInMillis(now);
                c.add(Calendar.DAY_OF_YEAR, d);
                c.set(Calendar.HOUR_OF_DAY, h);
                c.set(Calendar.MINUTE, m);
                c.set(Calendar.SECOND, 0);
                c.set(Calendar.MILLISECOND, 0);
                if (c.getTimeInMillis() <= now + 1000) continue;
                int dow = c.get(Calendar.DAY_OF_WEEK) - 1; // 0 = রবিবার
                boolean ok = days == null || days.length() == 0;
                if (!ok) for (int k = 0; k < days.length(); k++) if (days.optInt(k, -1) == dow) ok = true;
                if (ok) return c.getTimeInMillis();
            }
        } catch (Exception e) { }
        return -1;
    }

    // বন্ধ করার পর "আবার বাজবে" (nag): আলাদা একবারের অ্যালার্ম, নিয়মিত সময়ের সাথে মেশে না
    private static PendingIntent piNag(Context c, int id, int flags) {
        Intent i = new Intent(c, AlarmReceiver.class).setAction(ACTION).putExtra("id", id).putExtra("nag", true);
        return PendingIntent.getBroadcast(c, 100000 + id, i, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    static void scheduleNag(Context c, int id, int minutes) {
        try {
            AlarmManager am = c.getSystemService(AlarmManager.class);
            long t = System.currentTimeMillis() + minutes * 60000L;
            PendingIntent p = piNag(c, id, PendingIntent.FLAG_UPDATE_CURRENT);
            if (canExact(c)) {
                PendingIntent show = PendingIntent.getActivity(c, 5, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(t, show), p);
            } else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, p);
            sp(c).edit().putLong("nag_" + id, t).apply();
            log(c, "বন্ধ করা হয়েছে — " + minutes + " মিনিট পরে আবার বাজবে (id " + id + ")");
        } catch (Exception e) { }
    }

    static void cancelNag(Context c, int id) {
        try {
            c.getSystemService(AlarmManager.class).cancel(piNag(c, id, PendingIntent.FLAG_UPDATE_CURRENT));
            sp(c).edit().remove("nag_" + id).apply();
        } catch (Exception e) { }
    }

    // আগের সব বসানো অ্যালার্ম বাতিল করে চালু থাকাগুলোর পরের সময় বসায়
    static void scheduleAll(Context c) {
        AlarmManager am = c.getSystemService(AlarmManager.class);
        SharedPreferences s = sp(c);
        try {
            JSONArray old = new JSONArray(s.getString("sched", "[]"));
            for (int i = 0; i < old.length(); i++) am.cancel(pi(c, old.optInt(i), PendingIntent.FLAG_UPDATE_CURRENT));
        } catch (Exception e) { }
        JSONArray sched = new JSONArray();
        JSONArray a = load(c);
        long now = System.currentTimeMillis();
        boolean exact = canExact(c);
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o == null) continue;
            if (!o.optBoolean("on", true)) { cancelNag(c, o.optInt("id")); continue; }
            long t = nextTime(c, o, now);
            if (t < 0) continue;
            int id = o.optInt("id");
            PendingIntent p = pi(c, id, PendingIntent.FLAG_UPDATE_CURRENT);
            try {
                if (exact) {
                    // ঘড়ির অ্যালার্মের মতো: Doze ও ব্যাটারি সেভার পেরিয়ে স্ক্রিন অফেও বাজে
                    PendingIntent show = PendingIntent.getActivity(c, 5, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
                    am.setAlarmClock(new AlarmManager.AlarmClockInfo(t, show), p);
                } else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, p);
                sched.put(id);
            } catch (Exception e) { }
        }
        s.edit().putString("sched", sched.toString()).apply();
    }
}
