package com.dailyruqyah.app;

import android.Manifest;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import kotlin.Unit;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.RemoteViews;

// টাইম উইজেট: সেটিংস পর্দা খোলা, হোম স্ক্রিনে বসানো, এবং অ্যাপের ভেতরের কার্ডের সাথে সেটিং/অবস্থান ভাগ করা।
// নেটিভ উইজেট (Cfg) আর অ্যাপের ওয়েব-কার্ড (widget.js) যেন সবসময় হুবহু একই সময় দেখায়, তাই কার্ড এখান থেকেই অবস্থান, সমন্বয় ও হানাফি-সেটিং নেয়।
@CapacitorPlugin(name = "TimeWidgetNative")
public class WidgetPlugin extends Plugin {

    private JSObject cfgJson() {
        Context c = getContext();
        Cfg cfg = new Cfg(c);
        JSObject r = new JSObject();
        r.put("lat", cfg.lat());
        r.put("lng", cfg.lng());
        r.put("hanafi", cfg.getHanafi());
        JSArray off = new JSArray();
        for (int i = 0; i < 5; i++) off.put(cfg.off(i));
        r.put("off", off);
        r.put("place", cfg.placeName());
        r.put("auto", cfg.getAuto());
        r.put("located", cfg.autoFix() != null);
        r.put("hasPerm", LocationUpdater.INSTANCE.hasPerm(c));
        r.put("hasBg", LocationUpdater.INSTANCE.hasBg(c));
        r.put("hijriShift", cfg.hijriShift());
        r.put("banglaAdj", cfg.getBanglaAdj());
        r.put("bnDigits", cfg.getBnDigits());
        return r;
    }

    // বর্তমান সেটিং (অবস্থান, সমন্বয়, হানাফি ইত্যাদি) — উইজেটের সাথে হুবহু এক
    @PluginMethod
    public void config(PluginCall call) {
        try {
            LocationUpdater.INSTANCE.sync(getContext()); // ফোনের সর্বশেষ জানা অবস্থান (নতুন করে খোঁজে না)
            call.resolve(cfgJson());
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    // অবস্থান হাল-নাগাদ করা। অনুমতি না থাকলে ও ask = true হলে একবার অনুমতি চায় (উইজেট-সেটিংস না খুললেও যেন অবস্থান পায়)
    @PluginMethod
    public void locate(PluginCall call) {
        try {
            final Context c = getContext();
            boolean asked = false;
            if (!LocationUpdater.INSTANCE.hasPerm(c)) {
                if (Boolean.TRUE.equals(call.getBoolean("ask", false)) && getActivity() != null && new Cfg(c).getAuto()) {
                    ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.ACCESS_COARSE_LOCATION}, 4412);
                    asked = true;
                }
            } else {
                LocationUpdater.INSTANCE.sync(c);
                LocationUpdater.INSTANCE.register(c);
                LocationUpdater.INSTANCE.fresh(c, () -> {
                    ClockWidget.Companion.refresh(c);
                    return Unit.INSTANCE;
                });
            }
            JSObject r = cfgJson();
            r.put("asked", asked);
            call.resolve(r);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    private void toast(final String m) {
        new Handler(Looper.getMainLooper()).post(() -> {
            try { android.widget.Toast.makeText(getContext().getApplicationContext(), m, android.widget.Toast.LENGTH_LONG).show(); } catch (Exception e) { }
        });
    }

    // "আপডেট লোকেশন" চাপলে: অনুমতি না থাকলে চায় (বারবার না বললে অ্যাপের অনুমতি-পাতা খোলে), ফোনের লোকেশন বন্ধ থাকলে
    // চালু করার সেটিংস খোলে, নইলে এখনই নতুন অবস্থান নিয়ে ফল টোস্টে জানায়। status: perm | off | ok | fail
    @PluginMethod
    public void update(final PluginCall call) {
        try {
            final Context c = getContext().getApplicationContext();
            final Cfg cfg = new Cfg(c);
            if (!cfg.getAuto()) cfg.setAuto(true); // সরাসরি চেপেছেন, তাই স্বয়ংক্রিয় অবস্থান চালু
            if (!LocationUpdater.INSTANCE.hasPerm(c)) {
                android.content.SharedPreferences sp = c.getSharedPreferences("locask", Context.MODE_PRIVATE);
                int n = sp.getInt("n", 0);
                if (n < 2 && getActivity() != null) {
                    sp.edit().putInt("n", n + 1).apply();
                    ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION}, 4412);
                } else {
                    LocationUpdater.INSTANCE.openAppSettings(c);
                    toast("অনুমতি → লোকেশন → “অ্যাপ ব্যবহারের সময় অনুমতি দিন” বেছে নিন");
                }
                JSObject r = cfgJson(); r.put("status", "perm"); call.resolve(r);
                return;
            }
            if (!LocationUpdater.INSTANCE.servicesOn(c)) {
                LocationUpdater.INSTANCE.openLocationSettings(c);
                toast("ফোনের লোকেশন বন্ধ আছে — চালু করে ফিরে এসে আবার চাপুন");
                JSObject r = cfgJson(); r.put("status", "off"); call.resolve(r);
                return;
            }
            LocationUpdater.INSTANCE.sync(c);
            LocationUpdater.INSTANCE.register(c);
            final java.util.concurrent.atomic.AtomicBoolean done = new java.util.concurrent.atomic.AtomicBoolean(false);
            final Handler h = new Handler(Looper.getMainLooper());
            final kotlin.jvm.functions.Function0<Unit> cancel = LocationUpdater.INSTANCE.freshFix(c, (got, moved) -> {
                if (!done.compareAndSet(false, true)) return Unit.INSTANCE;
                h.removeCallbacksAndMessages(null);
                ClockWidget.Companion.refresh(c);
                JSObject r = cfgJson();
                r.put("status", got ? "ok" : "fail");
                if (got) toast((moved ? "✓ অবস্থান হালনাগাদ হয়েছে: " : "✓ অবস্থান ঠিকই আছে: ") + new Cfg(c).placeName());
                else toast("অবস্থান পাওয়া যায়নি — ফোনের লোকেশন ও নেটওয়ার্ক চালু আছে কিনা দেখুন");
                call.resolve(r);
                return Unit.INSTANCE;
            });
            toast("📍 অবস্থান খোঁজা হচ্ছে…");
            h.postDelayed(() -> {
                if (!done.compareAndSet(false, true)) return;
                try { cancel.invoke(); } catch (Exception e) { }
                JSObject r = cfgJson(); r.put("status", "fail");
                toast("অবস্থান পাওয়া যায়নি — ফোনের লোকেশন ও নেটওয়ার্ক চালু আছে কিনা দেখুন");
                call.resolve(r);
            }, 12000);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), WidgetSettingsActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void pin(PluginCall call) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(getContext());
            ClockWidget.pushPreview(getContext(), true); // শিটে আসল (লাইভ) প্রিভিউ
            boolean ok = m.isRequestPinAppWidgetSupported() && m.requestPinAppWidget(new ComponentName(getContext(), ClockWidget.class), null, null);
            JSObject r = new JSObject();
            r.put("ok", ok);
            call.resolve(r);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    // ───── অ্যাপের ভেতরে হোম-স্ক্রিনের উইজেটটাই (একই RemoteViews) ওয়েবপেজের নির্দিষ্ট জায়গায় বসানো ─────
    private View cardView;
    private int cardW = 0;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private final Runnable tick = new Runnable() {
        @Override public void run() {
            if (cardView != null && cardView.getVisibility() == View.VISIBLE) redraw();
            ui.postDelayed(this, 3000);
        }
    };

    private void redraw() {
        try {
            RemoteViews rv = ClockWidget.Companion.viewForCard(getContext(), cardW);
            rv.reapply(getContext(), cardView);
        } catch (Exception e) { }
    }

    @PluginMethod
    public void card(final PluginCall call) {
        final boolean vis = Boolean.TRUE.equals(call.getBoolean("visible", true));
        final double x = call.getDouble("x", 0.0), y = call.getDouble("y", 0.0), w = call.getDouble("w", 0.0);
        getActivity().runOnUiThread(() -> {
            try {
                float d = getContext().getResources().getDisplayMetrics().density;
                ViewGroup parent = (ViewGroup) getBridge().getWebView().getParent();
                int wdp = (int) Math.max(200, Math.round(w));
                if (cardView == null || cardW != wdp) {
                    if (cardView != null) parent.removeView(cardView);
                    cardW = wdp;
                    RemoteViews rv = ClockWidget.Companion.viewForCard(getContext(), wdp);
                    cardView = rv.apply(getContext(), parent);
                    // কার্ডে চাপলে (ওয়াক্তের ঘর বাদে) উইজেট-সেটিংস খোলে
                    cardView.setOnClickListener(v -> {
                        try {
                            Intent i = new Intent(getContext(), WidgetSettingsActivity.class);
                            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            getContext().startActivity(i);
                        } catch (Exception e) { }
                    });
                    parent.addView(cardView, new ViewGroup.LayoutParams((int) (wdp * d), ViewGroup.LayoutParams.WRAP_CONTENT));
                    ui.removeCallbacks(tick);
                    ui.postDelayed(tick, 3000);
                }
                cardView.measure(View.MeasureSpec.makeMeasureSpec((int) (wdp * d), View.MeasureSpec.EXACTLY),
                        View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED));
                cardView.layout(0, 0, cardView.getMeasuredWidth(), cardView.getMeasuredHeight());
                View wv = getBridge().getWebView();
                cardView.setTranslationX((float) (x * d) + wv.getLeft());
                cardView.setTranslationY((float) (y * d) + wv.getTop());
                cardView.setVisibility(vis ? View.VISIBLE : View.INVISIBLE);
                cardView.bringToFront();
                if (vis) redraw();
                JSObject r = new JSObject();
                r.put("h", cardView.getMeasuredHeight() / d);
                call.resolve(r);
            } catch (Exception e) {
                call.reject(String.valueOf(e.getMessage()));
            }
        });
    }
}
