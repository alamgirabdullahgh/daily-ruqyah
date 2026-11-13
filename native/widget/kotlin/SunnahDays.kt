package com.dailyruqyah.app

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.chrono.HijrahDate
import java.time.temporal.ChronoField

// সময় ও ইংরেজি তারিখের মাঝের স্লাইডারে দেখানোর সুন্নাহ-স্মরণ।
// সাপ্তাহিক: সোম-বৃহস্পতির রোজা, শুক্রবারে সূরা কাহফ (১ দিন আগে থেকে)।
// মাসিক/বার্ষিক (হিজরি তারিখ ধরে): আইয়ামে বীজ (১৩-১৫), হিজামার দিন (১৭, ১৯, ২১), আশুরা, আরাফা, শাওয়ালের ছয় রোজা (৩ দিন আগে থেকে)।
object Sunnah {
    private val EN_MONTHS = listOf(
        "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
        "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
    )
    private const val LEAD = 3 // মাসিক/বার্ষিক সুন্নাহ কত দিন আগে থেকে দেখাবে

    // days = হিজরি মাসের কোন কোন তারিখ; months = কোন কোন মাসে (null = সব); skip = যে মাসে নয়
    private class G(val title: String, val days: IntRange, val months: Set<Int>?, val skip: Set<Int>, val range: Boolean)

    private val GROUPS = listOf(
        // রমজান (৯) ও জিলহজ (১২; আইয়ামে তাশরীকে রোজা নিষেধ) বাদ
        G("আইয়ামে বীজের রোজা", 13..15, null, setOf(9, 12), true),
        G("হিজামার সুন্নাহ দিন", 17..17, null, emptySet(), false),
        G("হিজামার সুন্নাহ দিন", 19..19, null, emptySet(), false),
        G("হিজামার সুন্নাহ দিন", 21..21, null, emptySet(), false),
        G("আশুরার রোজা", 9..10, setOf(1), emptySet(), true),
        G("আরাফার দিনের রোজা", 9..9, setOf(12), emptySet(), false),
        G("শাওয়ালের ছয় রোজা", 2..29, setOf(10), emptySet(), true)
    )

    private fun hij(d: LocalDate, shift: Int): Pair<Int, Int> {
        val h = HijrahDate.from(d.plusDays(shift.toLong()))
        return h.get(ChronoField.MONTH_OF_YEAR) to h.get(ChronoField.DAY_OF_MONTH)
    }

    private fun inGroup(g: G, m: Int, d: Int) = d in g.days && (g.months == null || m in g.months) && m !in g.skip

    private fun weekday(d: DayOfWeek) = when (d) {
        DayOfWeek.MONDAY -> "সোমবার"
        DayOfWeek.THURSDAY -> "বৃহস্পতিবার"
        else -> "শুক্রবার"
    }

    /** আজ থেকে দেখানোর মতো সুন্নাহ-বার্তার তালিকা (আজকেরগুলো আগে); কিছু না থাকলে ফাঁকা */
    fun items(today: LocalDate, hijriShift: Int): List<String> {
        val out = ArrayList<Pair<Int, String>>()
        for (k in 0..LEAD) {
            val dt = today.plusDays(k.toLong())
            val (m, d) = hij(dt, hijriShift)

            // সাপ্তাহিক: আজ ও আগামীকাল
            if (k <= 1) {
                val dow = dt.dayOfWeek
                if (dow == DayOfWeek.MONDAY || dow == DayOfWeek.THURSDAY) {
                    out.add(k to (if (k == 0) "আজ " + weekday(dow) + " — সুন্নাহ রোজা রাখুন" else "আগামীকাল " + weekday(dow) + " — সুন্নাহ রোজা"))
                } else if (dow == DayOfWeek.FRIDAY) {
                    out.add(k to (if (k == 0) "আজ জুমুআ — সূরা কাহফ পড়ুন" else "আগামীকাল শুক্রবার — সূরা কাহফ পড়ুন"))
                }
            }

            // মাসিক/বার্ষিক
            for (g in GROUPS) {
                if (!inGroup(g, m, d)) continue
                val suffix = if (g.range) " শুরু" else ""
                if (k == 0) {
                    out.add(0 to "আজ " + g.title)
                } else if (d == g.days.first) {
                    out.add(k to (
                        if (k == 1) "আগামীকাল " + g.title + suffix
                        else "আগামী " + Bn.num(dt.dayOfMonth) + " " + EN_MONTHS[dt.monthValue - 1] + " " + g.title + suffix
                    ))
                }
            }
        }
        return out.sortedBy { it.first }.map { it.second }.distinct().take(6)
    }
}
