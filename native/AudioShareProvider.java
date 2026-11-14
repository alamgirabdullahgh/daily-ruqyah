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

// অডিও শেয়ারের জন্য: ফাইলটা WhatsApp-কে "সাধারণ ফাইল" (application/octet-stream) হিসেবে দেখায়, অডিও/মিডিয়া হিসেবে নয়।
// তাই WhatsApp এটাকে ডকুমেন্ট হিসেবে পাঠায় (হাতে "ডকুমেন্ট" বেছে ফাইল পাঠানোর মতো), ১৬MB মিডিয়া-সীমা লাগে না।
public class AudioShareProvider extends ContentProvider {
    public static File dir(Context c) {
        File d = new File(c.getCacheDir(), "share");
        d.mkdirs();
        return d;
    }

    public static Uri uri(Context c, String name) {
        return new Uri.Builder().scheme("content").authority(c.getPackageName() + ".audioshare").appendPath(name).build();
    }

    private File file(Uri uri) {
        String n = uri.getLastPathSegment();
        if (n == null || n.contains("/") || n.contains("..")) return null;
        return new File(dir(getContext()), n);
    }

    @Override public boolean onCreate() { return true; }

    @Override public String getType(Uri uri) { return "application/octet-stream"; }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        File f = file(uri);
        String[] cols = projection != null ? projection : new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE};
        MatrixCursor cur = new MatrixCursor(cols);
        Object[] row = new Object[cols.length];
        for (int i = 0; i < cols.length; i++) {
            if (OpenableColumns.DISPLAY_NAME.equals(cols[i])) row[i] = uri.getLastPathSegment();
            else if (OpenableColumns.SIZE.equals(cols[i])) row[i] = f != null ? f.length() : 0L;
        }
        cur.addRow(row);
        return cur;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File f = file(uri);
        if (f == null || !f.exists()) throw new FileNotFoundException();
        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override public Uri insert(Uri uri, ContentValues values) { return null; }
    @Override public int delete(Uri uri, String selection, String[] selectionArgs) { return 0; }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { return 0; }
}
