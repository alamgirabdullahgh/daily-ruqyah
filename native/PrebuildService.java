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

// অডিও/PDF আগে-থেকে-তৈরির কাজ চলার সময় অ্যাপকে জাগিয়ে রাখে: মিনিমাইজ করলেও ওয়েবভিউ ও প্রসেস থামে না (কুরআন নামানোর মতোই)
public class PrebuildService extends Service {
    static final String CH = "dr_prebuild_run";
    static final int NID = 4713;
    static volatile boolean running = false;
    private PowerManager.WakeLock wl;

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent in, int flags, int startId) {
        String t = in == null ? null : in.getStringExtra("text");
        try {
            Notification n = notif(this, t == null ? "অডিও ও PDF তৈরি হচ্ছে" : t);
            if (Build.VERSION.SDK_INT >= 29) startForeground(NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            else startForeground(NID, n);
        } catch (Exception e) { }
        running = true;
        try {
            if (wl == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "dailyruqyah:prebuild");
            }
            if (!wl.isHeld()) wl.acquire(6 * 60 * 60 * 1000L);
        } catch (Exception e) { }
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        try { if (wl != null && wl.isHeld()) wl.release(); } catch (Exception e) { }
        super.onDestroy();
    }

    static Notification notif(Context c, String text) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null)
            nm.createNotificationChannel(new NotificationChannel(CH, "অডিও ও PDF তৈরি", NotificationManager.IMPORTANCE_LOW));
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CH) : new Notification.Builder(c);
        b.setSmallIcon(android.R.drawable.stat_sys_download).setContentTitle("Daily Ruqyah").setContentText(text).setOngoing(true).setOnlyAlertOnce(true);
        return b.build();
    }

    static void update(Context c, String text) {
        try { ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(NID, notif(c, text)); } catch (Exception e) { }
    }
}
