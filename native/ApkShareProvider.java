package com.dailyruqyah.app;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

// অ্যাপের নিজের APK "Daily Ruqyah 18.4MB.apk" নামে শেয়ার করতে দেয় (সাইজ APK থেকে প্রতিবার হিসাব হয়):
// শেয়ার-শিটে ও যাকে পাঠানো হয় তার ফোনে এই নামই দেখায়
public class ApkShareProvider extends ContentProvider {
    public static final String NAME = "Daily Ruqyah.apk";

    // নামের সাথে সাইজ: "Daily Ruqyah 18.4MB.apk" (ব্রাকেট নেই, সংখ্যা ও MB লাগানো)
    static String displayName(Context c) {
        long len = new File(c.getApplicationInfo().sourceDir).length();
        if (len <= 0) return NAME;
        double mb = len / 1048576.0;
        String size = mb >= 100 ? String.valueOf(Math.round(mb)) : String.format(java.util.Locale.US, "%.1f", mb);
        return "Daily Ruqyah " + size + "MB.apk";
    }

    public static Uri uri(Context c) {
        return new Uri.Builder().scheme("content").authority(c.getPackageName() + ".apkshare").appendPath(displayName(c)).build();
    }

    private File apk() {
        return new File(getContext().getApplicationInfo().sourceDir);
    }

    @Override public boolean onCreate() { return true; }

    @Override public String getType(Uri uri) { return "application/vnd.android.package-archive"; }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        String[] cols = projection != null ? projection : new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE};
        MatrixCursor cur = new MatrixCursor(cols);
        Object[] row = new Object[cols.length];
        for (int i = 0; i < cols.length; i++) {
            if (OpenableColumns.DISPLAY_NAME.equals(cols[i])) row[i] = displayName(getContext());
            else if (OpenableColumns.SIZE.equals(cols[i])) row[i] = apk().length();
        }
        cur.addRow(row);
        return cur;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        return ParcelFileDescriptor.open(apk(), ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override public Uri insert(Uri uri, ContentValues values) { return null; }
    @Override public int delete(Uri uri, String selection, String[] selectionArgs) { return 0; }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { return 0; }
}
