package com.dailyruqyah.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// টাইম উইজেট: সেটিংস পর্দা খোলা ও হোম স্ক্রিনে বসানো
@CapacitorPlugin(name = "TimeWidgetNative")
public class WidgetPlugin extends Plugin {

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
            boolean ok = m.isRequestPinAppWidgetSupported() && m.requestPinAppWidget(new ComponentName(getContext(), ClockWidget.class), null, null);
            JSObject r = new JSObject();
            r.put("ok", ok);
            call.resolve(r);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }
}
