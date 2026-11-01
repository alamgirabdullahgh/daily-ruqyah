package com.dailyruqyah.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

// রুকইয়াহ অডিও অ্যালার্ম: তালিকা রাখা/বসানো, এখনই চালিয়ে দেখা, বন্ধ করা, অনুমতি
@CapacitorPlugin(name = "AudioAlarm")
public class AudioAlarmPlugin extends Plugin {

    private JSObject state() throws Exception {
        JSObject r = new JSObject();
        r.put("alarms", new JSArray(AlarmStore.load(getContext()).toString()));
        r.put("exact", AlarmStore.canExact(getContext()));
        boolean n = Build.VERSION.SDK_INT < 33 || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
        r.put("notif", n);
        r.put("playing", RuqyahAudioService.playing);
        return r;
    }

    @PluginMethod
    public void list(PluginCall call) {
        try { call.resolve(state()); } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
    }

    @PluginMethod
    public void save(PluginCall call) {
        try {
            JSArray a = call.getArray("alarms");
            AlarmStore.save(getContext(), new JSONArray(a.toString()));
            AlarmStore.scheduleAll(getContext());
            call.resolve(state());
        } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
    }

    @PluginMethod
    public void testPlay(PluginCall call) {
        try {
            JSObject al = call.getObject("alarm");
            Intent s = new Intent(getContext(), RuqyahAudioService.class).putExtra("alarm", al.toString());
            ContextCompat.startForegroundService(getContext(), s);
            call.resolve();
        } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            getContext().startService(new Intent(getContext(), RuqyahAudioService.class).setAction(RuqyahAudioService.STOP));
        } catch (Exception e) { }
        call.resolve();
    }

    @PluginMethod
    public void requestNotif(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= 33 && getActivity() != null) {
                ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.POST_NOTIFICATIONS}, 4411);
            }
        } catch (Exception e) { }
        call.resolve();
    }

    @PluginMethod
    public void openExactSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= 31) {
                Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getContext().getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            }
        } catch (Exception e) { }
        call.resolve();
    }
}
