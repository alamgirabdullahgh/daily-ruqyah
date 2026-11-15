package com.dailyruqyah.app;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;

// ব্যাকগ্রাউন্ড আপডেট-পাহারা JobScheduler-এ: ব্রডকাস্ট রিসিভারের ~১০ সেকেন্ডের সীমা নেই, নেটওয়ার্ক এলেই চলে, বড় APK নামানোর সময়ও টিকে থাকে
public class UpdateJobService extends JobService {
    static final int JID = 7701;

    static void kick(Context c) {
        try {
            JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            js.schedule(new JobInfo.Builder(JID, new ComponentName(c, UpdateJobService.class))
                    .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).build());
        } catch (Exception e) { }
    }

    @Override
    public boolean onStartJob(final JobParameters p) {
        final Context app = getApplicationContext();
        new Thread(() -> {
            try { BgUpdater.backgroundCheck(app, 8 * 60 * 1000L); } catch (Exception e) { }
            finally { jobFinished(p, false); }
        }, "dr-update-job").start();
        return true;
    }

    @Override public boolean onStopJob(JobParameters p) { return true; } // মাঝপথে থামলে আবার চালাবে
}
