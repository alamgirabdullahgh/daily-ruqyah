package com.dailyruqyah.app;

import android.content.ContentValues;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UpdaterPlugin.class);
        registerPlugin(AudioAlarmPlugin.class);
        registerPlugin(WidgetPlugin.class);
        registerPlugin(OfflineAudioPlugin.class);
        super.onCreate(savedInstanceState);
        try {
            WebView w = getBridge().getWebView();
            w.addJavascriptInterface(new Dl(), "DRDl");
            // অডিও প্লেয়ারের তিন-ডট মেনুর "Download" (blob:) ধরে একই সেভারে পাঠায়
            w.setDownloadListener((url, ua, cd, mime, len) -> {
                if (url != null && url.startsWith("blob:"))
                    w.evaluateJavascript("fetch(" + org.json.JSONObject.quote(url) + ").then(r=>r.blob()).then(b=>window.__drSave&&window.__drSave(b," + org.json.JSONObject.quote(url) + "))", null);
            });
        } catch (Exception ignored) {}
        // ফোনের ব্যাক বাটন: আগে অ্যাপের ভেতরে ধাপে ধাপে ফেরে (JS __drBackKey), হোমে থাকলে তবেই অ্যাপ বন্ধ
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                try {
                    getBridge().getWebView().evaluateJavascript(
                        "(function(){try{return window.__drBackKey?window.__drBackKey():false}catch(e){return false}})()",
                        v -> { if (!"true".equals(v)) finish(); });
                } catch (Exception e) { finish(); }
            }
        });
        applyStatusBar();
        BgUpdater.schedule(this, 60 * 1000L); // অ্যাপ খোলার ১ মিনিট পর থেকে ব্যাকগ্রাউন্ড আপডেট-পাহারা চালু
    }

    // স্ট্যাটাস বার (সময়/নেটওয়ার্ক/ব্যাটারি): নিচের নেভিগেশন বারের ব্যাকগ্রাউন্ডের একই রং (দিনে #fffdf9, ডার্ক মোডে #101b16); আইকন রংও সেই অনুযায়ী
    private void applyStatusBar() {
        try {
            boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
            Window w = getWindow();
            w.setStatusBarColor(Color.parseColor(night ? "#101b16" : "#fffdf9"));
            if (Build.VERSION.SDK_INT >= 30) {
                WindowInsetsController c = w.getInsetsController();
                if (c != null) c.setSystemBarsAppearance(night ? 0 : WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS);
            } else if (Build.VERSION.SDK_INT >= 23) {
                View d = w.getDecorView();
                int f = d.getSystemUiVisibility();
                d.setSystemUiVisibility(night ? (f & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR) : (f | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR));
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applyStatusBar();
    }

    @Override
    public void onResume() {
        super.onResume();
        BgUpdater.fg = true;
        BgUpdater.clearNotice(this);
    }

    @Override
    public void onPause() {
        BgUpdater.fg = false;
        super.onPause();
    }

    /** JS থেকে ফাইল টুকরো টুকরো করে নিয়ে Downloads ফোল্ডারে সেভ করে */
    private class Dl {
        private final Map<String, OutputStream> os = new HashMap<>();
        private final Map<String, String> where = new HashMap<>();
        private final Map<String, Uri> uris = new HashMap<>();
        private final Map<String, String> shareNames = new HashMap<>();

        @JavascriptInterface public void begin(String id, String name, String mime) {
            try {
                OutputStream o;
                if ("application/octet-stream".equals(mime)) {
                    // শেয়ারের জন্য: অ্যাপের ক্যাশে ফাইল (AudioShareProvider "সাধারণ ফাইল" হিসেবে দেখাবে → WhatsApp-এ ডকুমেন্ট)
                    File d = AudioShareProvider.dir(MainActivity.this);
                    File[] old = d.listFiles();
                    if (old != null) for (File x : old) x.delete();
                    String safe = name.replace("/", "-");
                    int dot = safe.lastIndexOf('.');
                    String ext = dot >= 0 ? safe.substring(dot + 1).toLowerCase() : "";
                    if (!ext.matches("[a-z0-9]{1,5}")) ext = "mp3";
                    // লিংকে শুধু ইংরেজি নাম (WhatsApp যাতে .mp3 চেনে); পাঠানোর সময় দেখানোর নাম আসল বাংলা নামই থাকে
                    String fileName = "share" + System.currentTimeMillis() + "." + ext;
                    o = new FileOutputStream(new File(d, fileName));
                    AudioShareProvider.NAMES.clear();
                    AudioShareProvider.NAMES.put(fileName, safe);
                    shareNames.put(id, fileName);
                } else if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, name);
                    v.put(MediaStore.Downloads.MIME_TYPE, mime);
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/DailyRuqyah");
                    Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    o = getContentResolver().openOutputStream(u);
                    uris.put(id, u);
                } else {
                    File d = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    d.mkdirs();
                    File f = new File(d, name);
                    o = new FileOutputStream(f);
                    where.put(id, f.getAbsolutePath());
                }
                os.put(id, o);
            } catch (Exception e) { toast("ডাউনলোড শুরু করা যায়নি: " + e.getMessage()); }
        }

        @JavascriptInterface public void chunk(String id, String b64) {
            try { OutputStream o = os.get(id); if (o != null) o.write(Base64.decode(b64, Base64.DEFAULT)); }
            catch (Exception e) { toast("সেভ করতে সমস্যা: " + e.getMessage()); }
        }

        @JavascriptInterface public void end(String id) {
            try {
                OutputStream o = os.remove(id);
                if (o != null) { o.flush(); o.close(); }
                String w = where.remove(id);
                uris.remove(id);
                toast(w == null ? "✅ ডাউনলোড হয়েছে — Downloads/DailyRuqyah ফোল্ডারে" : "✅ সেভ হয়েছে: " + w);
            } catch (Exception e) { toast("সেভ শেষ করা যায়নি: " + e.getMessage()); }
        }

        /** শেয়ার: ফাইল সেভ শেষ করে (Downloads/DailyRuqyah-এ একটা কপি থাকে) Android-এর শেয়ার-শিট খোলে */
        @JavascriptInterface public void endShare(String id, String mime) {
            try {
                OutputStream o = os.remove(id);
                if (o != null) { o.flush(); o.close(); }
                where.remove(id);
                Uri u = uris.remove(id);
                String sn = shareNames.remove(id);
                if (sn != null) u = AudioShareProvider.uri(MainActivity.this, sn);
                if (u == null) { toast("শেয়ার করা যায়নি (এই ফোনের Android পুরনো)"); return; }
                Intent i = new Intent(Intent.ACTION_SEND);
                // অডিও MIME দিলে WhatsApp "অডিও" ধরে ১৬MB-এ আটকায়; তাই সবসময় সাধারণ ফাইল (ডকুমেন্ট) হিসেবে পাঠানো হয়
                i.setType("application/octet-stream");
                i.putExtra(Intent.EXTRA_STREAM, u);
                i.setClipData(android.content.ClipData.newRawUri("", u));
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                Intent ch = Intent.createChooser(i, "শেয়ার করুন");
                ch.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                runOnUiThread(() -> { try { startActivity(ch); } catch (Exception e) { toast("শেয়ার খোলা যায়নি: " + e.getMessage()); } });
            } catch (Exception e) { toast("শেয়ার করা যায়নি: " + e.getMessage()); }
        }

        @JavascriptInterface public void fail(String m) { toast("ডাউনলোড ব্যর্থ: " + m); }

        private void toast(String m) { runOnUiThread(() -> Toast.makeText(MainActivity.this, m, Toast.LENGTH_LONG).show()); }
    }
}
