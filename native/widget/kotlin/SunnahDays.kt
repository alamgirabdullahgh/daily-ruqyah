package com.dailyruqyah.app

import android.content.Context
import org.json.JSONObject
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.chrono.HijrahDate
import java.time.temporal.ChronoField

// সুন্নাহ-স্মরণের নিয়ম ও লেখা কোডে নেই: অ্যাপের একই ফাইল data/sunnah.json থেকে পড়ে
// (অ্যাপের ভেতরের উইজেট ও হোমও এটাই পড়ে; তাই এক জায়গায় বদলালেই সবখানে বদলায়)।
object Sunnah {
    private var cache: JSONObject? = null

    private fun rules(ctx: Context): JSONObject? {
        cache?.let { return it }
        return try {
            val txt = ctx.assets.open("public/data/sunnah.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
            JSONObject(txt).also { cache = it }
        } catch (e: Exception) { null }
    }

    private fun hij(d: LocalDate, shift: Int): Pair<Int, Int> {
        val h = HijrahDate.from(d.plusDays(shift.toLong()))
        return h.get(ChronoField.MONTH_OF_YEAR) to h.get(ChronoField.DAY_OF_MONTH)
    }

    private fun ints(a: org.json.JSONArray?): Set<Int>? {
        if (a == null) return null
        val s = HashSet<Int>(); for (i in 0 until a.length()) s.add(a.getInt(i)); return s
    }

    /** আজ থেকে দেখানোর মতো সুন্নাহ-বার্তার তালিকা (আজকেরগুলো আগে); কিছু না থাকলে ফাঁকা */
    fun items(ctx: Context, today: LocalDate, hijriShift: Int): List<String> {
        val r = rules(ctx) ?: return emptyList()
        val w = r.getJSONObject("words")
        val tdy = w.getString("today"); val tmr = w.getString("tomorrow"); val start = w.getString("start")
        val lead = r.getInt("lead"); val wl = r.getInt("weeklyLead")
        val en = r.getJSONArray("enMonths")
        val weekly = r.getJSONArray("weekly"); val groups = r.getJSONArray("groups")
        val out = ArrayList<Pair<Int, String>>()
        for (k in 0..lead) {
            val dt = today.plusDays(k.toLong())
            val (m, d) = hij(dt, hijriShift)
            val dow = dt.dayOfWeek.value % 7 // রবি=0 … শনি=৬ (জাভাস্ক্রিপ্টের মতো)
            val whenW = if (k == 0) tdy else tmr
            if (k <= wl) for (i in 0 until weekly.length()) {
                val o = weekly.getJSONObject(i)
                if (o.getInt("dow") == dow) out.add(k to o.getString("text").replace("{d}", whenW))
            }
            for (i in 0 until groups.length()) {
                val g = groups.getJSONObject(i)
                val a = g.getInt("a"); val b = g.getInt("b")
                if (d < a || d > b) continue
                val only = ints(g.optJSONArray("only")); val skip = ints(g.optJSONArray("skip"))
                if (only != null && m !in only) continue
                if (skip != null && m in skip) continue
                val t = g.getString("t")
                val suf = if (g.optBoolean("range")) " $start" else ""
                if (k == 0) out.add(0 to "$tdy $t")
                else if (d == a) out.add(k to (
                    if (k == 1) "$tmr $t$suf"
                    else Bn.num(dt.dayOfMonth) + " " + en.getString(dt.monthValue - 1) + " " + t + suf
                ))
            }
        }
        return out.sortedBy { it.first }.map { it.second }.distinct().take(6)
    }
}
