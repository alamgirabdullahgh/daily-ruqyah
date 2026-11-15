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

// আপডেট নামানো ও বসানো ফোরগ্রাউন্ড সার্ভিসে: অ্যাপ মিনিমাইজ করলে বা অন্য অ্যাপে গেলেও থামে না (ওয়েবভিউ থামলেও এটা চলে)
public class UpdateService extends Service {
    static final String CH = "dr_update_run";
    static final int NID = 4712;
    static volatile boolean running = false;
    static volatile BgUpdater.Pct listener;
    interface Done { void on(boolean ok); }
    static volatile Done done;

    private PowerManager.WakeLock wl;

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent in, int flags, int startId) {
        try {
            Notification n = notif(0);
            if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            else startForeground(NID, n);
        } catch (Exception e) { }
        final String url = in == null ? null : in.getStringExtra("url");
        if (url == null || running) { if (!running) stopSelf(); return START_NOT_STICKY; }
        running = true;
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "dailyruqyah:update");
            wl.acquire(15 * 60 * 1000L);
        } catch (Exception e) { }
        final boolean silent = Build.VERSION.SDK_INT >= 31;
        new Thread(() -> {
            boolean ok = false;
            try {
                BgUpdater.install(getApplicationContext(), url, silent, p -> {
                    try { ((NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE)).notify(NID, notif(p)); } catch (Exception e) { }
                    BgUpdater.Pct l = listener;
                    if (l != null) l.on(p);
                });
                ok = true;
            } catch (Exception e) { }
            finally {
                running = false;
                Done d = done;
                if (d != null) d.on(ok);
                try { if (wl != null && wl.isHeld()) wl.release(); } catch (Exception e) { }
                try { stopForeground(true); } catch (Exception e) { }
                stopSelf();
            }
        }, "dr-update").start();
        return START_NOT_STICKY;
    }

    private Notification notif(int pct) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null)
            nm.createNotificationChannel(new NotificationChannel(CH, "অ্যাপ আপডেট", NotificationManager.IMPORTANCE_LOW));
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH) : new Notification.Builder(this);
        b.setSmallIcon(android.R.drawable.stat_sys_download).setContentTitle("Daily Ruqyah আপডেট হচ্ছে")
                .setContentText(pct + "%").setOngoing(true).setOnlyAlertOnce(true).setProgress(100, pct, false);
        return b.build();
    }
}
