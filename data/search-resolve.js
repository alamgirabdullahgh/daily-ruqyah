/* Daily Ruqyah — সার্বজনীন সার্চ-রিজলভার।
   যেকোনো ভাবে লেখা সূরার নাম (বাংলা/আরবি/ইংরেজি, যেকোনো বানানে) ও আয়াত নম্বর চিনে সূরা:আয়াত বের করে।
   উদাহরণ: "সূরা ফুরকান আয়াত 23", "ফুরকান", "furqan 23", "الفرقان ٢٣", "ফোরকান ২৩ নম্বর আয়াত", "25 23", "23 ফুরকান", "ফুরকান ২৩-২৫"
   পদ্ধতি: নাম → ধ্বনি-কাঠামো (শুধু ব্যঞ্জনের শ্রেণি) করে সূরার তিন ভাষার নামের কাঠামোর সাথে মেলানো, তাই বানানের ভিন্নতায় আটকায় না।
   window.SearchResolve.parse(raw) → {s, a, e, names:[...]} (a/e না থাকলে null) বা {amb:[s,...]} বা null */
(function () {
  "use strict";
  var AR = "الفاتحة,البقرة,آل عمران,النساء,المائدة,الأنعام,الأعراف,الأنفال,التوبة,يونس,هود,يوسف,الرعد,إبراهيم,الحجر,النحل,الإسراء,الكهف,مريم,طه,الأنبياء,الحج,المؤمنون,النور,الفرقان,الشعراء,النمل,القصص,العنكبوت,الروم,لقمان,السجدة,الأحزاب,سبأ,فاطر,يس,الصافات,ص,الزمر,غافر,فصلت,الشورى,الزخرف,الدخان,الجاثية,الأحقاف,محمد,الفتح,الحجرات,ق,الذاريات,الطور,النجم,القمر,الرحمن,الواقعة,الحديد,المجادلة,الحشر,الممتحنة,الصف,الجمعة,المنافقون,التغابن,الطلاق,التحريم,الملك,القلم,الحاقة,المعارج,نوح,الجن,المزمل,المدثر,القيامة,الإنسان,المرسلات,النبأ,النازعات,عبس,التكوير,الانفطار,المطففين,الانشقاق,البروج,الطارق,الأعلى,الغاشية,الفجر,البلد,الشمس,الليل,الضحى,الشرح,التين,العلق,القدر,البينة,الزلزلة,العاديات,القارعة,التكاثر,العصر,الهمزة,الفيل,قريش,الماعون,الكوثر,الكافرون,النصر,المسد,الإخلاص,الفلق,الناس".split(",");
  var EN = "Fatihah,Baqarah,Ali Imran,Nisa,Maidah,Anam,Araf,Anfal,Tawbah|Taubah|Bara'ah,Yunus,Hud,Yusuf,Rad,Ibrahim,Hijr,Nahl,Isra|Bani Israil,Kahf,Maryam,Ta Ha|Taha,Anbiya,Hajj,Muminun|Mominun,Nur|Noor,Furqan|Forqan|Furqaan,Shuara,Naml,Qasas,Ankabut,Rum|Room,Luqman,Sajdah|Sajda,Ahzab,Saba,Fatir,Ya Sin|Yasin|Yaseen,Saffat,Sad|Swad,Zumar,Ghafir|Mumin,Fussilat|Ha Mim Sajdah,Shura,Zukhruf,Dukhan,Jathiyah|Jasiya,Ahqaf,Muhammad,Fath,Hujurat,Qaf,Dhariyat|Zariyat,Tur,Najm,Qamar,Rahman,Waqiah,Hadid,Mujadilah|Mujadala,Hashr,Mumtahanah,Saff,Jumuah|Jumua,Munafiqun,Taghabun,Talaq,Tahrim,Mulk,Qalam,Haqqah,Maarij,Nuh,Jinn,Muzzammil,Muddaththir|Muddassir,Qiyamah,Insan|Dahr,Mursalat,Naba,Naziat,Abasa,Takwir,Infitar,Mutaffifin,Inshiqaq,Buruj,Tariq,Ala,Ghashiyah,Fajr,Balad,Shams,Layl|Lail,Duha,Sharh|Inshirah|Alam Nashrah,Tin,Alaq,Qadr,Bayyinah,Zalzalah|Zilzal,Adiyat,Qariah,Takathur,Asr,Humazah,Fil,Quraysh|Quraish,Maun,Kawthar|Kausar,Kafirun,Nasr,Masad|Lahab,Ikhlas,Falaq,Nas".split(",");
  var BN = "ফাতিহা|ফাতেহা|হামদ,বাকারা|বাকারাহ|বাকার,আলে ইমরান|আল ইমরান|ইমরান,নিসা|নিছা,মায়িদা|মায়েদা|মাইদা,আনআম|আন আম,আরাফ|আ'রাফ,আনফাল,তাওবা|তওবা|বারাআত,ইউনুস|ইউনুছ,হুদ,ইউসুফ|ইউছুফ,রা'দ|রাদ,ইবরাহীম|ইব্রাহীম|ইবরাহিম|ইব্রাহিম,হিজর,নাহল,ইসরা|বনী ইসরাঈল|বনি ইসরাইল,কাহাফ|কাহফ,মারইয়াম|মরিয়ম,ত্বহা|তাহা|ত্ব-হা,আম্বিয়া|আম্বিয়া,হজ্জ|হজ|হাজ্জ,মুমিনুন|মু'মিনুন|মোমিনুন,নূর|নুর,ফুরকান|ফোরকান|ফুরক্বান|ফুরকান,শুআরা|শু'আরা|শোআরা,নামল,কাসাস|ক্বাসাস,আনকাবুত|আনকাবূত,রূম|রুম,লুকমান|লোকমান,সাজদাহ|সিজদা|সাজদা,আহযাব|আহজাব,সাবা,ফাতির|ফাতীর,ইয়াসিন|ইয়াসীন|ইয়া-সীন,সাফফাত|সাফ্ফাত,সোয়াদ|সাদ|স্বাদ,যুমার|জুমার,গাফির|গাফের|মু'মিন,ফুসসিলাত|হামিম সাজদা|হা-মীম সাজদা,শূরা|শুরা,যুখরুফ|জুখরুফ,দুখান|দোখান,জাসিয়া|জাছিয়া|জাসিয়াহ,আহকাফ,মুহাম্মাদ|মুহাম্মদ,ফাতহ|ফাতাহ,হুজুরাত,ক্বাফ|কাফ,যারিয়াত|জারিয়াত,তূর|তুর,নাজম,ক্বামার|কামার,রহমান|রাহমান,ওয়াকিআ|ওয়াকিয়া|ওয়াক্বিআহ,হাদীদ|হাদিদ,মুজাদালা|মুজাদালাহ,হাশর,মুমতাহিনা|মুমতাহানা,সফ|সাফ,জুমুআ|জুমা|জুমু'আ,মুনাফিকুন|মুনাফেকুন,তাগাবুন|তাগাবুন,তালাক|ত্বালাক,তাহরীম|তাহরিম,মুলক|মুল্ক,কলম|ক্বালাম,হাক্কাহ|হাক্কা,মাআরিজ|মা'আরিজ,নূহ|নুহ,জিন,মুযযাম্মিল|মুজ্জাম্মিল|মুয্যাম্মিল,মুদ্দাসসির|মুদ্দাছছির,কিয়ামাহ|ক্বিয়ামাহ|কিয়ামা,ইনসান|দাহর|দাহ্‌র,মুরসালাত,নাবা,নাযিআত|নাজিআত,আবাসা,তাকভীর|তাকবীর|তাকউইর,ইনফিতার,মুতাফফিফীন|মুতাফফিফিন,ইনশিকাক,বুরুজ,তারিক|ত্বারিক,আ'লা|আলা,গাশিয়াহ|গাশিয়া,ফাজর,বালাদ,শামস,লাইল,দুহা|যুহা,ইনশিরাহ|শারহ|আলাম নাশরাহ,তীন|তিন,আলাক|আলাক্ব,কদর|ক্বদর|কাদর,বাইয়্যিনাহ|বাইয়িনাহ,যিলযাল|জিলজাল|যালযালা|যিলযালাহ,আদিয়াত,কারিয়া|ক্বারিয়াহ,তাকাসুর,আসর|আছর,হুমাযাহ|হুমাজাহ,ফীল|ফিল,কুরাইশ,মাউন|মা'ঊন,কাউসার|কাওসার,কাফিরুন|কাফেরুন,নাসর,মাসাদ|লাহাব,ইখলাস|ইখলাছ,ফালাক|ফালাক্ব,নাস|নাছ".split(",");

  var D = function (c) { return "০১২৩৪৫৬৭৮৯".indexOf(c) >= 0 ? "০১২৩৪৫৬৭৮৯".indexOf(c) : "٠١٢٣٤٥٦٧٨٩".indexOf(c); };
  function digits(s) { return s.replace(/[০-৯٠-٩]/g, function (c) { return String(D(c)); }); }

  /* ধ্বনি-কাঠামো: তিন লিপি → এক ব্যঞ্জন-বর্ণমালা, স্বর ও হ্রস্ব বাদ */
  var MAP = {
    // আরবি
    "ب": "b", "ت": "t", "ث": "s", "ج": "j", "ح": "h", "خ": "k", "د": "d", "ذ": "j", "ر": "r", "ز": "j", "س": "s", "ش": "s", "ص": "s", "ض": "d", "ط": "t", "ظ": "j", "غ": "g", "ف": "f", "ق": "k", "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "ة": "h",
    // বাংলা
    "ক": "k", "খ": "k", "গ": "g", "ঘ": "g", "ঙ": "n", "চ": "s", "ছ": "s", "জ": "j", "ঝ": "j", "ঞ": "n", "ট": "t", "ঠ": "t", "ড": "d", "ঢ": "d", "ণ": "n", "ত": "t", "থ": "t", "দ": "d", "ধ": "d", "ন": "n", "প": "f", "ফ": "f", "ব": "b", "ভ": "b", "ম": "m", "য": "j", "র": "r", "ল": "l", "শ": "s", "ষ": "s", "স": "s", "হ": "h", "ড়": "r", "ঢ়": "r", "ৎ": "t", "ং": "n", "ঃ": "h"
  };
  function skel(s, lat) {
    s = String(s || "").normalize("NFC").toLowerCase();
    s = s.replace(/[\u064B-\u065F\u0670\u0640\u200c\u200d]/g, "");
    s = s.replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
    s = s.replace(/\u09CD\u09AC/g, "");          // ্ব (ত্ব, ক্ব)
    s = s.replace(/\u09DC/g, "ড়").replace(/\u09DD/g, "ঢ়");
    if (/[a-z]/.test(s)) {
      s = s.replace(/gh/g, "g").replace(/kh/g, "k").replace(/sh/g, "s").replace(/th/g, "s").replace(/dh/g, "j").replace(/ph/g, "f").replace(/ch/g, "s")
        .replace(/[qc]/g, "k").replace(/z/g, "j").replace(/v/g, "b").replace(/p/g, "f").replace(/x/g, "ks");
    }
    var o = "";
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (MAP[c]) o += MAP[c];
      else if (/[a-z]/.test(c) && "aeiouyw".indexOf(c) < 0) o += c;
    }
    return o.replace(/(.)\1+/g, "$1");
  }
  var STRIP = /^(?:al|an|ar|as|at|az|ad|ash|adh|ath|aj|ah|aq)(?=[\s\-'’]|$)|^আল|^ال/;
  function core(n) { return n.replace(/^[\s\-']*(?:ال|আল|a[lnrstzdjhq]h?)[\s\-'’]+/i, ""); }

  var KEYS = null;
  function keys() {
    if (KEYS) return KEYS;
    KEYS = [];
    for (var i = 0; i < 114; i++) {
      var set = {};
      var add = function (nm) {
        if (!nm) return;
        var sk = skel(core(nm)); if (sk) set[sk] = 1;
        var sk2 = skel(nm.replace(/^[\s\-']*(?:আল|ال)[\s\-']*/, "")); if (sk2) set[sk2] = 1;
      };
      add(AR[i]);
      (EN[i] || "").split("|").forEach(add);
      (BN[i] || "").split("|").forEach(add);
      KEYS.push(Object.keys(set));
    }
    return KEYS;
  }

  /* শব্দ-ফেলে-দেওয়া তালিকা (সূরা, আয়াত, নম্বর...) */
  var NOISE = /(?:সূরা|সুরা|ছুরা|সূরাহ|সুরাহ|সূরার|সুরার|সূরাটি|সূরাটির|আয়াতুল|আয়াতগুলো|আয়াতটি|আয়াতের|আয়াত|আয়াতে|আয়াতসমূহ|নম্বর|নাম্বার|নং|নাম্বারের|নাম্বর|থেকে|এর|র|এবং|ও|হাদিস|হাদীস|হাদীসসমূহ|সম্পর্কিত|বিষয়ক|দেখাও|দেখান|দেখি|দাও|দিন|সার্চ|সূরাহ|سورة|سوره|آية|ايه|آيه|رقم|surah|sura|surat|soorah|ayat|ayah|aya|verse|verses|number|no|num|nr|of|from|to|the|hadith|hadis)(?![\u0980-\u09FFa-z\u0600-\u06FF])/gi;

  function parseNums(rest) {
    // rest: অক্ষরহীন অংশে সংখ্যা/পরিসর
    var nums = (rest.match(/\d{1,3}/g) || []).map(Number);
    return nums;
  }

  function nk(x) { return String(x || "").normalize("NFC").toLowerCase().replace(/[\u064B-\u065F\u0670\u0640\u200c\u200d\s\-'’]/g, ""); }
  var ALIAS = null;
  function aliasMap() {
    if (ALIAS) return ALIAS;
    ALIAS = {};
    var put = function (nm, i) { var k = nk(nm); if (!k) return; var c = nk(core(nm)); [k, c].forEach(function (z) { if (z && !ALIAS[z]) ALIAS[z] = i; }); };
    for (var i = 0; i < 114; i++) {
      put(AR[i], i + 1); (EN[i] || "").split("|").forEach(function (n) { put(n, i + 1); put("al" + n, i + 1); });
      (BN[i] || "").split("|").forEach(function (n) { put(n, i + 1); put("আল" + n, i + 1); });
    }
    return ALIAS;
  }
  function matchName(txt) {
    var ex1 = aliasMap()[nk(txt)] || aliasMap()[nk(core(txt))];
    if (ex1) return [ex1];
    var q = skel(core(txt.trim()));
    var q2 = skel(txt.replace(/^[\s\-']*(?:আল|ال)[\s\-']*/, ""));
    var qs = [q, q2].filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    if (!qs.length) return null;
    var K = keys(), exact = [], part = [];
    for (var i = 0; i < 114; i++) {
      var ks = K[i], ex = false, best = 0;
      for (var a = 0; a < qs.length; a++) for (var b = 0; b < ks.length; b++) {
        var x = qs[a], y = ks[b];
        if (x === y) ex = true;
        else if (x.length >= 3 && y.length >= 3 && (x.indexOf(y) >= 0 || y.indexOf(x) >= 0)) {
          var sc = Math.min(x.length, y.length) / Math.max(x.length, y.length);
          if (sc > best) best = sc;
        }
      }
      if (ex) exact.push(i + 1); else if (best >= 0.6) part.push([i + 1, best]);
    }
    if (exact.length) return exact;
    part.sort(function (m, n) { return n[1] - m[1]; });
    if (!part.length) return null;
    var top = part[0][1];
    return part.filter(function (p) { return p[1] >= top - 1e-9; }).map(function (p) { return p[0]; });
  }

  function parse(raw) {
    raw = String(raw || "").trim();
    if (!raw) return null;
    var t = digits(raw).replace(/[،,]/g, " ");
    // সরাসরি সংখ্যা-রূপ 25:23 / 25.23 / 25/23-25 — আগের নিয়ম
    var m = t.match(/^(\d{1,3})\s*[:.\/]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?$/);
    if (m) return { s: +m[1], a: +m[2], e: +(m[3] || m[2]), names: [] };
    // শব্দ ও সংখ্যা আলাদা করা
    var txt = t.replace(/\d{1,3}(?:\s*[-–—]\s*\d{1,3})?/g, " # ");
    var numsPart = t.match(/\d{1,3}(?:\s*[-–—]\s*\d{1,3})?/g) || [];
    if (/(?:আয়াতুল|আয়াতুল-?|ayat(?:ul|-?al)?|ayah)\s*[-']?\s*(?:কুরসি|কুরসী|কুরসিয়ি|কুর্সি|কুরছি|kursi|kursiy|الكرسي)/i.test(t)) return { s: 2, a: 255, e: 255, names: ["আয়াতুল কুরসি"] };
    var name = txt.replace(/#/g, " ").replace(NOISE, " ").replace(/[()\[\]{}"“”.:;!?]/g, " ").replace(/\s+/g, " ").trim();
    var nums = [];
    numsPart.forEach(function (p) { var r = p.split(/[-–—]/).map(function (x) { return +x.trim(); }); nums.push(r); });
    if (!name) {
      // শুধু সংখ্যা: দুটি হলে সূরা আয়াত
      if (nums.length === 2 && nums[0].length === 1 && nums[1].length >= 1)
        return { s: nums[0][0], a: nums[1][0], e: nums[1][1] || nums[1][0], names: [] };
      return null;
    }
    var hit = matchName(name);
    if (!hit) return null;
    if (hit.length > 1) return { amb: hit, names: [name] };
    var s = hit[0], a = null, e = null;
    if (nums.length) { a = nums[0][0]; e = nums[0][1] || a; }
    return { s: s, a: a, e: e, names: [name] };
  }

  /* হাদিস-সার্চের জন্য: সূরা চিনলে তার নাম-শব্দ (বাংলা + আরবি) */
  function hadithTerms(raw) {
    var r = parse(raw);
    if (!r || r.amb || !r.s) return null;
    var bn = (BN[r.s - 1] || "").split("|")[0];
    var ar = AR[r.s - 1].replace(/^ال/, "");
    return ["সূরা " + bn, ar].join(" ");
  }
  window.SearchResolve = { parse: parse, hadithTerms: hadithTerms, skel: skel, _AR: AR, _EN: EN, _BN: BN };
})();
