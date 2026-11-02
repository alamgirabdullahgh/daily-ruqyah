package com.dailyruqyah.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UpdaterPlugin.class);
        registerPlugin(AudioAlarmPlugin.class);
        registerPlugin(WidgetPlugin.class);
        super.onCreate(savedInstanceState);
        BgUpdater.schedule(this, 60 * 1000L); // অ্যাপ খোলার ১ মিনিট পর থেকে ব্যাকগ্রাউন্ড আপডেট-পাহারা চালু
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
}
