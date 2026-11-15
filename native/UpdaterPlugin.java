package com.dailyruqyah.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.HttpURLConnection;
import java.net.URL;

// অ্যাপের নিজের আপডেট: GitHub-এর "latest release" দেখে, APK নামিয়ে PackageInstaller দিয়ে ইনস্টল করে
@CapacitorPlugin(name = "AppUpdater")
public class UpdaterPlugin extends Plugin {
    static final String REPO = "alamgirabdullahgh/daily-ruqyah";
    static final int BASE = 100;
    private volatile boolean busy = false;

    @PluginMethod
    public void info(PluginCall call) {
        try {
            Context c = getContext();
            PackageInfo pi = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            JSObject r = new JSObject();
            r.put("versionName", pi.versionName);
            r.put("versionCode", Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode);
            r.put("canInstall", c.getPackageManager().canRequestPackageInstalls());
            call.resolve(r);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    // ট্যাগ v1.0.N → সংস্করণ নম্বর 100 + N (বিল্ডের versionCode-এর সাথে মেলে)
    @PluginMethod
    public void check(final PluginCall call) {
        new Thread(() -> {
            HttpURLConnection cn = null;
            try {
                cn = (HttpURLConnection) new URL("https://github.com/" + REPO + "/releases/latest").openConnection();
                cn.setInstanceFollowRedirects(false);
                cn.setConnectTimeout(10000);
                cn.setReadTimeout(10000);
                String loc = cn.getHeaderField("Location");
                if (loc == null) throw new Exception("no redirect");
                String tag = loc.substring(loc.lastIndexOf('/') + 1);
                int n = Integer.parseInt(tag.substring(tag.lastIndexOf('.') + 1));
                JSObject r = new JSObject();
                r.put("tag", tag);
                r.put("versionCode", BASE + n);
                r.put("url", "https://github.com/" + REPO + "/releases/download/" + tag + "/Daily-Ruqyah.apk");
                call.resolve(r);
            } catch (Exception e) {
                call.reject("check failed: " + e.getClass().getSimpleName());
            } finally {
                if (cn != null) cn.disconnect();
            }
        }).start();
    }

    // অ্যাপের APK "Daily Ruqyah.apk" নামে শেয়ার (ফাইলের নাম ApkShareProvider ঠিক করে)
    @PluginMethod
    public void share(PluginCall call) {
        try {
            Context c = getContext();
            Uri u = ApkShareProvider.uri(c);
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType("application/vnd.android.package-archive");
            i.putExtra(Intent.EXTRA_STREAM, u);
            i.putExtra(Intent.EXTRA_SUBJECT, "Daily Ruqyah");
            i.setClipData(android.content.ClipData.newRawUri(ApkShareProvider.NAME, u));
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent ch = Intent.createChooser(i, "Daily Ruqyah শেয়ার করুন");
            ch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(ch);
            call.resolve();
        } catch (Exception e) {
            call.reject("share failed: " + e.getClass().getSimpleName());
        }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Context c = getContext();
            Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + c.getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void install(final PluginCall call) {
        final String url = call.getString("url");
        final Context c = getContext();
        if (url == null || !url.startsWith("https://github.com/" + REPO + "/")) {
            call.reject("bad url");
            return;
        }
        if (!c.getPackageManager().canRequestPackageInstalls()) {
            call.reject("permission");
            return;
        }
        if (UpdateService.running) {
            call.reject("busy");
            return;
        }
        // ডাউনলোড ফোরগ্রাউন্ড সার্ভিসে চলে: অ্যাপ মিনিমাইজ বা অন্য অ্যাপে গেলেও আপডেট চলতেই থাকে
        UpdateService.listener = pct -> {
            JSObject o = new JSObject();
            o.put("pct", pct);
            notifyListeners("progress", o);
        };
        UpdateService.done = ok -> {
            UpdateService.listener = null;
            UpdateService.done = null;
            if (ok) call.resolve(); else call.reject("install failed");
        };
        try {
            Intent in = new Intent(c, UpdateService.class).putExtra("url", url);
            if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(in); else c.startService(in);
        } catch (Exception e) {
            UpdateService.listener = null;
            UpdateService.done = null;
            call.reject("install failed: " + e.getClass().getSimpleName());
        }
    }
}
