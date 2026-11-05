package com.dailyruqyah.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.atomic.AtomicInteger;

// মিশারি আলাফাসির পুরো কুরআন (৬৪kbps) ফোনের ভেতরে নামায়: ফোরগ্রাউন্ড সার্ভিস, তাই স্ক্রিন বন্ধ থাকলে বা অন্য অ্যাপে গেলেও চলে
public class OfflineAudioService extends Service {
    static final int TOTAL = 6236;
    static final String CH = "dr_offline_audio";
    static final int NID = 4711;
    static volatile boolean running = false;
    static volatile String last = "";
    private static final int[] AYN = {7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6};

    private PowerManager.WakeLock wl;
    private final AtomicInteger doneNow = new AtomicInteger(0);

    static File dir(Context c) { File d = new File(c.getFilesDir(), "alafasy64"); d.mkdirs(); return d; }

    /** @return {ফাইল সংখ্যা, মোট বাইট} */
    static long[] scan(Context c) {
        long n = 0, b = 0;
        File[] f = dir(c).listFiles();
        if (f != null) for (File x : f) if (x.getName().endsWith(".mp3") && x.length() > 1024) { n++; b += x.length(); }
        return new long[]{n, b};
    }

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent in, int flags, int startId) {
        try {
            Notification n = notif(0);
            if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            else startForeground(NID, n);
        } catch (Exception e) { last = "fg:" + e.getMessage(); }
        if (running) return START_STICKY;
        running = true;
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "dailyruqyah:offlineaudio");
            wl.acquire(6 * 60 * 60 * 1000L);
        } catch (Exception e) { }
        new Thread(this::work, "off-audio").start();
        return START_STICKY;
    }

    private Notification notif(int done) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null)
            nm.createNotificationChannel(new NotificationChannel(CH, "অফলাইন অডিও", NotificationManager.IMPORTANCE_LOW));
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        b.setSmallIcon(android.R.drawable.stat_sys_download).setContentTitle("অফলাইন অডিও নামছে")
                .setContentText(done + " / " + TOTAL + " আয়াত").setOngoing(true).setOnlyAlertOnce(true)
                .setProgress(TOTAL, done, false);
        return b.build();
    }

    private String[] urls(int n) {
        int s = 1, a = n;
        for (int c : AYN) { if (a <= c) break; a -= c; s++; }
        String p = String.format("%03d%03d", s, a);
        return new String[]{
                "https://everyayah.com/data/Alafasy_64kbps/" + p + ".mp3",
                "https://cdn.islamic.network/quran/audio/64/ar.alafasy/" + n + ".mp3",
                "https://everyayah.com/data/Alafasy_128kbps/" + p + ".mp3",
                "https://cdn.islamic.network/quran/audio/128/ar.alafasy/" + n + ".mp3"};
    }

    private boolean get(String u, File out) {
        HttpURLConnection cn = null;
        File part = new File(out.getPath() + ".part");
        try {
            cn = (HttpURLConnection) new URL(u).openConnection();
            cn.setConnectTimeout(15000);
            cn.setReadTimeout(30000);
            cn.setInstanceFollowRedirects(true);
            if (cn.getResponseCode() != 200) { last = "HTTP " + cn.getResponseCode(); return false; }
            long total = 0;
            try (InputStream is = cn.getInputStream(); FileOutputStream os = new FileOutputStream(part)) {
                byte[] buf = new byte[32768];
                int r;
                while ((r = is.read(buf)) > 0) { os.write(buf, 0, r); total += r; }
            }
            if (total < 1024) { part.delete(); last = "ছোট ফাইল"; return false; }
            return part.renameTo(out);
        } catch (Exception e) {
            last = String.valueOf(e.getMessage());
            part.delete();
            return false;
        } finally { if (cn != null) cn.disconnect(); }
    }

    private void work() {
        try {
            File d = dir(this);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            for (int pass = 0; pass < 30; pass++) {
                final AtomicInteger next = new AtomicInteger(1);
                doneNow.set((int) scan(this)[0]);
                Thread[] ts = new Thread[4];
                for (int t = 0; t < ts.length; t++) {
                    ts[t] = new Thread(() -> {
                        int n;
                        while ((n = next.getAndIncrement()) <= TOTAL) {
                            File f = new File(d, n + ".mp3");
                            if (f.exists() && f.length() > 1024) continue;
                            for (String u : urls(n)) {
                                if (get(u, f)) {
                                    int dn = doneNow.incrementAndGet();
                                    if (dn % 20 == 0) nm.notify(NID, notif(dn));
                                    break;
                                }
                            }
                        }
                    });
                    ts[t].start();
                }
                for (Thread t : ts) t.join();
                long[] sc = scan(this);
                nm.notify(NID, notif((int) sc[0]));
                if (sc[0] >= TOTAL) break;
                Thread.sleep(60000); // নেট না থাকলে ১ মিনিট পর আবার
            }
        } catch (Exception e) { last = String.valueOf(e.getMessage()); }
        finally {
            running = false;
            try { if (wl != null && wl.isHeld()) wl.release(); } catch (Exception e) { }
            stopForeground(true);
            stopSelf();
        }
    }
}
