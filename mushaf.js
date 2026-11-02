/* Daily Ruqyah — ১৫ লাইনের হাফেজি কুরআন (মদীনা মুসহাফের ৬০৪ পৃষ্ঠা), পৃষ্ঠা বাই পৃষ্ঠা পড়া। অফলাইনে চলে (data/mushaf15.json অ্যাপের ভেতরেই) */
(function () {
  "use strict";
  var BD = "০১২৩৪৫৬৭৮৯", AD = "٠١٢٣٤٥٦٧٨٩";
  function bn(n) { return String(n).replace(/[0-9]/g, function (c) { return BD.charAt(+c); }); }
  var DATA = null, loading = null, SURAH_PAGE = null, host = null, page = 1, boxW = 0;

  function load() {
    if (DATA) return Promise.resolve(DATA);
    return loading || (loading = fetch("data/mushaf15.json?v=1").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
      DATA = d; SURAH_PAGE = [];
      d.forEach(function (pg, i) { pg.forEach(function (l) { if (l[0] === 0 && l[1]) SURAH_PAGE.push([l[1], i + 1]); }); });
      return d;
    }));
  }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function save() { try { localStorage.setItem("drMushafPage", String(page)); } catch (e) { } }
  function saved() { try { var v = +localStorage.getItem("drMushafPage"); return v >= 1 && v <= 604 ? v : 1; } catch (e) { return 1; } }

  // লাইনটি কয়েকটি শব্দে ভেঙে flex-এ ছড়িয়ে দেয় (মুসহাফের মতো দুই প্রান্ত সমান); আয়াত-শেষের সংখ্যা গোল চিহ্নে
  function lineEl(l) {
    var d = el("div", "mf-l mf-t" + l[0]);
    if (l[0] === 0) { d.appendChild(el("span", "mf-sh", l[1])); return d; }
    var toks = l[1].split(/\s+/).filter(Boolean);
    toks.forEach(function (w) {
      var s = el("span", "mf-w");
      if (/^[٠-٩۰-۹]+$/.test(w)) { s.className += " mf-n"; s.textContent = w; } else s.textContent = w;
      d.appendChild(s);
    });
    if (l[0] === 2) d.className += " mf-c";
    return d;
  }

  function fit(pgEl) {
    // সবচেয়ে চওড়া লাইন যেন ঠিক এঁটে যায় এমন ফন্ট-সাইজ
    var W = pgEl.clientWidth - 16; if (W <= 0) return;
    var lines = pgEl.querySelectorAll(".mf-t1"), base = 20, max = 0, i;
    pgEl.style.fontSize = base + "px";
    for (i = 0; i < lines.length; i++) {
      var ws = lines[i].children, tot = 0, j;
      for (j = 0; j < ws.length; j++) tot += ws[j].getBoundingClientRect().width;
      tot += (ws.length - 1) * base * 0.28; // শব্দের মাঝে ন্যূনতম ফাঁক
      if (tot > max) max = tot;
    }
    var size = max > 0 ? base * W / max : base;
    pgEl.style.fontSize = Math.max(13, Math.min(34, size)) + "px";
  }

  function draw() {
    var pg = DATA[page - 1];
    var body = host.querySelector(".mf-page");
    body.innerHTML = "";
    pg.forEach(function (l) { body.appendChild(lineEl(l)); });
    body.className = "mf-page" + (pg.length < 15 ? " mf-short" : "");
    fit(body);
    host.querySelector(".mf-no").textContent = "পৃষ্ঠা " + bn(page) + " / " + bn(604);
    host.querySelector(".mf-in").value = page;
    save();
  }
  function go(n, scroll) {
    n = Math.max(1, Math.min(604, Math.round(+n) || 1));
    page = n; draw();
    if (scroll !== false) window.scrollTo({ top: 0 });
  }

  function open(rd, surah) {
    host = rd; rd.innerHTML = "";
    var top = el("div", "mf-top");
    top.appendChild(el("b", null, "কুরআন · ১৫ লাইন"));
    rd.appendChild(top);
    var nav = el("div", "mf-nav");
    var prev = el("button", "mf-btn", "‹ আগের"); prev.type = "button"; prev.onclick = function () { go(page - 1); };
    var next = el("button", "mf-btn", "পরের ›"); next.type = "button"; next.onclick = function () { go(page + 1); };
    var no = el("span", "mf-no", "");
    var inp = el("input", "mf-in"); inp.type = "number"; inp.min = 1; inp.max = 604; inp.inputMode = "numeric";
    inp.onchange = function () { go(inp.value); };
    var sel = el("select", "mf-sel"); sel.setAttribute("aria-label", "সূরা");
    nav.appendChild(prev); nav.appendChild(no); nav.appendChild(next);
    rd.appendChild(nav);
    var jr = el("div", "mf-jr"); jr.appendChild(sel); jr.appendChild(inp);
    rd.appendChild(jr);
    var pgE = el("div", "mf-page"); rd.appendChild(pgE);
    var nav2 = nav.cloneNode(true);
    var p2 = nav2.children[0], n2 = nav2.children[2];
    p2.onclick = function () { go(page - 1); }; n2.onclick = function () { go(page + 1); };
    nav2.className = "mf-nav mf-nav2";
    rd.appendChild(nav2);
    // বাঁ/ডানে সোয়াইপ: আরবি বইয়ের মতো — ডানে টানলে পরের পৃষ্ঠা
    var sx = null, sy = null;
    pgE.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    pgE.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(page + (dx > 0 ? 1 : -1));
    }, { passive: true });
    pgE.textContent = "লোড হচ্ছে…";
    load().then(function () {
      SURAH_PAGE.forEach(function (s, i) { var o = el("option", null, bn(i + 1) + ". " + s[0]); o.value = s[1]; sel.appendChild(o); });
      sel.onchange = function () { go(sel.value); };
      var p = surah >= 1 && surah <= 114 ? SURAH_PAGE[surah - 1][1] : saved();
      go(p, false);
      sel.value = String(SURAH_PAGE.reduce(function (a, s) { return s[1] <= page ? s[1] : a; }, 1));
      pgE.__w = pgE.clientWidth;
    }).catch(function () { pgE.textContent = "ডেটা লোড হয়নি।"; });
    if (!open.rs) { open.rs = 1; window.addEventListener("resize", function () { if (DATA && host && !host.hidden && host.querySelector(".mf-page")) draw(); }); }
  }
  window.DRMUSHAF = { open: open };
})();
