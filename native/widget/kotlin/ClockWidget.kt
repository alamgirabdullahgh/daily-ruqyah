package com.dailyruqyah.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import android.view.View
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.widget.RemoteViews
import android.widget.Toast
import java.time.ZonedDateTime

// হোম স্ক্রিনের একটি উইজেট: সময় + ইংরেজি তারিখ, আরবি + বাংলা তারিখ, পাঁচ ওয়াক্ত নামাজ
class ClockWidget : AppWidgetProvider() {

    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) { LocationUpdater.register(ctx); refresh(ctx) }
    override fun onEnabled(ctx: Context) { LocationUpdater.register(ctx); refresh(ctx) }
    override fun onDisabled(ctx: Context) = cancel(ctx)
    override fun onAppWidgetOptionsChanged(ctx: Context, mgr: AppWidgetManager, id: Int, opts: Bundle) = refresh(ctx)

    override fun onReceive(ctx: Context, intent: Intent) {
        super.onReceive(ctx, intent)
        when (intent.action) {
            ACTION_PICK -> pick(ctx, intent.getIntExtra("idx", -1))
            // "আপডেট লোকেশন": এখনই নতুন অবস্থান চায় (নেট লাগে); পেলে উইজেট নিজে নতুন হয়
            ACTION_LOCUPD -> locUpdate(ctx)
            ACTION_PIN -> pinWidget(ctx)
            // রিবুট বা অ্যাপ আপডেটের পর অবস্থানের অনুরোধ আবার চালু করতে হয়
            Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED -> {
                LocationUpdater.register(ctx); refresh(ctx)
            }
            ACTION_TICK, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_DATE_CHANGED -> {
                refresh(ctx)
            }
        }
    }

    // হোম স্ক্রিনে উইজেট যুক্ত করার অনুরোধ (ফোন নিজেই "যুক্ত করবেন?" জিজ্ঞেস করে); লঞ্চার না মানলে হাতে বসানোর নির্দেশ
    private fun pinWidget(ctx: Context) {
        val app = ctx.applicationContext
        val ok = try {
            val m = AppWidgetManager.getInstance(app)
            pushPreview(app, true)
            m.isRequestPinAppWidgetSupported && m.requestPinAppWidget(ComponentName(app, ClockWidget::class.java), null, null)
        } catch (e: Exception) { false }
        if (!ok) Handler(Looper.getMainLooper()).post {
            try { Toast.makeText(app, "হোম স্ক্রিনের ফাঁকা জায়গায় চেপে ধরে ‘উইজেট’ থেকে “টাইম উইজেট” বেছে নিন", Toast.LENGTH_LONG).show() } catch (e: Exception) { }
        }
    }

    // "আপডেট লোকেশন": এখনই নতুন অবস্থান নেয় ও ফলাফল টোস্টে জানায়।
    // ব্রডকাস্ট ধরে রাখার সীমা ১০ সেকেন্ড — তার বেশি হলে অ্যাপ "responding করছে না" দেখায় (আগের ১৫ সেকেন্ডের অপেক্ষায় এটাই হতো), তাই সময়সীমা ৮ সেকেন্ড।
    private fun locUpdate(ctx: Context) {
        val app = ctx.applicationContext
        val ui = Handler(Looper.getMainLooper())
        fun say(m: String) { ui.post { try { Toast.makeText(app, m, Toast.LENGTH_SHORT).show() } catch (e: Exception) { } } }
        if (!Cfg(app).auto) Cfg(app).auto = true // সরাসরি চেপেছেন, তাই স্বয়ংক্রিয় অবস্থান চালু
        if (!LocationUpdater.hasPerm(app)) {
            say("আগে অবস্থানের অনুমতি দিন")
            try { app.startActivity(Intent(app, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (e: Exception) { }
            return
        }
        if (!LocationUpdater.servicesOn(app)) {
            say("ফোনের লোকেশন বন্ধ আছে — চালু করে আবার চাপুন")
            LocationUpdater.openLocationSettings(app)
            return
        }
        val pr = goAsync()
        val timer = Handler(Looper.getMainLooper())
        val done = java.util.concurrent.atomic.AtomicBoolean(false)
        var cancel: (() -> Unit)? = null
        val fin = {
            if (done.compareAndSet(false, true)) {
                timer.removeCallbacksAndMessages(null)
                try { cancel?.invoke() } catch (e: Exception) { }
                try { pr.finish() } catch (e: Exception) { }
            }
        }
        val fail = "অবস্থান পাওয়া যায়নি — ফোনের লোকেশন ও নেটওয়ার্ক চালু আছে কিনা দেখুন"
        try {
            LocationUpdater.sync(app); refresh(app)
            say("📍 অবস্থান খোঁজা হচ্ছে…")
            cancel = LocationUpdater.freshFix(app) { got, moved ->
                refresh(app)
                say(if (!got) fail else if (moved) "✓ অবস্থান হালনাগাদ হয়েছে: " + Cfg(app).placeName() else "✓ অবস্থান ঠিকই আছে: " + Cfg(app).placeName())
                fin()
            }
            timer.postDelayed({ if (!done.get()) { say(fail); fin() } }, 8000)
        } catch (e: Exception) { fin() }
    }

    // ws/we = প্রতিটি ওয়াক্তের শুরু ও শেষ (আজ মধ্যরাত থেকে মিনিট; ইশার শেষ পরদিনের ফজরে, তাই ১৪৪০ ছাড়াতে পারে / ফজরের আগে ইশার শুরু ঋণাত্মক হতে পারে); nowMin = এখন (ভগ্নাংশসহ মিনিট)
    class Snap(
        val hijri: String, val bangla: String, val min: IntArray, val cur: Int, val nextAt: Long, val sunrise: Int, val sunset: Int,
        val ws: IntArray, val we: IntArray, val nowMin: Double,
        val tahajjud: Int // তাহাজ্জুদের শুরু = রাতের (সূর্যাস্ত→ফজর) শেষ তৃতীয়াংশের শুরু; শেষ = ফজর (we[4])
    )

    // নফল সালাতের সময়: নাম, শুরু, শেষ (মিনিট)
    class Nafl(val name: String, val start: Int, val end: Int)

    companion object {
        const val ACTION_TICK = "com.rahcare.timewidget.TICK"
        const val ACTION_PICK = "com.rahcare.timewidget.PICK"
        const val ACTION_LOCUPD = "com.dailyruqyah.app.LOCUPD"
        const val ACTION_PIN = "com.dailyruqyah.app.PIN"
        private const val TICK_MS = 5 * 60 * 1000L // প্রগ্রেস বার নতুন করে আঁকার ব্যবধান
        private const val DUHA_AFTER_SUNRISE = 24 // ইশরাক শুরু (নিষিদ্ধ সময় শেষ): সূর্যোদয়ের ২৪ মিনিট পর (ইসলামিক ফাউন্ডেশনের স্থায়ী সময়সূচির নোট)
        private const val ISHRAQ_END_AFTER_SUNRISE = 60 // ইশরাকের সময় শেষ ধরা হয়েছে: সূর্যোদয়ের প্রায় ১ ঘণ্টা পর; এরপর সালাতুদ্দোহা (চাশত)
        private const val DUHA_BEFORE_DHUHR = 6 // চাশত শেষ: যোহরের লেখা সময়ের ৬ মিনিট আগে (ইসলামিক ফাউন্ডেশনের নোট)
        val NAMES = arrayOf("ফজর", "যোহর", "আসর", "মাগরিব", "ইশা")
        private val CELL = intArrayOf(R.id.c0, R.id.c1, R.id.c2, R.id.c3, R.id.c4)
        private val NAME = intArrayOf(R.id.n0, R.id.n1, R.id.n2, R.id.n3, R.id.n4)
        private val TIME = intArrayOf(R.id.t0, R.id.t1, R.id.t2, R.id.t3, R.id.t4)

        // আজকের সব হিসাব
        fun compute(ctx: Context, now: ZonedDateTime = ZonedDateTime.now()): Snap {
            val c = Cfg(ctx)
            val zone = now.zone
            val date = now.toLocalDate()
            val tz = zone.rules.getOffset(now.toInstant()).totalSeconds / 3600.0
            val t = Prayer.times(date, c.lat(), c.lng(), tz, 18.0, 18.0, c.hanafi)
            val m = intArrayOf(
                Prayer.minutes(t.fajr) + c.off(0), Prayer.minutes(t.dhuhr) + c.off(1), Prayer.minutes(t.asr) + c.off(2),
                Prayer.minutes(t.maghrib) + c.off(3), Prayer.minutes(t.isha) + c.off(4)
            )
            val nowMin = now.hour * 60 + now.minute
            var cur = 4 // ফজরের আগে হলে আগের রাতের ইশার ওয়াক্ত চলছে
            for (i in 0..4) if (m[i] <= nowMin) cur = i

            val start = date.atStartOfDay(zone).toInstant().toEpochMilli()
            var next = date.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli() + 5000L
            for (i in 0..4) if (m[i] > nowMin) next = minOf(next, start + m[i] * 60000L)

            // প্রতিটি ওয়াক্তের শুরু ও শেষ: ফজর→সূর্যোদয়, যোহর→আসরের শুরু, আসর→সূর্যাস্ত, মাগরিব→ইশার শুরু, ইশা→পরদিনের ফজর
            val sunriseMin = Prayer.minutes(t.sunrise)
            val sunsetMin = Prayer.minutes(t.maghrib)
            val ws = m.copyOf()
            val we = intArrayOf(sunriseMin, m[2], sunsetMin, m[4], 0)
            val nightStart: Int // চলতি রাতের শুরু = সূর্যাস্ত (আজ মধ্যরাত থেকে মিনিট)
            if (nowMin < m[0]) {
                // ফজরের আগে: চলতি ইশা গতকালের, শেষ আজকের ফজরে
                val y = Prayer.times(date.minusDays(1), c.lat(), c.lng(), tz, 18.0, 18.0, c.hanafi)
                ws[4] = Prayer.minutes(y.isha) + c.off(4) - 1440
                we[4] = m[0]
                nightStart = Prayer.minutes(y.maghrib) - 1440
            } else {
                val tomorrow = date.plusDays(1)
                val tz2 = zone.rules.getOffset(tomorrow.atStartOfDay(zone).toInstant()).totalSeconds / 3600.0
                val n = Prayer.times(tomorrow, c.lat(), c.lng(), tz2, 18.0, 18.0, c.hanafi)
                we[4] = Prayer.minutes(n.fajr) + c.off(0) + 1440
                nightStart = sunsetMin
            }
            // তাহাজ্জুদ: সূর্যাস্ত থেকে ফজর পর্যন্ত সময়কে তিন ভাগ করে শেষ ভাগের শুরু
            val tahajjud = nightStart + ((we[4] - nightStart) * 2.0 / 3.0).toInt()
            val nowF = nowMin + now.second / 60.0

            return Snap(
                HijriDate.text(date.plusDays(c.hijriShift().toLong())),
                BanglaDate.text(date.plusDays(c.banglaAdj.toLong())),
                m, cur, next, sunriseMin, sunsetMin, ws, we, nowF, tahajjud
            )
        }

        // চলতি ওয়াক্তের সাথে সংশ্লিষ্ট নফল সালাত (না থাকলে null):
        //  ফজরের ওয়াক্ত শেষে (সূর্যোদয়ের পর, যোহরের আগে): ইশরাক → সালাতুদ্দোহা (চাশত)
        //  মাগরিব: আউয়াবীন (মাগরিবের পর থেকে ইশার শুরু পর্যন্ত)
        //  ইশা: তাহাজ্জুদ (রাতের শেষ তৃতীয়াংশ থেকে ফজর পর্যন্ত)
        fun nafl(s: Snap, cur: Int): Nafl? {
            val ishraqStart = s.sunrise + DUHA_AFTER_SUNRISE
            val ishraqEnd = (s.sunrise + ISHRAQ_END_AFTER_SUNRISE).coerceAtMost(s.min[1] - DUHA_BEFORE_DHUHR - 1)
            val duhaEnd = (s.min[1] - DUHA_BEFORE_DHUHR).coerceAtLeast(ishraqEnd + 1)
            return when {
                cur == 0 && s.nowMin >= s.sunrise && s.nowMin < s.min[1] ->
                    if (s.nowMin < ishraqEnd) Nafl("ইশরাক", ishraqStart, ishraqEnd) else Nafl("সালাতুদ্দোহা", ishraqEnd, duhaEnd)
                cur == 3 -> Nafl("আউয়াবীন", s.ws[3], s.we[3])
                cur == 4 -> Nafl("তাহাজ্জুদ", s.tahajjud, s.we[4])
                else -> null
            }
        }

        // নিচের সারিতে ডিফল্টে নফল দেখানো হবে কি না: ফজর-শেষ থেকে যোহর-শুরুর ফাঁকে, আর রাতের শেষ তৃতীয়াংশে
        // (আউয়াবীন মাগরিবের ওয়াক্তের ভেতরেই, তাই ডিফল্টে মাগরিব দেখায়; মাগরিবের ঘরে চাপলে আউয়াবীন দেখায়)
        private fun naflByDefault(s: Snap): Boolean = when (s.cur) {
            0 -> nafl(s, 0) != null
            4 -> s.nowMin >= s.tahajjud
            else -> false
        }

        // দুই তারিখ এক লাইনে ধরাতে উইজেটের প্রস্থ মেপে লেখা প্রয়োজনে ছোট হয়
        private fun fitSp(ctx: Context, a: String, b: String, baseSp: Float, widthDp: Int): Float {
            val dm = ctx.resources.displayMetrics
            val avail = (widthDp - 28 - 8) * dm.density * 0.93f
            val p = Paint(Paint.ANTI_ALIAS_FLAG)
            p.textSize = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, baseSp, dm)
            val need = p.measureText(a) + p.measureText(b)
            return if (need <= avail || need <= 0f) baseSp else (baseSp * avail / need).coerceAtLeast(baseSp * 0.55f)
        }

        private fun build(ctx: Context, s: Snap, widthDp: Int, layout: Int = R.layout.widget_v2, pin: Boolean = false, withSl: Boolean = true): RemoteViews {
            val c = Cfg(ctx)
            val rv = RemoteViews(ctx.packageName, layout)
            val k = c.scale / 100f
            fun size(id: Int, sp: Float) = rv.setTextViewTextSize(id, TypedValue.COMPLEX_UNIT_SP, sp * k)

            rv.setTextViewText(R.id.zz_loc, c.placeName())
            size(R.id.zz_loc, 12f)
            rv.setTextViewText(R.id.hijri, s.hijri)
            rv.setTextViewText(R.id.bangla, s.bangla)
            size(R.id.time, 30f); size(R.id.ampm, 12f); size(R.id.endate, 14f)
            val dsp = fitSp(ctx, s.hijri, s.bangla, 12f * k, widthDp)
            rv.setTextViewTextSize(R.id.hijri, TypedValue.COMPLEX_UNIT_SP, dsp)
            rv.setTextViewTextSize(R.id.bangla, TypedValue.COMPLEX_UNIT_SP, dsp)
            rv.setTextViewText(R.id.zz_sunrise, "সূর্যোদয় " + Prayer.fmt(s.sunrise, c.bnDigits))
            rv.setTextViewText(R.id.zz_sunset, "সূর্যাস্ত " + Prayer.fmt(s.sunset, c.bnDigits))
            size(R.id.zz_sunrise, 11f); size(R.id.zz_sunset, 11f)
            // সূর্যোদয় থেকে সূর্যাস্ত পর্যন্ত উপরে গোল রেখা; এখনকার সময় অনুযায়ী সূর্য তার ওপর দিয়ে এগোয় (রাতে শুধু রেখা)
            val srf: Double? = if (s.sunset > s.sunrise && s.nowMin >= s.sunrise && s.nowMin <= s.sunset) (s.nowMin - s.sunrise) / (s.sunset - s.sunrise).toDouble() else null
            val dark = (ctx.resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
            // মাঝের অংশের আনুমানিক প্রস্থ = উইজেট − দুই পাশের প্যাডিং − সূর্যোদয়/সূর্যাস্তের লেখা
            val den = ctx.resources.displayMetrics.density
            val lp = Paint(Paint.ANTI_ALIAS_FLAG).apply { textSize = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, 11f * k, ctx.resources.displayMetrics) }
            val sideW = lp.measureText("সূর্যোদয় " + Prayer.fmt(s.sunrise, c.bnDigits)) + lp.measureText("সূর্যাস্ত " + Prayer.fmt(s.sunset, c.bnDigits)) + 2 * 25 * den
            val midPx = ((widthDp - 28 - 8) * den - sideW).toInt()
            val sunLeft = durText(Math.ceil((s.sunset - s.nowMin).coerceAtLeast(0.0)).toInt(), c.bnDigits) + " বাকি"
            rv.setImageViewBitmap(R.id.zz_arc, sunArc(srf, dark, midPx, den, sunLeft))
            // অ্যাপের কার্ডে মাঝখানে "হোম স্ক্রিনে যুক্ত করুন" বোতাম (হোম স্ক্রিনের উইজেটে থাকে না)
            rv.setViewVisibility(R.id.zz_pin, if (pin) View.VISIBLE else View.GONE)
            if (pin) rv.setOnClickPendingIntent(R.id.zz_pin, PendingIntent.getBroadcast(
                ctx, 31, Intent(ctx, ClockWidget::class.java).setAction(ACTION_PIN), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT))
            for (i in 0..4) {
                rv.setTextViewText(NAME[i], NAMES[i])
                rv.setTextViewText(TIME[i], Prayer.fmt(s.min[i], c.bnDigits))
                size(NAME[i], 11f); size(TIME[i], 14f)
                // চলতি ওয়াক্তের ঘরটি হালকা সবুজে চিহ্নিত
                rv.setInt(CELL[i], "setBackgroundResource", if (i == s.cur) R.drawable.cell_on else 0)
                // ঘরে চাপলে নিচের সারিতে সেই ওয়াক্তের শুরু-শেষ দেখায়; একই ঘরে আবার চাপলে চলতি ওয়াক্তে ফেরে
                rv.setOnClickPendingIntent(CELL[i], pickIntent(ctx, i))
            }
            // নিচের সারি: ওয়াক্তের শুরু (বামে) · প্রগ্রেস বার · শেষ (ডানে); ডিফল্টে চলতি ওয়াক্ত।
            // ফজর শেষ (সূর্যোদয়) থেকে যোহর শুরুর মাঝের ফাঁকে ডিফল্টে সালাতুদ্দোহা দেখায় (কোনো ওয়াক্তের ঘরে চাপলে সেটিই দেখায়)
            val shown = shownIndex(c, s)
            val nf = if (shown == NAFL) nafl(s, s.cur) else null
            val bs = nf?.start ?: s.ws[shown.coerceIn(0, 4)]
            val be = nf?.end ?: s.we[shown.coerceIn(0, 4)]
            val span = (be - bs).coerceAtLeast(1)
            val frac = ((s.nowMin - bs) / span).coerceIn(0.0, 1.0)
            rv.setTextViewText(R.id.zz_ws, (if (nf != null) nf.name + " শুরু " else "ওয়াক্ত শুরু ") + Prayer.fmt(bs, c.bnDigits))
            rv.setTextViewText(R.id.zz_we, (if (nf != null) "শেষ " else "ওয়াক্ত শেষ ") + Prayer.fmt(be, c.bnDigits))
            // zz_ws/zz_we: বারের দুই পাশ সমান চওড়া (weight), লেখা বড় হলে XML-এর autoSize-এ ছোট হয়; তাই প্রগ্রেস বার সবসময় মাঝে থাকে
            rv.setProgressBar(R.id.zz_wbar, 1000, (frac * 1000).toInt(), false)
            // বারের ভেতরে বাকি সময়, যেমন "১ ঘন্টা ২৩ মিনিট"; ঘণ্টা না থাকলে শুধু মিনিট
            val cd = durText(Math.ceil((be - s.nowMin).coerceAtLeast(0.0)).toInt(), c.bnDigits) + " বাকি"
            rv.setTextViewText(R.id.zz_cd, cd)
            // সময় ও ইংরেজি তারিখের মাঝে সুন্নাহ-স্লাইডার: একাধিক হলে একে একে বদলায়, একটা হলে স্থির
            // সুন্নাহ-স্লাইডার শুধু তখনই নতুন করে বসে যখন লেখা/মাপ বদলায় (withSl); নইলে চলমান স্লাইডে হাত পড়ে না
            if (withSl) {
                val sn = Sunnah.items(ctx, java.time.LocalDate.now(), c.hijriShift())
                rv.removeAllViews(R.id.zz_sl)
                if (sn.isEmpty()) rv.setViewVisibility(R.id.zz_sl, View.GONE) else {
                    rv.setViewVisibility(R.id.zz_sl, View.VISIBLE)
                    for (t in (if (sn.size == 1) sn + sn else sn)) {
                        val item = RemoteViews(ctx.packageName, R.layout.widget_sl_item)
                        item.setTextViewText(R.id.sl_t, t)
                        // লেখা ছোট করা হয় না; বাক্সের প্রস্থ লেখার সমান, পুরোটা ধীরে ডান থেকে বামে যায়
                        val dm = ctx.resources.displayMetrics
                        val pt = Paint(Paint.ANTI_ALIAS_FLAG).apply { typeface = android.graphics.Typeface.DEFAULT_BOLD; textSize = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, 12f * k, dm) }
                        item.setTextViewTextSize(R.id.sl_t, TypedValue.COMPLEX_UNIT_SP, 12f * k)
                        if (android.os.Build.VERSION.SDK_INT >= 31) {
                            item.setViewLayoutWidth(R.id.sl_t, Math.ceil(pt.measureText(t).toDouble() * 1.2).toFloat() + 24f * dm.density, TypedValue.COMPLEX_UNIT_PX)
                        }
                        rv.addView(R.id.zz_sl, item)
                    }
                }
            }
            val open = PendingIntent.getActivity(
                ctx, 0, Intent(ctx, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            rv.setOnClickPendingIntent(R.id.root, open)
            // অনুমতি না থাকলে সরাসরি অ্যাপ খোলে (সেখানে অনুমতি চায়); নইলে অবস্থান হালনাগাদ — ব্যাকগ্রাউন্ড ব্রডকাস্ট থেকে অ্যাক্টিভিটি খোলা আটকে যেতে পারে বলে এই ভাগ
            rv.setOnClickPendingIntent(R.id.zz_upd,
                if (c.auto && !LocationUpdater.hasPerm(ctx)) PendingIntent.getActivity(
                    ctx, 31, Intent(ctx, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                ) else PendingIntent.getBroadcast(
                    ctx, 30, Intent(ctx, ClockWidget::class.java).setAction(ACTION_LOCUPD),
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                ))
            return rv
        }

        private fun pickIntent(ctx: Context, i: Int): PendingIntent = PendingIntent.getBroadcast(
            ctx, 10 + i, Intent(ctx, ClockWidget::class.java).setAction(ACTION_PICK).putExtra("idx", i),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // নিচের সারিতে এখন কী দেখানো হচ্ছে: 0–৪ = সেই ওয়াক্ত, NAFL = চলতি ওয়াক্তের নফল সালাত
        private const val NAFL = 5
        // চলতি ওয়াক্ত কোন দিনের: ফজরের আগের ইশা গতকালের ওয়াক্ত (পুরনো বাছাই পরদিনের একই ওয়াক্তে ফিরে আসা ঠেকাতে)
        private fun windowDay(s: Snap): Long =
            java.time.LocalDate.now().toEpochDay() - (if (s.cur == 4 && s.nowMin < s.min[0]) 1L else 0L)

        private fun shownIndex(c: Cfg, s: Snap): Int {
            val picked = (c.pick in 0..4 || (c.pick == NAFL && nafl(s, s.cur) != null)) && c.pickCur == s.cur && c.pickDay == windowDay(s)
            return if (picked) c.pick else if (naflByDefault(s)) NAFL else s.cur
        }

        // কোনো ওয়াক্তের ঘরে চাপ: সেটি বেছে নেয়; আবার চাপলে ডিফল্টে ফেরে।
        // চলতি ওয়াক্তের ঘরে চাপলে (সংশ্লিষ্ট নফল থাকলে) নফলের সময় আর ওয়াক্তের সময় পালাক্রমে দেখায়।
        private fun pick(ctx: Context, i: Int) {
            if (i !in 0..4) return
            val c = Cfg(ctx)
            val s = compute(ctx)
            val shown = shownIndex(c, s)
            val target = if (i == s.cur && nafl(s, s.cur) != null) (if (shown == NAFL) s.cur else NAFL) else i
            c.pick = if (target == shown) -1 else target
            c.pickCur = s.cur
            c.pickDay = windowDay(s)
            refresh(ctx)
        }

        private fun tickIntent(ctx: Context): PendingIntent = PendingIntent.getBroadcast(
            ctx, 0, Intent(ctx, ClockWidget::class.java).setAction(ACTION_TICK),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        fun cancel(ctx: Context) {
            (ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(tickIntent(ctx))
        }

        // সব উইজেট নতুন করে আঁকে এবং পরের বদলের (পরের ওয়াক্ত বা মধ্যরাত) জন্য অ্যালার্ম বসায়
        // আগের সংস্করণে চালু হওয়া লক স্ক্রিন নোটিফিকেশন সরিয়ে দেয় (এই সুবিধা আর নেই)
        private fun removeOldLockCard(ctx: Context) {
            try {
                val nm = ctx.getSystemService(android.app.NotificationManager::class.java)
                nm.cancel(4242)
                nm.deleteNotificationChannel("lockcard")
            } catch (e: Exception) {
            }
        }

        // অ্যাপের ভেতরে হুবহু একই উইজেট দেখানোর জন্য (হোম স্ক্রিনের উইজেটের একই RemoteViews)
        @JvmStatic
        fun viewForCard(ctx: Context, widthDp: Int): RemoteViews {
            LocationUpdater.sync(ctx)
            return build(ctx, compute(ctx), widthDp, R.layout.widget_v2, true)
        }

        // "১ ঘন্টা ২৩ মিনিট"; ঘন্টা না থাকলে শুধু মিনিট, মিনিট ০ হলে শুধু ঘন্টা
        private fun durText(left: Int, bn: Boolean): String {
            val lh = left / 60
            val lm = left % 60
            return when {
                lh > 0 && lm > 0 -> Prayer.fmtNum(lh, bn) + " ঘন্টা " + Prayer.fmtNum(lm, bn) + " মি:"
                lh > 0 -> Prayer.fmtNum(lh, bn) + " ঘন্টা"
                else -> Prayer.fmtNum(lm, bn) + " মি:"
            }
        }

        // সূর্যপথের ছবি: wPx × hPx (ImageView-এর মাপের কাছাকাছি, তাই সমানুপাতে ছোট-বড় হয়, লেখা চ্যাপ্টা হয় না)।
        // সূর্য চললে তার ঠিক নিচে সূর্যাস্তের বাকি সময় লেখা থাকে; রাতে শুধু রেখা।
        private fun sunArc(frac: Double?, dark: Boolean, wPx: Int, d: Float, label: String): Bitmap {
            val w = wPx.coerceAtLeast((100 * d).toInt()); val h = (38 * d).toInt()
            val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            val cv = Canvas(bmp)
            val baseY = 24f * d; val topY = 5f * d; val cx = w / 2f; val rx = cx - 5f * d; val ry = baseY - topY
            val oval = RectF(cx - rx, baseY - ry, cx + rx, baseY + ry)
            val track = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                style = Paint.Style.STROKE; strokeWidth = 1.3f * d; strokeCap = Paint.Cap.ROUND
                color = if (dark) 0x77B3C9BB else 0x773B4A55
                pathEffect = DashPathEffect(floatArrayOf(3f * d, 2.6f * d), 0f)
            }
            cv.drawArc(oval, 180f, 180f, false, track)
            if (frac != null) {
                val done = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style = Paint.Style.STROKE; strokeWidth = 1.7f * d; strokeCap = Paint.Cap.ROUND; color = 0xFFFFA000.toInt()
                }
                cv.drawArc(oval, 180f, (180.0 * frac).toFloat(), false, done)
                val a = Math.PI * (1.0 + frac)
                val sx = (cx + rx * Math.cos(a)).toFloat(); val sy = (baseY + ry * Math.sin(a)).toFloat()
                val glow = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    shader = RadialGradient(sx, sy, 8f * d, intArrayOf(0x99FFC21A.toInt(), 0x00FFC21A), null, Shader.TileMode.CLAMP)
                }
                cv.drawCircle(sx, sy, 8f * d, glow)
                val ray = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeWidth = 1f * d; strokeCap = Paint.Cap.ROUND; color = 0xFFFFB300.toInt() }
                for (i in 0 until 8) {
                    val t = Math.PI / 4 * i
                    cv.drawLine((sx + 4.6 * d * Math.cos(t)).toFloat(), (sy + 4.6 * d * Math.sin(t)).toFloat(), (sx + 6.3 * d * Math.cos(t)).toFloat(), (sy + 6.3 * d * Math.sin(t)).toFloat(), ray)
                }
                cv.drawCircle(sx, sy, 3.4f * d, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFB300.toInt() })
                cv.drawCircle(sx, sy, 2.1f * d, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xFFFFE082.toInt() })
                // সূর্যের নিচে বাকি সময়; দুই প্রান্তে কেটে না যায় তাই ভেতরে টেনে আনা
                val tp = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    textSize = 8.5f * d; isFakeBoldText = true; textAlign = Paint.Align.CENTER
                    color = if (dark) 0xFFFFC857.toInt() else 0xFFB36B00.toInt()
                }
                val half = tp.measureText(label) / 2f
                val tx = sx.coerceIn(half + 2f * d, (w - half - 2f * d).coerceAtLeast(half + 2f * d))
                val ty = (sy + 12f * d).coerceAtMost(h - 2f * d)
                cv.drawText(label, tx, ty, tp)
            }
            return bmp
        }

        @JvmStatic
        fun viewFor(ctx: Context, widthDp: Int): RemoteViews {
            LocationUpdater.sync(ctx)
            return build(ctx, compute(ctx), widthDp)
        }

        /** হোম-স্ক্রিনে উইজেট বসানোর তালিকায়/পিন-শিটে লাইভ প্রিভিউ (Android 15+: setWidgetPreview); আগের ভার্সনে এই API নেই, তখন ছবির প্রিভিউই থাকে */
        @JvmStatic
        fun pushPreview(ctx: Context, force: Boolean = false) {
            if (android.os.Build.VERSION.SDK_INT < 35) return
            val now = System.currentTimeMillis()
            if (!force && now - lastPreviewAt < 10 * 60 * 1000L) return
            try {
                lastPreviewAt = now
                val mgr = AppWidgetManager.getInstance(ctx)
                val m = AppWidgetManager::class.java.getMethod("setWidgetPreview", ComponentName::class.java, Int::class.javaPrimitiveType, RemoteViews::class.java)
                m.invoke(mgr, ComponentName(ctx, ClockWidget::class.java), 1, viewFor(ctx, 250))   // 1 = WIDGET_CATEGORY_HOME_SCREEN
            } catch (e: Exception) { }
        }
        @Volatile private var lastPreviewAt = 0L

        // প্রতি উইজেট-আইডির শেষ বসানো সুন্নাহ-স্লাইডারের "ছাপ" (লেখা + মাপ); প্রসেস নতুন হলে খালি, তখন একবার পুরো বসে
        private val slSigs = HashMap<Int, String>()
        private fun slSig(ctx: Context, w: Int): String {
            val c = Cfg(ctx)
            val sn = Sunnah.items(ctx, java.time.LocalDate.now(), c.hijriShift())
            return sn.joinToString("\u0001") + "|" + c.scale + "|" + w
        }

        fun refresh(ctx: Context) {
            removeOldLockCard(ctx)
            pushPreview(ctx)
            try {
                val mgr = AppWidgetManager.getInstance(ctx)
                val ids = mgr.getAppWidgetIds(ComponentName(ctx, ClockWidget::class.java))
                if (ids.isEmpty()) { cancel(ctx); return }
                LocationUpdater.sync(ctx) // ফোনের সর্বশেষ জানা অবস্থান বদলে থাকলে এখানেই ধরে নেয়
                val s = compute(ctx)
                for (id in ids) {
                    val w = mgr.getAppWidgetOptions(id).getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0).let { if (it > 0) it else 250 }
                    // স্লাইডারের লেখা আগের বারের মতোই হলে শুধু বাকি অংশ হালনাগাদ (partial): প্রতিবার স্লাইডার মুছে নতুন বসালে
                    // স্ক্রিন অন হওয়ার সময় চলমান স্লাইডের "ভূত" কপি (লেখা ওপর-ওপর) দেখা যায়
                    val sig = slSig(ctx, w)
                    var done = false
                    synchronized(slSigs) {
                        if (slSigs[id] == sig) {
                            try { mgr.partiallyUpdateAppWidget(id, build(ctx, s, w, withSl = false)); done = true } catch (e: Exception) { }
                        }
                    }
                    if (!done) {
                        mgr.updateAppWidget(id, build(ctx, s, w))
                        synchronized(slSigs) { slSigs[id] = sig }
                    }
                }
                (ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager)
                    .setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, minOf(s.nextAt, System.currentTimeMillis() + TICK_MS), tickIntent(ctx))
            } catch (e: Exception) {
            }
        }
    }
}
