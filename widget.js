/* টাইম উইজেট কার্ড (Android TimeWidget-এর হুবহু ওয়েব সংস্করণ)
 * ব্যবহার: <div id="drWidget"></div> + <script src="widget.js"></script> — নিজে থেকে #drWidget-এ বসে যায়।
 * ইন্টারনেট ছাড়াই চলে; সব হিসাব ফোনেই (সূর্যের অবস্থান থেকে; ফজর/ইশা ১৮°, আসর হানাফি)।
 * ওয়াক্তের ঘরে চাপলে নিচে সেই ওয়াক্তের শুরু-শেষ; চলতি ওয়াক্তের ঘরে চাপলে নফল (আউয়াবীন/তাহাজ্জুদ) ↔ ওয়াক্ত।
 */
(function () {
  "use strict";
  var DUHA_AFTER_SUNRISE = 24;   // ইশরাক শুরু: সূর্যোদয়ের ২৪ মিনিট পর
  var ISHRAQ_END = 60;           // ইশরাক শেষ ধরা: সূর্যোদয়ের প্রায় ১ ঘণ্টা পর, তারপর সালাতুদ্দোহা
  var DUHA_BEFORE_DHUHR = 6;     // চাশত শেষ: যোহরের ৬ মিনিট আগে
  var OFF = [0, 1, 0, 3, 0];     // ফজর, যোহর, আসর, মাগরিব, ইশা — মিনিটের সমন্বয় (অ্যান্ড্রয়েড উইজেটের ডিফল্ট)
  var NAMES = ["ফজর", "যোহর", "আসর", "মাগরিব", "ইশা"];
  var NAFL = 5;

  // অ্যাপে (APK) চললে অবস্থান, মিনিটের সমন্বয়, হানাফি ও তারিখের সেটিং আসে নেটিভ উইজেটের Cfg থেকে — যাতে কার্ড আর হোম-স্ক্রিন উইজেট সবসময় হুবহু এক সময় দেখায়।
  // ব্রাউজারে/PWA-তে নিজের সেটিং (নিচের ডিফল্ট ও localStorage) চলে।
  var CAP = window.Capacitor;
  var NW = CAP && CAP.isNativePlatform && CAP.isNativePlatform() && CAP.Plugins && CAP.Plugins.TimeWidgetNative;
  var CFG = null;       // নেটিভ থেকে পাওয়া সর্বশেষ সেটিং
  var HANAFI = true;    // আসরে ছায়া দ্বিগুণ
  var HIJRI_ADJ = null; // নেটিভ থেকে এলে হিজরি তারিখের সমন্বয় (দিন)
  var BANGLA_ADJ = 0;
  var BN_DIGITS = true;

  var PLACES = [
    ["ঢাকা", 23.8103, 90.4125], ["চট্টগ্রাম", 22.3569, 91.7832], ["রাজশাহী", 24.3745, 88.6042],
    ["খুলনা", 22.8456, 89.5403], ["বরিশাল", 22.7010, 90.3535], ["সিলেট", 24.8949, 91.8687],
    ["রংপুর", 25.7439, 89.2752], ["ময়মনসিংহ", 24.7471, 90.4203], ["কুমিল্লা", 23.4607, 91.1809],
    ["নারায়ণগঞ্জ", 23.6238, 90.5000], ["গাজীপুর", 23.9999, 90.4203], ["ফরিদপুর", 23.6070, 89.8429],
    ["বগুড়া", 24.8465, 89.3773], ["যশোর", 23.1664, 89.2081], ["কক্সবাজার", 21.4272, 92.0058],
    ["নোয়াখালী", 22.8696, 91.0995], ["দিনাজপুর", 25.6279, 88.6332], ["টাঙ্গাইল", 24.2513, 89.9167],
    ["পাবনা", 24.0064, 89.2372]
  ];
  var BANGLA_MONTHS = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
  var HIJRI_MONTHS = ["মুহাররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জুমাদাল উলা", "জুমাদাস সানিয়া", "রজব", "শা’বান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"];

  // ───────── অঙ্ক ─────────
  var BD = "০১২৩৪৫৬৭৮৯";
  function bn(s) { return BN_DIGITS ? String(s).replace(/[0-9]/g, function (c) { return BD.charAt(+c); }) : String(s); }

  // ───────── তারিখ ─────────
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function dayDiff(a, b) { return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 864e5); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }

  // বাংলাদেশের সংশোধিত পঞ্জিকা: নববর্ষ ১৪ এপ্রিল
  function banglaText(d) {
    var y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    var gy = (m > 4 || (m === 4 && day >= 14)) ? y : y - 1;
    var idx = dayDiff([gy, 4, 14], [y, m, day]);
    var falgun = isLeap(gy + 1) ? 30 : 29;
    var len = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgun, 30];
    var mi = 0;
    while (mi < 11 && idx >= len[mi]) { idx -= len[mi]; mi++; }
    return bn(idx + 1) + " " + BANGLA_MONTHS[mi] + " " + bn(gy - 593) + " বঙ্গাব্দ";
  }

  // হিজরি (উম্মুল কুরা); বাংলাদেশে ডিফল্টে −১ দিন (চাঁদ সৌদির একদিন পরে)
  function hijriText(d, inBd) {
    try {
      var x = addDays(d, HIJRI_ADJ !== null ? HIJRI_ADJ : (inBd ? -1 : 0));
      var parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(x);
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var yr = parseInt(String(o.year).replace(/\D/g, ""), 10);
      return bn(parseInt(o.day, 10)) + " " + HIJRI_MONTHS[parseInt(o.month, 10) - 1] + " " + bn(yr) + " হি:";
    } catch (e) { return ""; }
  }


  // "১ ঘন্টা ২৩ মিনিট"; ঘন্টা না থাকলে শুধু মিনিট, মিনিট ০ হলে শুধু ঘন্টা
  function durBn(left) {
    var lh = Math.floor(left / 60), lm = left % 60;
    return lh > 0 ? bn(lh) + " ঘন্টা" + (lm > 0 ? " " + bn(lm) + " মি:" : "") : bn(lm) + " মি:";
  }

  // ───────── সুন্নাহ-স্মরণ (সময় ও ইংরেজি তারিখের মাঝের স্লাইডার) ─────────
  // সাপ্তাহিক: সোম-বৃহস্পতির রোজা, শুক্রবারে সূরা কাহফ (১ দিন আগে থেকে)।
  // মাসিক/বার্ষিক (হিজরি তারিখ ধরে, ৩ দিন আগে থেকে): আইয়ামে বীজ, হিজামার দিন, আশুরা, আরাফা, শাওয়ালের ছয় রোজা।
  // নিয়ম ও লেখা এক ফাইলে: data/sunnah.json (ফোনের হোম-স্ক্রিন উইজেটও একই ফাইল পড়ে)
  var SUN = null;
  try {
    fetch("data/sunnah.json?v=1").then(function (r) { return r.json(); }).then(function (j) {
      SUN = j; window.__drSunnahRules = j;
      try { window.dispatchEvent(new Event("dr-sunnah")); } catch (e) { }
    }).catch(function () { });
  } catch (e) { }
  function hijriMD(d, inBd) {
    try {
      var x = addDays(d, HIJRI_ADJ !== null ? HIJRI_ADJ : (inBd ? -1 : 0));
      var parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(x);
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { m: parseInt(o.month, 10), d: parseInt(o.day, 10) };
    } catch (e) { return null; }
  }
  function sunnahItems(now, inBdFlag) {
    if (!SUN) return [];
    var out = [], W = SUN.words, lead = SUN.lead, wl = SUN.weeklyLead;
    for (var k = 0; k <= lead; k++) {
      var dt = addDays(now, k), dow = dt.getDay(), hd = hijriMD(dt, inBdFlag);
      var when = k === 0 ? W.today : W.tomorrow;
      if (k <= wl) SUN.weekly.forEach(function (w) { if (w.dow === dow) out.push([k, w.text.replace("{d}", when)]); });
      if (!hd) continue;
      SUN.groups.forEach(function (g) {
        if (hd.d < g.a || hd.d > g.b) return;
        if (g.only && g.only.indexOf(hd.m) < 0) return;
        if (g.skip && g.skip.indexOf(hd.m) >= 0) return;
        var suf = g.range ? " " + W.start : "";
        if (k === 0) out.push([0, W.today + " " + g.t]);
        else if (hd.d === g.a) out.push([k, k === 1 ? W.tomorrow + " " + g.t + suf : bn(dt.getDate()) + " " + SUN.enMonths[dt.getMonth()] + " " + g.t + suf]);
      });
    }
    out.sort(function (x, y) { return x[0] - y[0]; });
    var seen = {}, res = [];
    out.forEach(function (e) { if (!seen[e[1]]) { seen[e[1]] = 1; res.push(e[1]); } });
    return res.slice(0, 6);
  }

  // ───────── নামাজের সময় (PrayTimes অ্যালগরিদম) ─────────
  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }
  function fixA(a) { return a - 360 * Math.floor(a / 360); }
  function fixH(a) { return a - 24 * Math.floor(a / 24); }
  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var a = Math.floor(y / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  }
  function sunPos(jd) {
    var d = jd - 2451545.0;
    var g = fixA(357.529 + 0.98560028 * d), q = fixA(280.459 + 0.98564736 * d);
    var l = fixA(q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g)));
    var e = 23.439 - 0.00000036 * d;
    var ra = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(l)), Math.cos(rad(l)))) / 15;
    return [deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(l)))), q / 15 - fixH(ra)];
  }
  // ফলাফল: ঘণ্টা (দশমিক) — fajr, sunrise, dhuhr, asr, maghrib(সূর্যাস্ত), isha
  function times(y, m, d, lat, lng, tz, hanafi) {
    var jd = julian(y, m, d) - lng / 360;
    function midDay(t) { return fixH(12 - sunPos(jd + t)[1]); }
    function angleTime(angle, t, ccw) {
      var decl = sunPos(jd + t)[0], noon = midDay(t);
      var x = (-Math.sin(rad(angle)) - Math.sin(rad(decl)) * Math.sin(rad(lat))) / (Math.cos(rad(decl)) * Math.cos(rad(lat)));
      var h = deg(Math.acos(Math.max(-1, Math.min(1, x)))) / 15;
      return noon + (ccw ? -h : h);
    }
    function asrTime(factor, t) {
      var decl = sunPos(jd + t)[0];
      return angleTime(-deg(Math.atan(1 / (factor + Math.tan(rad(Math.abs(lat - decl)))))), t, false);
    }
    var adj = tz - lng / 15;
    return {
      fajr: angleTime(18, 5 / 24, true) + adj,
      sunrise: angleTime(0.833, 6 / 24, true) + adj,
      dhuhr: midDay(12 / 24) + adj,
      asr: asrTime(hanafi ? 2 : 1, 13 / 24) + adj,
      maghrib: angleTime(0.833, 18 / 24, false) + adj,
      isha: angleTime(18, 18 / 24, false) + adj
    };
  }
  function mins(h) { return Math.floor(h * 60 + 0.5); }
  function fmt(min) {
    var m = ((min % 1440) + 1440) % 1440, h = Math.floor(m / 60) % 12;
    if (h === 0) h = 12;
    return bn(h + ":" + ("0" + (m % 60)).slice(-2));
  }
  function tzOf(d) { return -d.getTimezoneOffset() / 60; }
  function tms(d, loc) { return times(d.getFullYear(), d.getMonth() + 1, d.getDate(), loc.lat, loc.lng, tzOf(d), HANAFI); }

  // ───────── আজকের সব হিসাব ─────────
  function compute(now, loc) {
    var date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var t = tms(date, loc);
    var m = [mins(t.fajr) + OFF[0], mins(t.dhuhr) + OFF[1], mins(t.asr) + OFF[2], mins(t.maghrib) + OFF[3], mins(t.isha) + OFF[4]];
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var cur = 4, i;
    for (i = 0; i < 5; i++) if (m[i] <= nowMin) cur = i;
    var sunrise = mins(t.sunrise), sunset = mins(t.maghrib);
    var ws = m.slice(), we = [sunrise, m[2], sunset, m[4], 0], nightStart;
    if (nowMin < m[0]) {
      var y = tms(addDays(date, -1), loc);
      ws[4] = mins(y.isha) + OFF[4] - 1440;
      we[4] = m[0];
      nightStart = mins(y.maghrib) - 1440;
    } else {
      var n = tms(addDays(date, 1), loc);
      we[4] = mins(n.fajr) + OFF[0] + 1440;
      nightStart = sunset;
    }
    var tahajjud = nightStart + Math.floor((we[4] - nightStart) * 2 / 3);
    return { m: m, cur: cur, sunrise: sunrise, sunset: sunset, ws: ws, we: we, nowMin: nowMin + now.getSeconds() / 60, tahajjud: tahajjud };
  }

  // চলতি ওয়াক্তের নফল: ফজর-শেষে ইশরাক → সালাতুদ্দোহা; মাগরিবে আউয়াবীন; ইশায় তাহাজ্জুদ
  function nafl(s, cur) {
    var ishraqStart = s.sunrise + DUHA_AFTER_SUNRISE;
    var ishraqEnd = Math.min(s.sunrise + ISHRAQ_END, s.m[1] - DUHA_BEFORE_DHUHR - 1);
    var duhaEnd = Math.max(s.m[1] - DUHA_BEFORE_DHUHR, ishraqEnd + 1);
    if (cur === 0 && s.nowMin >= s.sunrise && s.nowMin < s.m[1])
      return s.nowMin < ishraqEnd ? { name: "ইশরাক", start: ishraqStart, end: ishraqEnd } : { name: "সালাতুদ্দোহা", start: ishraqEnd, end: duhaEnd };
    if (cur === 3) return { name: "আউয়াবীন", start: s.ws[3], end: s.we[3] };
    if (cur === 4) return { name: "তাহাজ্জুদ", start: s.tahajjud, end: s.we[4] };
    return null;
  }
  function naflByDefault(s) {
    if (s.cur === 0) return !!nafl(s, 0);
    if (s.cur === 4) return s.nowMin >= s.tahajjud;
    return false;
  }

  // ───────── অবস্থান ─────────
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function loadLoc() {
    try { var o = JSON.parse(store("drw_loc") || "null"); if (o && isFinite(o.lat) && isFinite(o.lng)) return o; } catch (e) { }
    return { lat: PLACES[0][1], lng: PLACES[0][2], auto: false };
  }
  function inBd(lat, lng) { return lat >= 20.5 && lat <= 26.7 && lng >= 87.9 && lng <= 92.8; }
  function placeName(loc) {
    if (CFG) return CFG.place + (CFG.auto && !CFG.located ? " 📍" : "");
    var best = -1, bd = 1e9, i;
    for (i = 0; i < PLACES.length; i++) {
      var dx = (loc.lat - PLACES[i][1]) * 111.2, dy = (loc.lng - PLACES[i][2]) * 111.2 * Math.cos(rad(loc.lat));
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bd) { bd = dist; best = i; }
    }
    if (!loc.auto) return PLACES[0][0];
    return bd <= 60 ? PLACES[best][0] : "বর্তমান অবস্থান";
  }

  // ───────── রূপ ─────────
  var CSS =
    ".drw{box-sizing:border-box;max-width:660px;margin:12px auto 0;padding:3px 14px 3px;border-radius:24px;border-top:3px solid #0a5240;background:#F2F5F8;color:#14212B;font-family:inherit;user-select:none;-webkit-user-select:none}" +
    ".drw *{box-sizing:border-box}" +
    ".drw-r{display:flex;align-items:center;justify-content:space-between;gap:8px}.drw-top{align-items:flex-end;gap:4px}.drw-mid{position:relative;flex:1;height:38px;min-width:0;color:#3B4A55}.drw-arc{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}" +
    ".drw-sun{display:flex;align-items:center;gap:5px;font-size:11px;color:#3B4A55;white-space:nowrap}" +
    ".drw-sun img{width:18px;height:18px;flex:none;display:block}" +
    ".drw-pin{flex:none;margin:0 6px;white-space:nowrap;border:.8px solid rgba(255,255,255,.28);background:linear-gradient(90deg,#16794c,#2bb583);color:#fff;border-radius:10px;padding:1px 8px;font-family:inherit;font-weight:700;font-size:9px;line-height:1.15;text-align:center;cursor:pointer;box-shadow:0 1px 3px rgba(22,121,76,.35)}" +
    ".drw-sl-sun{position:absolute;white-space:nowrap;font-size:9px;font-weight:700;color:#B36B00;line-height:1;pointer-events:none}" +
    ".drw-sn{flex:1;min-width:0;position:relative;height:17px;overflow:hidden;font-size:11.5px;line-height:17px;font-weight:700;color:#1E7F58;direction:ltr}.drw-sn span{position:absolute;left:0;top:0;white-space:nowrap;will-change:transform}" +
    ".drw-time{display:flex;align-items:flex-end;gap:4px;margin-top:1px}" +
    ".drw-time b{font-size:34px;line-height:1;font-weight:800;letter-spacing:-.5px;font-variant-numeric:lining-nums}" +
    ".drw-time span{font-size:12px;color:#3B4A55;padding-bottom:5px}" +
    ".drw-en{text-align:right;line-height:1.25}" +
    ".drw-en b{display:block;font-size:15px;font-weight:800}" +
    ".drw-lr{display:flex;align-items:center;justify-content:flex-end;gap:6px}" +
    ".drw-upd{font-size:8px;line-height:1.1;text-align:center;color:#3B4A55;background:none;border:0;padding:0;margin-left:2px;cursor:pointer;font-family:inherit}" +
    ".drw-loc{font-size:12px;color:#3B4A55;cursor:pointer;background:none;border:0;padding:0;font-family:inherit}" +
    ".drw-d>span{flex:1;min-width:0}.drw-d>span:last-child{text-align:right}.drw-d{margin-top:2px;font-size:12px;color:#3B4A55;white-space:nowrap}" +
    ".drw-p{display:flex;margin:3px -4px 0}" +
    ".drw-c{flex:1;text-align:center;padding:2px 0 1px;border-radius:12px;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    ".drw-c.on{background:#CFE6D9}" +
    ".drw-c i{display:block;font-style:normal;font-size:11px;color:#3B4A55}" +
    ".drw-c b{display:block;font-size:14px;font-weight:800;margin-top:1px}" +
    ".drw-b{display:flex;align-items:center;gap:8px;margin-top:3px;font-size:11px;color:#3B4A55}" +
    ".drw-b span{white-space:nowrap}" +
    ".drw-p+.drw-r{margin-top:3px}" +
    ".drw-bar{position:relative;flex:1;height:14px;border-radius:7px;background:#8FA39A;overflow:hidden}.drw-bar em{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:9px;font-weight:800;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4);white-space:nowrap;line-height:1}" +
    ".drw-bar u{display:block;height:100%;background:linear-gradient(90deg,#16794c,#2bb583);border-radius:7px;text-decoration:none}" +
    "@media (prefers-color-scheme:dark){.drw{border-top-color:#2a6b52;background:#16211c;color:#e8f0ea}.drw-sl-sun{color:#FFC857}.drw-sn{color:#7FD3AE}.drw-mid{color:#b3c9bb}.drw-sun,.drw-time span,.drw-loc,.drw-upd,.drw-d,.drw-c i,.drw-b{color:#b3c9bb}.drw-c.on{background:#1f4a39}.drw-bar{background:#2a4034}}";

  var SUNRISE = '<img alt="" src="data:image/png;base64,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">';
  var SUNSET = '<img alt="" src="data:image/png;base64,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">';

  function mount(el) {
    if (!el || el.getAttribute("data-drw")) return;
    el.setAttribute("data-drw", "1");
    if (!document.getElementById("drwCss")) {
      var st = document.createElement("style"); st.id = "drwCss"; st.textContent = CSS; document.head.appendChild(st);
    }
    var loc = loadLoc();
    var pick = -1, pickCur = -1;

    // নেটিভ সেটিং টেনে এনে কার্ডে বসায়; বদলে থাকলে true
    function applyCfg(c) {
      if (!c || !isFinite(c.lat) || !isFinite(c.lng)) return false;
      var before = JSON.stringify([CFG, loc]);
      CFG = c;
      if (c.off && c.off.length === 5) for (var k = 0; k < 5; k++) OFF[k] = +c.off[k] || 0;
      HANAFI = !!c.hanafi;
      HIJRI_ADJ = isFinite(c.hijriShift) ? +c.hijriShift : null;
      BANGLA_ADJ = isFinite(c.banglaAdj) ? +c.banglaAdj : 0;
      BN_DIGITS = c.bnDigits !== false;
      loc = { lat: +c.lat, lng: +c.lng, auto: !!c.located };
      return before !== JSON.stringify([CFG, loc]);
    }
    function pullCfg() {
      if (!NW) return Promise.resolve(false);
      return NW.config().then(applyCfg, function () { return false; });
    }

    function shownIndex(s) {
      var ok = (pick >= 0 && pick <= 4) || (pick === NAFL && nafl(s, s.cur));
      if (ok && pickCur === s.cur) return pick;
      return naflByDefault(s) ? NAFL : s.cur;
    }
    // সূর্যের অবস্থান ও লেখা: render ও tick দুটোই একই হিসাব ব্যবহার করে
    function sunGeom(s) {
      if (!(s.sunset > s.sunrise && s.nowMin >= s.sunrise && s.nowMin <= s.sunset)) return null;
      var f = (s.nowMin - s.sunrise) / (s.sunset - s.sunrise), a = Math.PI * (1 + f);
      var x = 60 + 57 * Math.cos(a), y = 24 + 19 * Math.sin(a), pc = (f * 100).toFixed(1);
      return { x: x.toFixed(2), y: y.toFixed(2), pc: pc, top: Math.min(y + 8, 28).toFixed(1) + "px", txt: durBn(Math.ceil(Math.max(0, s.sunset - s.nowMin))) + " বাকি" };
    }
    var lastSig = "";
    window.addEventListener("dr-sunnah", function () { if (el.isConnected) { lastSig = ""; render(); } });
    function sigOf(s, now) { return [s.cur, shownIndex(s), sunGeom(s) ? 1 : 0, now.getDate(), updBusy ? 1 : 0].join("|"); }
    // প্রতি সেকেন্ডে: কাঠামো না বদলালে ভেতরের লেখা/মাপ জায়গাতেই বদলায় (পুরো উইজেট নতুন করে আঁকে না, তাই ঝিলিক নেই)
    function tick() {
      if (document.hidden) return;
      var now = new Date(), s = compute(now, loc);
      if (sigOf(s, now) !== lastSig) { render(); return; }
      var q = function (sel) { return el.querySelector(sel); };
      var setT = function (n, t) { if (n && n.textContent !== t) n.textContent = t; };
      var setA = function (n, k, v) { if (n && n.getAttribute(k) !== v) n.setAttribute(k, v); };
      var shown = shownIndex(s), nf = shown === NAFL ? nafl(s, s.cur) : null, idx = Math.max(0, Math.min(4, shown));
      var bs = nf ? nf.start : s.ws[idx], be = nf ? nf.end : s.we[idx];
      var frac = Math.max(0, Math.min(1, (s.nowMin - bs) / Math.max(1, be - bs)));
      var u = q(".drw-bar u"), w = (frac * 100).toFixed(1) + "%";
      if (u && u.style.width !== w) u.style.width = w;
      setT(q(".drw-bar em"), durBn(Math.ceil(Math.max(0, be - s.nowMin))) + " বাকি");
      var g = sunGeom(s);
      if (g) {
        setA(q(".drw-pr"), "d", "M3,24A57,19 0 0 1 " + g.x + "," + g.y);
        ["s1", "s2", "s3"].forEach(function (k) { var c = q(".drw-" + k); setA(c, "cx", g.x); setA(c, "cy", g.y); });
        var L = q(".drw-sl-sun");
        if (L) { setT(L, g.txt); var tf = "translateX(-" + g.pc + "%)"; if (L.style.left !== g.pc + "%") L.style.left = g.pc + "%"; if (L.style.transform !== tf) L.style.transform = tf; if (L.style.top !== g.top) L.style.top = g.top; }
      }
      var hh = now.getHours() % 12 || 12, mm = ("0" + now.getMinutes()).slice(-2);
      setT(q(".drw-time b"), hh + ":" + mm);
      setT(q(".drw-time span"), now.getHours() < 12 ? "AM" : "PM");
    }
    function render() {
      var now = new Date(), s = compute(now, loc);
      var hh = now.getHours() % 12 || 12, mm = ("0" + now.getMinutes()).slice(-2);
      var en = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      var shown = shownIndex(s), nf = shown === NAFL ? nafl(s, s.cur) : null;
      var idx = Math.max(0, Math.min(4, shown));
      var bs = nf ? nf.start : s.ws[idx], be = nf ? nf.end : s.we[idx];
      var frac = Math.max(0, Math.min(1, (s.nowMin - bs) / Math.max(1, be - bs)));
      var left = Math.ceil(Math.max(0, be - s.nowMin));
      var cd = durBn(left) + " বাকি";
      var arc = (function () {
        var g = sunGeom(s);
        var o = '<svg class="drw-arc" viewBox="0 0 120 38" preserveAspectRatio="none" aria-hidden="true"><path d="M3,24A57,19 0 0 1 117,24" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.1" stroke-dasharray="2.4 2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
        var lab = "";
        if (g) {
          o += '<path class="drw-pr" d="M3,24A57,19 0 0 1 ' + g.x + ',' + g.y + '" fill="none" stroke="#FFA000" stroke-width="1.3" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
            '<circle class="drw-s1" cx="' + g.x + '" cy="' + g.y + '" r="5.2" fill="#FFC21A" fill-opacity=".35"/><circle class="drw-s2" cx="' + g.x + '" cy="' + g.y + '" r="2.6" fill="#FFB300"/><circle class="drw-s3" cx="' + g.x + '" cy="' + g.y + '" r="1.4" fill="#FFE082"/>';
          lab = '<div class="drw-sl-sun" style="left:' + g.pc + '%;transform:translateX(-' + g.pc + '%);top:' + g.top + '">' + g.txt + '</div>';
        }
        return o + '</svg>' + lab;
      })();
      var cells = "";
      for (var i = 0; i < 5; i++)
        cells += '<div class="drw-c' + (i === s.cur ? " on" : "") + '" data-i="' + i + '"><i>' + NAMES[i] + "</i><b>" + fmt(s.m[i]) + "</b></div>";
      var keepSn = el.querySelector("[data-sn]");
      el.innerHTML =
        '<div class="drw"><div class="drw-r drw-top"><span class="drw-sun">' + SUNRISE + "সূর্যোদয় " + fmt(s.sunrise) + '</span>' + '<div class="drw-mid">' + arc + '</div>' + '<span class="drw-sun">সূর্যাস্ত ' + fmt(s.sunset) + SUNSET + "</span></div>" +
        '<div class="drw-b"><span>' + (nf ? nf.name + " শুরু " : "ওয়াক্ত শুরু ") + fmt(bs) + '</span><div class="drw-bar"><u style="width:' + (frac * 100).toFixed(1) + '%"></u><em>' + cd + '</em></div><span>' + (nf ? "শেষ " : "ওয়াক্ত শেষ ") + fmt(be) + "</span></div>" +
        '<div class="drw-p">' + cells + "</div>" +
        '<div class="drw-r"><div class="drw-time"><b>' + hh + ":" + mm + "</b><span>" + (now.getHours() < 12 ? "AM" : "PM") + "</span></div>" +
        '<div class="drw-sn" data-sn="1"></div>' +
        '<div class="drw-en"><b>' + en + '</b><div class="drw-lr"><button class="drw-loc" type="button" data-loc="1">' + placeName(loc) + '</button><button class="drw-upd" type="button" data-upd="1">' + (updBusy ? "হচ্ছে…" : "আপডেট<br>লোকেশন") + "</button></div></div></div>" +
        '<div class="drw-r drw-d"><span>' + hijriText(now, inBd(loc.lat, loc.lng)) + '</span><button class="drw-pin" type="button" data-pin="1">হোম স্ক্রিনে বসান</button><span>' + banglaText(addDays(now, BANGLA_ADJ)) + "</span></div>" +
        "</div>";
      if (keepSn) { var ns = el.querySelector("[data-sn]"); if (ns && ns.parentNode) ns.parentNode.replaceChild(keepSn, ns); }
      snItems = sunnahItems(now, inBd(loc.lat, loc.lng));
      paintSn();
      lastSig = sigOf(s, now);
    }
    // স্মুথ টিকার: লেখা ডান দিক থেকে ঢুকে বাম দিকে বেরিয়ে যায় (বাংলার পড়ার দিক)। লেখা ছোট করা হয় না:
    // জায়গায় ধরলে মাঝখানে থেমে তারপর বাম দিকে বেরোয়, না ধরলে ধীরে ধীরে পুরোটা পার হয়ে যায়।
    window.__drTicker = function (host, getItems) {
      if (!host || host.__tk) return;
      host.__tk = 1;
      var span = host.querySelector("span");
      if (!span) { span = document.createElement("span"); host.appendChild(span); }
      var idx = 0, anim = null, lastStatic = "", first = true;
      function again(ms) { setTimeout(step, ms); }
      function step() {
        if (!host.isConnected) { host.__tk = 0; return; }
        var items = getItems() || [];
        if (!items.length) { host.style.visibility = "hidden"; lastStatic = ""; return again(400); }
        var W = host.clientWidth;
        if (!W) { first = true; return again(250); }
        host.style.visibility = "";
        var txt = items[idx % items.length];
        span.textContent = txt;
        var w = span.offsetWidth, fits = w <= W - 6, mid = Math.max(0, (W - w) / 2);
        if (items.length === 1 && fits) {
          if (anim) { anim.cancel(); anim = null; }
          span.style.transform = "translateX(" + mid + "px)";
          return again(1500);
        }
        idx++;
        var k, dur;
        if (fits) {
          dur = 1500 + Math.min(4200, 600 * txt.length / 6 + 1800);
          var a = 650 / dur, b = 1 - 650 / dur;
          k = [
            { transform: "translateX(" + (first ? mid : W + 4) + "px)", easing: "cubic-bezier(.2,.7,.2,1)" },
            { transform: "translateX(" + mid + "px)", offset: first ? 0.0001 : a },
            { transform: "translateX(" + mid + "px)", offset: b, easing: "cubic-bezier(.6,0,.9,.4)" },
            { transform: "translateX(" + (-w - 4) + "px)" }
          ];
        } else {
          dur = Math.max(4000, (W + w + 8) / 0.055);
          k = [{ transform: "translateX(" + (first ? 0 : W + 4) + "px)" }, { transform: "translateX(" + (-w - 4) + "px)" }];
        }
        if (!span.animate) { span.style.transform = "translateX(" + (fits ? mid : 0) + "px)"; return again(3600); }
        first = false;
        anim = span.animate(k, { duration: dur, easing: "linear", fill: "forwards" });
        anim.onfinish = step;
        anim.oncancel = function () { };
      }
      step();
    };
    var snItems = [], snI = 0;
    function paintSn() {
      var e = el.querySelector("[data-sn]");
      if (!e) return;
      if (!snItems.length) { e.style.display = "none"; return; }
      e.style.display = "";
      if (!e.__tk) window.__drTicker(e, function () { return snItems; });
    }
    var updBusy = false;
    // "আপডেট লোকেশন": অনুমতি না থাকলে চায়, ফোনের লোকেশন বন্ধ থাকলে চালু করার সেটিংস খোলে, নইলে এখনই নতুন অবস্থান নেয় (নেট লাগে)
    function updateLoc() {
      if (updBusy) return;
      updBusy = true; render();
      var tries = 0;
      function finish() { updBusy = false; render(); }
      function go() {
        NW.update().then(function (r) {
          if (applyCfg(r)) render();
          if (r && r.status === "perm") { waitPerm(); return; }
          finish();
        }, finish);
      }
      function waitPerm() { // অনুমতির ডায়ালগ/সেটিংসে ঘুরে আসার অপেক্ষা (সর্বোচ্চ ~২২ সেকেন্ড)
        if (tries++ > 14) { finish(); return; }
        setTimeout(function () {
          NW.config().then(function (c) { if (c && c.hasPerm) go(); else waitPerm(); }, finish);
        }, 1500);
      }
      if (NW && NW.update) { go(); return; }
      // পুরোনো অ্যাপ বা ব্রাউজার: আগের পদ্ধতি
      locate(true);
      [3000, 8000, 15000].forEach(function (ms, n) {
        setTimeout(function () {
          pullCfg().then(function (ch) {
            if (ch) render();
            if (n === 2) { updBusy = false; render(); }
          });
          if (!NW && n === 2) { updBusy = false; render(); }
        }, ms);
      });
    }
    el.addEventListener("click", function (ev) {
      var t = ev.target;
      if (t.closest && t.closest("[data-upd]")) { updateLoc(); return; }
      if (t.closest && t.closest("[data-pin]")) {
        if (!NW || !NW.pin) { alert("টাইম উইজেট হোম স্ক্রিনে বসানো শুধু ইনস্টল করা অ্যাপে চলে।"); return; }
        NW.pin().then(function (r) {
          if (r && r.ok === false) alert("এই ফোনের লঞ্চার সরাসরি বসাতে দেয় না। হোম স্ক্রিনে ফাঁকা জায়গায় চেপে ধরে ‘উইজেট’ থেকে “টাইম উইজেট” বেছে নিন।");
        }).catch(function () {});
        return;
      }
      var c = t.closest ? t.closest("[data-i]") : null;
      if (!c) {
        // কার্ডের যেকোনো জায়গায় চাপলে (ওয়াক্তের ঘর বাদে) নেটিভ অ্যাপে টাইম উইজেটের সেটিংস খোলে
        if (NW && NW.openSettings) { NW.openSettings().catch(function () {}); return; }
        if (t.closest && t.closest("[data-loc]")) locate(true);
        return;
      }
      var i = +c.getAttribute("data-i"), s = compute(new Date(), loc), shown = shownIndex(s);
      var target = (i === s.cur && nafl(s, s.cur)) ? (shown === NAFL ? s.cur : NAFL) : i;
      pick = target === shown ? -1 : target; pickCur = s.cur;
      render();
    });
    // স্বয়ংক্রিয় অবস্থান: খোলার সময়, সামনে ফিরলে ও প্রতি ১০ মিনিটে ফোনের অবস্থান নেয়; ১ কিমির বেশি সরলে শহর ও নামাজের সময় নিজে বদলে যায়
    var locBusy = false;
    var asked = false;
    function locate(userTap) {
      if (NW) {
        // অ্যাপে: নেটিভ উইজেটের অবস্থান-ব্যবস্থাই একমাত্র উৎস (ওয়েবের আলাদা অবস্থান নয়); অনুমতি না থাকলে খোলার সময় একবার, আর নামে চাপলে আবার চায়
        var ask = userTap === true || !asked;
        asked = true;
        NW.locate({ ask: ask }).then(function (c) { if (applyCfg(c)) render(); }, function () { });
        return;
      }
      if (!navigator.geolocation || locBusy) return;
      locBusy = true;
      navigator.geolocation.getCurrentPosition(function (p) {
        locBusy = false;
        var la = p.coords.latitude, ln = p.coords.longitude;
        var dx = (la - loc.lat) * 111.2, dy = (ln - loc.lng) * 111.2 * Math.cos(rad(la));
        var moved = Math.sqrt(dx * dx + dy * dy);
        if (!loc.auto || loc.ip || moved > 1) {
          loc = { lat: la, lng: ln, auto: true };
          store("drw_loc", JSON.stringify(loc));
          render();
        }
      }, function () { locBusy = false; ipLocate(); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 });
    }
    // ফোনের লোকেশন না পেলে (অনুমতি নেই/বন্ধ) এবং নেট থাকলে আইপি থেকে মোটামুটি শহর ধরে (শুধু ফলব্যাক; অফলাইনে কিছু করে না)
    function ipLocate() {
      if (loc.auto && !loc.ip) return;
      if (navigator.onLine === false || !window.fetch) return;
      var ac = window.AbortController ? new AbortController() : null;
      var to = setTimeout(function () { if (ac) ac.abort(); }, 8000);
      fetch("https://ipwho.is/?fields=success,latitude,longitude", ac ? { signal: ac.signal } : {}).then(function (r) { return r.json(); }).then(function (j) {
        clearTimeout(to);
        if (!j || !j.success || !isFinite(j.latitude) || !isFinite(j.longitude)) return;
        var dx = (j.latitude - loc.lat) * 111.2, dy = (j.longitude - loc.lng) * 111.2 * Math.cos(rad(j.latitude));
        if (loc.ip && Math.sqrt(dx * dx + dy * dy) <= 5) return;
        loc = { lat: j.latitude, lng: j.longitude, auto: true, ip: true };
        store("drw_loc", JSON.stringify(loc));
        render();
      }).catch(function () { clearTimeout(to); });
    }
    render();
    pullCfg().then(function (ch) { if (ch) render(); locate(); });
    if (!NW) locate();
    setInterval(function () { pullCfg().then(function (ch) { if (ch) render(); }); }, 30000);
    setInterval(tick, 1000);
    setInterval(locate, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { pullCfg().then(function () { render(); }); locate(); } });
  }

  window.DRWidget = { mount: mount, _compute: compute, _nafl: nafl, _times: times, _fmt: fmt, _banglaText: banglaText };
  // অ্যাপে: হোম-স্ক্রিনের নেটিভ উইজেটটাই এই জায়গায় বসে (আলাদা ওয়েব-কার্ড নয়), তাই দুটো হুবহু এক
  function nativeCard(el) {
    el.setAttribute("data-drw", "1");
    el.style.minHeight = "130px";
    el.style.paddingTop = "12px";
    var last = "", h = 0, failed = 0;
    function send(force) {
      var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      var pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;
      var full = r.width - pl - pr, w = Math.min(full, 660), x = r.left + pl + (full - w) / 2, y = r.top + 12;
      var shown = r.width > 0 && r.bottom > 0 && r.top < innerHeight && !document.hidden && !document.body.classList.contains("dr-lock");
      if (shown) {
        // উপরে অন্য কিছু (সাইডবার/স্ক্রিম/ওভারলে) ঢেকে থাকলে লুকাই; হেডারের নিজের অংশ (ফাঁক, ব্র্যান্ড) ঢাকা ধরা হয় না
        var hdr = el.closest ? (el.closest("header") || el) : el, covered = 0, pts = [0.2, 0.5, 0.8];
        for (var k = 0; k < pts.length; k++) {
          var px = Math.max(0, Math.min(innerWidth - 1, r.left + r.width * pts[k])), py = Math.max(0, Math.min(innerHeight - 1, r.top + 20));
          var t2 = null;
          try { t2 = document.elementFromPoint(px, py); } catch (e) { }
          if (t2 && !(t2 === hdr || hdr.contains(t2))) covered++;
        }
        if (covered === pts.length) shown = false;
      }
      var key = [shown, Math.round(x), Math.round(y), Math.round(w)].join();
      if (key === last && !force && h) return;
      last = key;
      NW.card({ visible: shown, x: x, y: y, w: w }).then(function (o) {
        failed = 0;
        if (o && o.h && Math.abs(o.h + 12 - h) > 1) { h = o.h + 12; el.style.minHeight = h + "px"; el.style.height = h + "px"; }
      }, function () { last = ""; if (++failed > 24) { clearInterval(iv); NW.card({ visible: false, x: 0, y: 0, w: 300 }).catch(function () { }); el.removeAttribute("data-drw"); el.style.cssText = "padding:0 12px"; mount(el); } });
    }
    var iv = setInterval(function () { send(false); }, 250);
    setInterval(function () { send(true); }, 2000);
    window.addEventListener("pageshow", function () { send(true); });
    window.addEventListener("focus", function () { send(true); });
    [400, 1200, 3000].forEach(function (ms) { setTimeout(function () { send(true); }, ms); });
    window.addEventListener("scroll", function () { send(false); }, true);
    window.addEventListener("resize", function () { send(true); });
    window.addEventListener("hashchange", function () { setTimeout(function () { send(true); }, 50); });
    document.addEventListener("visibilitychange", function () { send(true); });
    send(true);
    // অবস্থান: খোলার সময় একবার (অনুমতি চায়), এরপর সামনে ফিরলে ও প্রতি ১০ মিনিটে
    function loc(ask) { NW.locate({ ask: ask }).catch(function () { }); }
    loc(true);
    setInterval(function () { loc(false); }, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) loc(false); });
  }
  function auto() {
    var el = document.getElementById("drWidget");
    if (NW && NW.card) nativeCard(el); else mount(el);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
