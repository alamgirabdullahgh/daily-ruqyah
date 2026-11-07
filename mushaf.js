/* Daily Ruqyah — ১৫ লাইনের হাফেজি কুরআন (মদীনা মুসহাফের ৬০৪ পৃষ্ঠা), বইয়ের পাতার মতো উল্টে পড়া।
   অফলাইনে চলে: data/mushaf15.json ও vendor/page-flip.browser.js (StPageFlip, MIT) অ্যাপের ভেতরেই।
   আরবি বইয়ের নিয়মে পাতা ডান থেকে বাঁয়ে সাজানো: ডানে টানলে পরের পৃষ্ঠা, বাঁয়ে টানলে আগের পৃষ্ঠা। */
(function () {
  "use strict";
  var BD = "০১২৩৪৫৬৭৮৯";
  var TOTAL = 604, NEAR = 3, KEEP = 8;
  function bn(n) { return String(n).replace(/[0-9]/g, function (c) { return BD.charAt(+c); }); }
  var DATA = null, loading = null, SURAH_PAGE = null;
  var host = null, pf = null, fb = null, pageEls = [], filled = {}, page = 1, geo = null, ui = null, measure = null;

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
  function saved() { try { var v = +localStorage.getItem("drMushafPage"); return v >= 1 && v <= TOTAL ? v : 1; } catch (e) { return 1; } }

  // আরবি বইয়ের ক্রম উল্টো: lib-এর সূচক i ↔ মুসহাফের পৃষ্ঠা (৬০৪ − i)
  function idxOf(p) { return TOTAL - p; }
  function pageOf(i) { return TOTAL - i; }

  function surahOf(p) {
    var name = "";
    for (var i = 0; i < SURAH_PAGE.length; i++) { if (SURAH_PAGE[i][1] <= p) name = SURAH_PAGE[i][0]; else break; }
    return name;
  }

  function lineEl(l) {
    var d = el("div", "mf-l mf-t" + l[0]);
    if (l[0] === 0) { d.appendChild(el("span", "mf-sh", l[1])); return d; }
    l[1].split(/\s+/).filter(Boolean).forEach(function (w) {
      var s = el("span", "mf-w", w);
      if (/^[٠-٩۰-۹]+$/.test(w)) s.className += " mf-n";
      d.appendChild(s);
    });
    if (l[0] === 2) d.className += " mf-c";
    return d;
  }

  // সবচেয়ে চওড়া লাইন যেন ঠিক এঁটে যায় এমন ফন্ট-সাইজ (লাইনের উচ্চতার সীমার ভেতরে)
  function fitSize(pg, innerW, lineH) {
    var base = 20, max = 0;
    measure.style.width = innerW + "px";
    measure.style.fontSize = base + "px";
    measure.innerHTML = "";
    pg.forEach(function (l) { if (l[0] === 1) measure.appendChild(lineEl(l)); });
    var lines = measure.children;
    for (var i = 0; i < lines.length; i++) {
      var ws = lines[i].children, tot = 0, j;
      for (j = 0; j < ws.length; j++) tot += ws[j].getBoundingClientRect().width;
      tot += (ws.length - 1) * base * 0.26;
      if (tot > max) max = tot;
    }
    measure.innerHTML = "";
    var byW = max > 0 ? base * innerW / max : base;
    return Math.max(12, Math.min(byW, lineH / 1.7, 30));
  }

  function fill(i) {
    if (i < 0 || i >= TOTAL || filled[i]) return;
    var p = pageOf(i), pg = DATA[p - 1], box = pageEls[i];
    var innerW = geo.w - 28, innerH = geo.h - 34 - 30;
    var n = pg.length < 15 ? pg.length + 2 : 15;
    var lineH = innerH / n;
    var size = fitSize(pg, innerW, lineH);
    box.innerHTML = "";
    var top = el("div", "mf-pt");
    top.appendChild(el("span", "mf-ps", surahOf(p)));
    var lines = el("div", "mf-lines" + (pg.length < 15 ? " mf-short" : ""));
    lines.style.fontSize = size + "px";
    lines.style.height = innerH + "px";
    pg.forEach(function (l) { var d = lineEl(l); d.style.height = lineH + "px"; lines.appendChild(d); });
    var foot = el("div", "mf-pf"); foot.appendChild(el("span", "mf-pn", bn(p)));
    box.appendChild(top); box.appendChild(lines); box.appendChild(foot);
    filled[i] = 1;
  }
  function fillAround(c) {
    var i;
    for (i = c - NEAR; i <= c + NEAR; i++) fill(i);
    Object.keys(filled).forEach(function (k) {
      if (Math.abs(+k - c) > KEEP) { pageEls[+k].innerHTML = ""; delete filled[k]; }
    });
  }

  function sync() {
    ui.no.textContent = "পৃষ্ঠা " + bn(page) + " / " + bn(TOTAL);
    ui.inp.value = page;
    ui.sel.value = String(SURAH_PAGE.reduce(function (a, s) { return s[1] <= page ? s[1] : a; }, 1));
    ui.prev.disabled = page <= 1; ui.next.disabled = page >= TOTAL;
    save();
  }

  function destroy() {
    if (pf) { try { pf.destroy(); } catch (e) { } pf = null; }
    pageEls = []; filled = {}; fb = null;
  }

  function build(startPage) {
    destroy();
    ui.bookWrap.innerHTML = "";
    var avail = Math.max(240, (ui.bookWrap.clientWidth || host.clientWidth || 360) - 8);
    var pw = Math.min(avail, 520);
    var ph = Math.round(pw * 1.5);
    var maxH = Math.max(320, (window.innerHeight || 700) - 300);
    if (ph > maxH) { ph = Math.round(maxH); pw = Math.min(pw, Math.round(ph / 1.3)); }
    geo = { w: pw, h: ph };
    measure = el("div", "mf-measure"); ui.bookWrap.appendChild(measure);
    var book = el("div", "mf-book"); book.style.width = pw + "px"; book.style.height = ph + "px";
    ui.bookWrap.appendChild(book);
    var i;
    for (i = 0; i < TOTAL; i++) {
      var b = el("div", "mf-pg"); b.style.width = pw + "px"; b.style.height = ph + "px";
      pageEls.push(b); book.appendChild(b);
    }
    page = startPage;
    fillAround(idxOf(page));
    if (!window.St || !window.St.PageFlip) {
      // লাইব্রেরি না এলেও কুরআন যেন উধাও না হয়: ওল্টানো ছাড়া সাধারণ পাতা, বাটন ও সোয়াইপ চালু
      fb = book; showFb();
      var sx = null;
      book.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
      book.addEventListener("touchend", function (e) {
        if (sx == null) return;
        var dx = e.changedTouches[0].clientX - sx; sx = null;
        if (Math.abs(dx) > 50) go(page + (dx > 0 ? 1 : -1));
      }, { passive: true });
      sync(); return;
    }
    fb = null;
    pf = new window.St.PageFlip(book, {
      width: pw, height: ph, size: "fixed", usePortrait: true, showCover: false,
      startPage: idxOf(page), drawShadow: true, maxShadowOpacity: 0.45, flippingTime: 650,
      swipeDistance: 24, mobileScrollSupport: false, showPageCorners: false, startZIndex: 1
    });
    pf.loadFromHTML(pageEls);
    pf.on("flip", function (e) {
      page = pageOf(e.data); fillAround(e.data); sync();
    });
    sync();
  }

  function showFb() {
    var i = idxOf(page);
    fillAround(i);
    fb.innerHTML = ""; fb.appendChild(pageEls[i]);
  }

  function go(n, animate) {
    n = Math.max(1, Math.min(TOTAL, Math.round(+n) || 1));
    if (fb && n !== page) { page = n; showFb(); sync(); window.scrollTo({ top: 0 }); return; }
    if (n === page || !pf) { if (ui) sync(); return; }
    var i = idxOf(n);
    fillAround(i);
    if (animate && Math.abs(n - page) === 1) { if (n > page) pf.flipPrev(); else pf.flipNext(); }
    else { pf.turnToPage(i); page = n; sync(); }
    window.scrollTo({ top: 0 });
  }

  function open(rd, surah) {
    destroy();
    host = rd; rd.innerHTML = "";
    var top = el("div", "mf-top");
    top.appendChild(el("b", null, "কুরআন · ১৫ লাইন"));
    rd.appendChild(top);
    var jr = el("div", "mf-jr");
    var sel = el("select", "mf-sel"); sel.setAttribute("aria-label", "সূরা");
    var inp = el("input", "mf-in"); inp.type = "number"; inp.min = 1; inp.max = TOTAL; inp.inputMode = "numeric";
    jr.appendChild(sel); jr.appendChild(inp); rd.appendChild(jr);
    var bookWrap = el("div", "mf-wrap"); bookWrap.textContent = "লোড হচ্ছে…"; rd.appendChild(bookWrap);
    var nav = el("div", "mf-nav");
    var prev = el("button", "mf-btn", "‹ আগের"); prev.type = "button";
    var next = el("button", "mf-btn", "পরের ›"); next.type = "button";
    var no = el("span", "mf-no", "");
    nav.appendChild(prev); nav.appendChild(no); nav.appendChild(next); rd.appendChild(nav);
    ui = { sel: sel, inp: inp, no: no, prev: prev, next: next, bookWrap: bookWrap };
    prev.onclick = function () { go(page - 1, true); };
    next.onclick = function () { go(page + 1, true); };
    inp.onchange = function () { go(inp.value); };
    Promise.all([load(), (document.fonts && document.fonts.load ? document.fonts.load('20px "Scheherazade New"').catch(function () { }) : null)]).then(function () {
      SURAH_PAGE.forEach(function (s, i) { var o = el("option", null, bn(i + 1) + ". " + s[0]); o.value = s[1]; sel.appendChild(o); });
      sel.onchange = function () { go(sel.value); };
      var p = surah >= 1 && surah <= 114 ? SURAH_PAGE[surah - 1][1] : saved();
      build(p);
    }).catch(function () { bookWrap.textContent = "ডেটা লোড হয়নি।"; });
    if (!open.rs) {
      open.rs = 1;
      var t = null, lastW = 0;
      window.addEventListener("resize", function () {
        clearTimeout(t);
        t = setTimeout(function () {
          if (!DATA || !host || host.hidden || !ui || !ui.bookWrap.isConnected) return;
          var w = ui.bookWrap.clientWidth;
          if (Math.abs(w - lastW) > 40) { lastW = w; build(page); }
        }, 250);
      });
    }
  }
  window.DRMUSHAF = { open: open };
})();
