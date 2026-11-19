/* Daily Ruqyah — Daily Note (সাইডবার › Daily Note), Notepad-ধাঁচের নকশা।
   সীমাহীন নোট ও অক্ষর; ফোনেই (IndexedDB) জমা থাকে। পাতা: #note (তালিকা), #note/<id> (লেখা)। app.js রুট DRNOTE.show(id) ডাকে। */
(function () {
  "use strict";
  var host = document.getElementById("drNote");
  if (!host) return;
  var DB = null, cur = null, saveT = 0, dirty = false, seq = 0, shown = 0, lastList = [];
  var PAGE = 100;
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v || d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var L = { q: "", sel: {}, selMode: false, cat: "", trash: false, searching: false };
  var SORT = lsGet("dr-note-sort", { k: "updated", d: -1 });
  var CATS = lsGet("dr-note-cats", []);
  var COLORS = [["Default", ""], ["Pink", "#ffd9de"], ["Blue", "#d9ecff"], ["Green", "#d9f5d9"], ["Orange", "#ffe3c2"], ["Purple", "#eadcff"]];
  var IC = {
    menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
    search: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    more: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
    back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
    check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
    plus: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
    trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
    note: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z",
    listplus: "M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z",
    backup: "M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z",
    folder: "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
  };
  function svg(n) { return '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="' + IC[n] + '"/></svg>'; }
  function $(id) { return document.getElementById(id); }

  /* ---------- ডেটা (IndexedDB: meta + body আলাদা, তাই তালিকা হালকা থাকে) ---------- */
  function idb() {
    if (DB) return Promise.resolve(DB);
    return new Promise(function (res, rej) {
      var q = indexedDB.open("dr-notes", 1);
      q.onupgradeneeded = function () {
        var d = q.result;
        if (!d.objectStoreNames.contains("meta")) d.createObjectStore("meta", { keyPath: "id" });
        if (!d.objectStoreNames.contains("body")) d.createObjectStore("body", { keyPath: "id" });
      };
      q.onsuccess = function () { DB = q.result; res(DB); };
      q.onerror = function () { rej(q.error); };
    });
  }
  function tx(stores, mode, fn) {
    return idb().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(stores, mode), out = fn(t);
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
        t.onerror = t.onabort = function () { rej(t.error); };
      });
    });
  }
  function rawMeta() { return tx(["meta"], "readonly", function (t) { return t.objectStore("meta").getAll(); }).then(function (r) { return r || []; }); }
  function allMeta() {
    return rawMeta().then(function (r) {
      r = r.filter(function (m) { return (L.trash ? !!m.trash : !m.trash) && (!L.cat || m.cat === L.cat); });
      var k = SORT.k, d = SORT.d;
      return r.sort(function (a, b) {
        if (k === "title") return d * String(a.title || "").localeCompare(String(b.title || ""));
        return d * ((a[k] || a.updated || 0) - (b[k] || b.updated || 0));
      });
    });
  }
  function getBody(id) { return tx(["body"], "readonly", function (t) { return t.objectStore("body").get(id); }).then(function (r) { return r ? r.text : ""; }); }
  function getMeta(id) { return tx(["meta"], "readonly", function (t) { return t.objectStore("meta").get(id); }); }
  function disp(n, text) {
    if (n.t && n.t.trim()) return n.t.trim().slice(0, 120);
    var s = (text || "").replace(/\s+/g, " ").trim();
    if (!s) return "Untitled";
    return s.length > 70 ? s.slice(0, 70) + "…" : s;
  }
  function putNote(n, text) {
    n.title = disp(n, text);
    n.len = (text || "").length;
    return tx(["meta", "body"], "readwrite", function (t) { t.objectStore("meta").put(n); t.objectStore("body").put({ id: n.id, text: text }); });
  }
  function setTrash(ids, on) {
    return tx(["meta"], "readwrite", function (t) {
      var s = t.objectStore("meta");
      ids.forEach(function (id) { var g = s.get(id); g.onsuccess = function () { var m = g.result; if (!m) return; if (on) m.trash = Date.now(); else delete m.trash; s.put(m); }; });
    });
  }
  function delForever(ids) {
    return tx(["meta", "body"], "readwrite", function (t) { ids.forEach(function (id) { t.objectStore("meta").delete(id); t.objectStore("body").delete(id); }); });
  }
  function setCat(ids, cat) {
    return tx(["meta"], "readwrite", function (t) {
      var s = t.objectStore("meta");
      ids.forEach(function (id) { var g = s.get(id); g.onsuccess = function () { var m = g.result; if (!m) return; if (cat) m.cat = cat; else delete m.cat; s.put(m); }; });
    });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function fmt(ts) {
    var d = new Date(ts), h = d.getHours();
    return (d.getMonth() + 1) + "/" + d.getDate() + "/" + String(d.getFullYear()).slice(2) + ", " + (h % 12 || 12) + ":" + pad(d.getMinutes()) + " " + (h < 12 ? "AM" : "PM");
  }
  function nid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function root() { return host.querySelector(".nt-root"); }
  function toast(m) {
    var t = host.querySelector(".nt-toast"); if (!t) return;
    t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("on"); }, 1800);
  }
  function persist() { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {} }
  function lock(on) { document.documentElement.classList.toggle("nt-lock", !!on); }

  /* ---------- ছোট উপকরণ: পপআপ মেনু, ফাইল সেভ/শেয়ার ---------- */
  function closePop() { var p = host.querySelector(".nt-pop"); if (p) p.remove(); }
  function pop(items) {
    closePop();
    var m = document.createElement("div"); m.className = "nt-pop";
    items.forEach(function (it) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = it[0];
      if (it[2]) b.disabled = true;
      b.onclick = function (e) { e.stopPropagation(); closePop(); if (it[1]) it[1](); };
      m.appendChild(b);
    });
    root().appendChild(m);
    setTimeout(function () { document.addEventListener("click", closePop, { once: true }); }, 0);
  }
  function safeName(s) { return (String(s || "note").replace(/[\\\/:*?"<>|\n\r]+/g, " ").trim().slice(0, 60)) || "note"; }
  function mkFile(name, text, mime) { try { return new File([text], name, { type: mime || "text/plain" }); } catch (e) { return null; } }
  function saveFiles(files) {
    try {
      if (navigator.canShare && navigator.share && files.every(Boolean) && navigator.canShare({ files: files }))
        return navigator.share({ files: files }).catch(function () {});
    } catch (e) {}
    return files.reduce(function (p, f) {
      return p.then(function () {
        return new Promise(function (r) {
          var a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click();
          setTimeout(function () { a.remove(); URL.revokeObjectURL(a.href); r(); }, 600);
        });
      });
    }, Promise.resolve());
  }
  function exportNotes(ids) {
    return Promise.all(ids.map(function (id) { return Promise.all([getMeta(id), getBody(id)]); })).then(function (rs) {
      var used = {};
      var files = rs.filter(function (r) { return r[0]; }).map(function (r) {
        var n = safeName(r[0].title), k = n, i = 1;
        while (used[k]) k = n + " (" + (++i) + ")";
        used[k] = 1;
        var body = (r[0].t ? r[0].t + "\n\n" : "") + r[1];
        return mkFile(k + ".txt", body);
      });
      if (!files.length) return;
      return saveFiles(files);
    });
  }
  function pickFiles(accept, multiple, cb) {
    var i = document.createElement("input"); i.type = "file"; i.accept = accept; i.multiple = !!multiple; i.style.display = "none";
    i.onchange = function () { var fs = Array.prototype.slice.call(i.files || []); i.remove(); if (fs.length) cb(fs); };
    document.body.appendChild(i); i.click();
  }
  function readText(f) { return f.text ? f.text() : new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsText(f); }); }
  function importTexts() {
    pickFiles(".txt,.md,text/plain", true, function (fs) {
      Promise.all(fs.map(function (f) {
        return readText(f).then(function (txt) {
          var now = Date.now();
          return putNote({ id: nid(), created: now, updated: now, t: f.name.replace(/\.[^.]+$/, ""), sep: 1 }, txt);
        });
      })).then(function () { toast(fs.length + " note(s) imported"); renderList(); });
    });
  }
  function backupOut() {
    Promise.all([rawMeta(), tx(["body"], "readonly", function (t) { return t.objectStore("body").getAll(); })]).then(function (r) {
      var bodies = {}; (r[1] || []).forEach(function (b) { bodies[b.id] = b.text; });
      var data = { app: "daily-note", v: 1, cats: CATS, notes: r[0].map(function (m) { return { meta: m, text: bodies[m.id] || "" }; }) };
      var d = new Date();
      saveFiles([mkFile("daily-note-backup-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + ".json", JSON.stringify(data), "application/json")]);
    });
  }
  function backupIn() {
    pickFiles(".json,application/json", false, function (fs) {
      readText(fs[0]).then(function (s) {
        var d = JSON.parse(s);
        if (!d || d.app !== "daily-note" || !d.notes) throw 0;
        return tx(["meta", "body"], "readwrite", function (t) {
          d.notes.forEach(function (n) { t.objectStore("meta").put(n.meta); t.objectStore("body").put({ id: n.meta.id, text: n.text }); });
        }).then(function () {
          (d.cats || []).forEach(function (c) { if (CATS.indexOf(c) < 0) CATS.push(c); });
          lsSet("dr-note-cats", CATS);
          toast(d.notes.length + " note(s) restored"); renderList();
        });
      }).catch(function () { alert("This is not a valid Daily Note backup file."); });
    });
  }

  /* ---------- তালিকা ---------- */
  function selIds() { return Object.keys(L.sel); }
  function showList() {
    flush(); cur = null; lock(true);
    L.sel = {}; L.selMode = false; L.searching = false; L.q = "";
    host.innerHTML =
      '<div class="nt-root"><div class="nt-tb" id="ntTb"></div><div class="nt-body" id="ntBody"><div id="ntList" class="nt-list"></div></div>' +
      '<div class="nt-fabs"><button class="nt-fab nt-fab-s" id="ntSelB" type="button" aria-label="Select">' + svg("check") + '</button>' +
      '<button class="nt-fab" id="ntNew" type="button" aria-label="New note">' + svg("plus") + '</button></div>' +
      '<div class="nt-dw" id="ntDw"><div class="nt-dws" id="ntDws"></div><div class="nt-dp" id="ntDp"></div></div><div class="nt-toast"></div></div>';
    $("ntNew").onclick = function () { location.hash = "#note/new"; };
    $("ntSelB").onclick = function () { L.selMode = !L.selMode; if (!L.selMode) L.sel = {}; drawTb(); markSel(); };
    $("ntDws").onclick = closeDrawer;
    drawTb(); renderList();
  }
  function title() { return L.trash ? "Trash" : (L.cat || "Daily Note"); }
  function drawTb() {
    var tb = $("ntTb"); if (!tb) return;
    var fabs = host.querySelector(".nt-fabs"); if (fabs) fabs.style.display = L.trash ? "none" : "";
    if (L.selMode) {
      tb.innerHTML = '<button class="nt-tbb" id="ntX" type="button">' + svg("close") + '</button><span class="nt-tt">' + selIds().length + ' selected</span>' +
        '<button class="nt-tbb" id="ntDelS" type="button">' + svg("trash") + '</button><button class="nt-tbb" id="ntMore" type="button">' + svg("more") + '</button>';
      $("ntX").onclick = function () { L.selMode = false; L.sel = {}; drawTb(); markSel(); };
      $("ntDelS").onclick = function () {
        var ids = selIds(); if (!ids.length) return;
        if (L.trash) { if (!confirm("Delete " + ids.length + " note(s) forever?")) return; delForever(ids).then(afterBulk); }
        else { if (!confirm("Move " + ids.length + " note(s) to trash?")) return; setTrash(ids, true).then(afterBulk); }
      };
      $("ntMore").onclick = function (e) {
        e.stopPropagation();
        var ids = selIds(), items = [["Select all notes", selectAll]];
        if (L.trash) items.push(["Restore", function () { if (ids.length) setTrash(ids, false).then(afterBulk); }]);
        else {
          items.push(["Categorize", function () { if (ids.length) catMenu(function (c) { setCat(ids, c).then(afterBulk); }); }]);
          items.push(["Export notes to text files", function () { if (ids.length) exportNotes(ids); }]);
        }
        pop(items);
      };
    } else if (L.searching) {
      tb.innerHTML = '<button class="nt-tbb" id="ntSB" type="button">' + svg("back") + '</button><input class="nt-qi" id="ntQ" type="search" dir="auto" placeholder="Search" autocomplete="off" spellcheck="false"><button class="nt-tbb" id="ntSC" type="button">' + svg("close") + '</button>';
      var q = $("ntQ"), tmr = 0; q.value = L.q;
      q.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { L.q = q.value.trim(); renderList(); }, 180); };
      $("ntSB").onclick = function () { L.searching = false; L.q = ""; drawTb(); renderList(); };
      $("ntSC").onclick = function () { q.value = ""; L.q = ""; renderList(); q.focus(); };
      q.focus();
    } else {
      tb.innerHTML = '<button class="nt-tbb" id="ntMenu" type="button">' + svg("menu") + '</button><span class="nt-tt">' + esc(title()) + '</span>' +
        '<button class="nt-tbb" id="ntSrch" type="button">' + svg("search") + '</button><button class="nt-tbt" id="ntSort" type="button">SORT</button><button class="nt-tbb" id="ntMore" type="button">' + svg("more") + '</button>';
      $("ntMenu").onclick = openDrawer;
      $("ntSrch").onclick = function () { L.searching = true; drawTb(); };
      $("ntSort").onclick = function (e) {
        e.stopPropagation();
        var a = SORT.d < 0 ? " ↓" : " ↑";
        function pick(k, d) { return function () { if (SORT.k === k) SORT.d = -SORT.d; else { SORT.k = k; SORT.d = d; } lsSet("dr-note-sort", SORT); renderList(); }; }
        pop([["Last edit" + (SORT.k === "updated" ? a : ""), pick("updated", -1)], ["Date created" + (SORT.k === "created" ? a : ""), pick("created", -1)], ["Title" + (SORT.k === "title" ? a : ""), pick("title", 1)]]);
      };
      $("ntMore").onclick = function (e) {
        e.stopPropagation();
        if (L.trash) return pop([["Select all notes", selectAll], ["Empty trash", function () {
          allMeta().then(function (ms) { if (!ms.length || !confirm("Delete all " + ms.length + " notes in trash forever?")) return; delForever(ms.map(function (m) { return m.id; })).then(renderList); });
        }]]);
        pop([["Select all notes", selectAll], ["Import text files", importTexts], ["Export notes to text files", function () {
          var ids = lastList.map(function (m) { return m.id; }); if (ids.length) exportNotes(ids); else toast("No notes");
        }]]);
      };
    }
  }
  function afterBulk() { L.selMode = false; L.sel = {}; drawTb(); renderList(); }
  function selectAll() { L.selMode = true; lastList.forEach(function (m) { L.sel[m.id] = 1; }); drawTb(); markSel(); }
  function markSel() {
    var cs = host.querySelectorAll(".nt-card");
    for (var i = 0; i < cs.length; i++) cs[i].classList.toggle("sel", !!L.sel[cs[i].getAttribute("data-id")]);
    host.querySelector(".nt-root") && host.querySelector(".nt-root").classList.toggle("nt-selmode", L.selMode);
  }
  function catMenu(cb) {
    var items = [["No category", function () { cb(""); }]];
    CATS.forEach(function (c) { items.push([c, function () { cb(c); }]); });
    items.push(["New category…", function () { var n = (prompt("Category name") || "").trim(); if (!n) return; if (CATS.indexOf(n) < 0) { CATS.push(n); lsSet("dr-note-cats", CATS); } cb(n); }]);
    pop(items);
  }

  /* ---------- ড্রয়ার ---------- */
  function openDrawer() {
    var items = [];
    function it(ic, label, fn, on) { items.push('<button class="nt-di' + (on ? " on" : "") + '" type="button" data-i="' + fns.length + '">' + svg(ic) + "<span>" + esc(label) + "</span></button>"); fns.push(fn); }
    var fns = [];
    it("note", "Notes", function () { L.cat = ""; L.trash = false; }, !L.cat && !L.trash);
    items.push('<div class="nt-dsep"></div><div class="nt-dlab">Categories</div>');
    CATS.forEach(function (c) { it("folder", c, function () { L.cat = c; L.trash = false; }, L.cat === c && !L.trash); });
    it("listplus", "Edit categories", function () { catEdit(); });
    items.push('<div class="nt-dsep"></div>');
    it("backup", "Backup", function () { pop([["Backup all notes to a file", backupOut], ["Restore from backup file", backupIn]]); });
    it("trash", "Trash", function () { L.trash = true; L.cat = ""; }, L.trash);
    items.push('<div class="nt-dsep"></div>');
    it("home", "Daily Ruqyah", function () { lock(false); location.hash = "#"; });
    var dp = $("ntDp");
    dp.innerHTML = '<div class="nt-dh">Daily Note</div>' + items.join("");
    dp.onclick = function (e) {
      var b = e.target.closest(".nt-di"); if (!b) return;
      var f = fns[+b.getAttribute("data-i")]; closeDrawer(); f();
      if (L.selMode) { L.selMode = false; L.sel = {}; }
      L.searching = false; L.q = ""; drawTb(); renderList();
    };
    $("ntDw").classList.add("on");
  }
  function closeDrawer() { var d = $("ntDw"); if (d) d.classList.remove("on"); }
  function catEdit() {
    var m = document.createElement("div"); m.className = "nt-modal";
    function draw() {
      m.innerHTML = '<div class="nt-mc"><h3>Edit categories</h3>' +
        CATS.map(function (c, i) { return '<div class="nt-mr"><span>' + esc(c) + '</span><button data-r="' + i + '" type="button">✎</button><button data-d="' + i + '" type="button">✕</button></div>'; }).join("") +
        '<button class="nt-ma" data-a="1" type="button">+ Add category</button><button class="nt-ma nt-mdone" data-x="1" type="button">Done</button></div>';
    }
    m.onclick = function (e) {
      var b = e.target.closest("button"); if (!b) { if (e.target === m) { m.remove(); drawTb(); renderList(); } return; }
      if (b.hasAttribute("data-x")) { m.remove(); drawTb(); renderList(); return; }
      if (b.hasAttribute("data-a")) { var n = (prompt("Category name") || "").trim(); if (n && CATS.indexOf(n) < 0) CATS.push(n); }
      else if (b.hasAttribute("data-r")) {
        var i = +b.getAttribute("data-r"), old = CATS[i], nn = (prompt("Rename category", old) || "").trim();
        if (nn && nn !== old && CATS.indexOf(nn) < 0) {
          CATS[i] = nn;
          rawMeta().then(function (ms) { return tx(["meta"], "readwrite", function (t) { ms.forEach(function (x) { if (x.cat === old) { x.cat = nn; t.objectStore("meta").put(x); } }); }); });
          if (L.cat === old) L.cat = nn;
        }
      } else if (b.hasAttribute("data-d")) {
        var j = +b.getAttribute("data-d"), c = CATS[j];
        if (!confirm("Delete category “" + c + "”? Notes in it will be kept.")) return;
        CATS.splice(j, 1);
        rawMeta().then(function (ms) { return tx(["meta"], "readwrite", function (t) { ms.forEach(function (x) { if (x.cat === c) { delete x.cat; t.objectStore("meta").put(x); } }); }); });
        if (L.cat === c) L.cat = "";
      }
      lsSet("dr-note-cats", CATS); draw();
    };
    draw(); root().appendChild(m);
  }

  function renderList() {
    var s = ++seq, box = $("ntList"); if (!box) return;
    allMeta().then(function (metas) {
      if (s !== seq) return;
      var query = L.q;
      if (!query) return draw(metas, box, "");
      var ql = query.toLowerCase();
      var hit = metas.filter(function (m) { return String(m.title || "").toLowerCase().indexOf(ql) >= 0 || String(m.t || "").toLowerCase().indexOf(ql) >= 0; });
      var rest = metas.filter(function (m) { return hit.indexOf(m) < 0; });
      /* বাকি নোটের পুরো লেখাতেও খোঁজে (লম্বা নোটের ভেতরেও) */
      tx(["body"], "readonly", function (t) {
        var found = {}, r = t.objectStore("body").openCursor();
        r.onsuccess = function () { var c = r.result; if (!c) return; if (String(c.value.text || "").toLowerCase().indexOf(ql) >= 0) found[c.value.id] = 1; c.continue(); };
        return { get result() { return found; } };
      }).then(function (found) {
        if (s !== seq) return;
        draw(hit.concat(rest.filter(function (m) { return found[m.id]; })), box, query);
      }).catch(function () { draw(hit, box, query); });
    }).catch(function () { box.innerHTML = '<div class="nt-empty">Could not open notes. Please restart the app.</div>'; });
  }
  function draw(list, box, query) {
    lastList = list;
    if (!list.length) {
      box.innerHTML = '<div class="nt-empty">' + (query ? "No notes found" : (L.trash ? "Trash is empty" : "No notes yet.<br>Tap + to write your first note.")) + "</div>";
      return;
    }
    shown = 0; box.innerHTML = "";
    var more = document.createElement("button"); more.className = "nt-more"; more.type = "button";
    function next() {
      var frag = document.createDocumentFragment(), end = Math.min(list.length, shown + PAGE);
      for (var i = shown; i < end; i++) frag.appendChild(card(list[i]));
      shown = end; box.insertBefore(frag, more);
      more.hidden = shown >= list.length; more.textContent = "Show more (" + (list.length - shown) + ")";
    }
    more.onclick = next; box.appendChild(more); next();
  }
  function card(m) {
    var d = document.createElement("div"); d.className = "nt-card" + (L.sel[m.id] ? " sel" : ""); d.setAttribute("data-id", m.id);
    if (m.color) d.style.background = m.color;
    d.innerHTML = "<b dir=\"auto\">" + esc(m.title || "Untitled") + "</b><span>Last edit: " + esc(fmt(m.updated)) + "</span>";
    var lp = 0, fired = false;
    function toggle() { if (L.sel[m.id]) delete L.sel[m.id]; else L.sel[m.id] = 1; if (!selIds().length && !L.trash) L.selMode = false; drawTb(); markSel(); }
    d.addEventListener("pointerdown", function () { fired = false; clearTimeout(lp); lp = setTimeout(function () { fired = true; if (!L.selMode) { L.selMode = true; L.sel[m.id] = 1; drawTb(); markSel(); } }, 550); });
    ["pointerup", "pointerleave", "pointercancel", "pointermove"].forEach(function (ev) { d.addEventListener(ev, function () { clearTimeout(lp); }); });
    d.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    d.onclick = function () {
      if (fired) { fired = false; return; }
      if (L.selMode) return toggle();
      if (L.trash) { L.selMode = true; L.sel[m.id] = 1; drawTb(); markSel(); return; }
      location.hash = "#note/" + m.id;
    };
    return d;
  }

  /* ---------- এডিটর ---------- */
  var H = null, hi = 0, hT = 0, readMode = false;
  function snap() { return { t: $("ntTi").value, b: $("ntTx").value }; }
  function pushHist() {
    clearTimeout(hT);
    if (!H || !$("ntTi") || !$("ntTx")) return;
    var s = snap(), l = H[hi];
    if (l && l.t === s.t && l.b === s.b) return;
    H.length = hi + 1; H.push(s); if (H.length > 100) H.shift(); hi = H.length - 1; undoState();
  }
  function applyHist(i) {
    pushHist(); hi = Math.max(0, Math.min(H.length - 1, i));
    var s = H[hi]; $("ntTi").value = s.t; $("ntTx").value = s.b; cur.t = s.t; cur.text = s.b; touch(); undoState();
  }
  function undoState() { var u = $("ntUndo"); if (u) u.disabled = hi <= 0; }
  function touch() { dirty = true; clearTimeout(saveT); saveT = setTimeout(flush, 250); }
  function bg(c) { var e = host.querySelector(".nt-edcard"); if (e) e.style.background = c || ""; }

  function openEditor(id) {
    flush(); lock(true); closeDrawer();
    var isNew = id === "new", now = Date.now();
    var meta = isNew ? { id: nid(), created: now, updated: now, t: "", sep: 1 } : null;
    if (isNew) { if (L.cat && !L.trash) meta.cat = L.cat; history.replaceState(null, "", "#note/" + meta.id); }
    var p = isNew ? Promise.resolve(["", meta]) : Promise.all([getBody(id), getMeta(id)]);
    p.then(function (r) {
      var text = r[0], m = r[1];
      if (!m) { location.replace("#note"); return; }
      if (m.t === undefined) m.t = "";
      cur = { meta: m, text: text, t: m.t, isNew: isNew, saved: !isNew }; dirty = false; readMode = false;
      host.innerHTML =
        '<div class="nt-root nt-ed"><div class="nt-tb"><button class="nt-tbb" id="ntBk" type="button">' + svg("back") + '</button><span class="nt-tt">Daily Note</span>' +
        '<button class="nt-tbt" id="ntSave" type="button">SAVE</button><button class="nt-tbt" id="ntUndo" type="button" disabled>UNDO</button><button class="nt-tbb" id="ntMore" type="button">' + svg("more") + '</button></div>' +
        '<div class="nt-find" id="ntFind" hidden><input id="ntFq" type="search" dir="auto" placeholder="Search in note" autocomplete="off"><button type="button" id="ntFn">▼</button><button type="button" id="ntFx">✕</button></div>' +
        '<div class="nt-fmt" id="ntFmt" hidden><button data-f="• " type="button">•</button><button data-f="☐ " type="button">☐</button><button data-f="1. " type="button">1.</button><button data-f="  " type="button">⇥</button><button data-f="@d" type="button">Date</button></div>' +
        '<div class="nt-edcard"><input id="ntTi" class="nt-ti" dir="auto" placeholder="Enter title..." autocomplete="off"><textarea id="ntTx" class="nt-tx" dir="auto" spellcheck="false"></textarea></div><div class="nt-toast"></div></div>';
      var ti = $("ntTi"), ta = $("ntTx");
      ti.value = cur.t; ta.value = text; bg(m.color);
      H = [{ t: cur.t, b: text }]; hi = 0;
      function edit() { cur.t = ti.value; cur.text = ta.value; touch(); clearTimeout(hT); hT = setTimeout(pushHist, 350); }
      ti.oninput = edit; ta.oninput = edit;
      ta.addEventListener("click", function () { /* ☐/☑ ছুঁলে টিক বদলায় */
        var v = ta.value, ss = ta.selectionStart, ls = v.lastIndexOf("\n", ss - 1) + 1, ch = v.charAt(ls);
        if (ss - ls <= 1 && (ch === "☐" || ch === "☑")) { ta.value = v.slice(0, ls) + (ch === "☐" ? "☑" : "☐") + v.slice(ls + 1); ta.setSelectionRange(ss, ss); edit(); }
      });
      $("ntBk").onclick = function () { var go = function () { location.hash = "#note"; }; flush().then(go, go); };
      $("ntSave").onclick = function () { dirty = true; flush().then(function () { toast("Saved"); }); };
      $("ntUndo").onclick = function () { applyHist(hi - 1); };
      $("ntMore").onclick = function (e) { e.stopPropagation(); editMenu(); };
      $("ntFx").onclick = function () { $("ntFind").hidden = true; };
      $("ntFn").onclick = findNext;
      $("ntFq").onkeydown = function (e) { if (e.key === "Enter") { e.preventDefault(); findNext(); } };
      $("ntFmt").onclick = function (e) {
        var b = e.target.closest("button"); if (!b || readMode) return;
        var f = b.getAttribute("data-f"), v = ta.value, ss = ta.selectionStart, se = ta.selectionEnd;
        if (f === "@d") { var s = fmt(Date.now()); ta.value = v.slice(0, ss) + s + v.slice(se); ta.setSelectionRange(ss + s.length, ss + s.length); }
        else { var ls = v.lastIndexOf("\n", ss - 1) + 1; ta.value = v.slice(0, ls) + f + v.slice(ls); ta.setSelectionRange(ss + f.length, ss + f.length); }
        ta.focus(); edit();
      };
      if (isNew) ta.focus();
      persist();
    }).catch(function () { host.innerHTML = '<div class="nt-root"><div class="nt-empty">Could not open the note.</div></div>'; });
  }
  function findNext() {
    var q = $("ntFq").value.toLowerCase(), ta = $("ntTx"); if (!q) return;
    var v = ta.value.toLowerCase(), from = ta.selectionEnd, i = v.indexOf(q, from);
    if (i < 0) i = v.indexOf(q, 0);
    if (i < 0) return toast("Not found");
    ta.focus(); ta.setSelectionRange(i, i + q.length);
    var lines = ta.value.slice(0, i).split("\n").length; ta.scrollTop = Math.max(0, (lines - 3) * 26);
  }
  function editMenu() {
    var ta = $("ntTx"), ti = $("ntTi"), isCheck = /^\s*[☐☑] /m.test(ta.value);
    pop([
      ["Redo", function () { applyHist(hi + 1); }, hi >= H.length - 1],
      ["Undo all", function () { applyHist(0); }, hi <= 0],
      ["Share", function () {
        var v = (ti.value ? ti.value + "\n\n" : "") + ta.value; if (!v.trim()) return;
        if (navigator.share) navigator.share({ text: v }).catch(function () {});
        else { try { navigator.clipboard.writeText(v); toast("Copied"); } catch (e) {} }
      }],
      ["Delete", function () {
        if (!confirm("Move this note to trash?")) return;
        clearTimeout(saveT); cur.meta.trash = Date.now(); dirty = true;
        (cur.saved || cur.text.trim() || cur.t.trim() ? flush() : Promise.resolve()).then(function () { dirty = false; cur = null; location.hash = "#note"; });
      }],
      ["Search", function () { $("ntFind").hidden = false; $("ntFq").focus(); }],
      ["Export to a text file", function () {
        var n = safeName(cur.t || disp(cur.meta, cur.text)); saveFiles([mkFile(n + ".txt", (cur.t ? cur.t + "\n\n" : "") + ta.value)]);
      }],
      ["Categorize", function () { catMenu(function (c) { if (c) cur.meta.cat = c; else delete cur.meta.cat; dirty = true; flush().then(function () { toast(c ? "Category: " + c : "Category removed"); }); }); }],
      ["Colorize", function () {
        pop(COLORS.map(function (c) { return [c[0], function () { if (c[1]) cur.meta.color = c[1]; else delete cur.meta.color; bg(c[1]); dirty = true; flush(); }]; }));
      }],
      [isCheck ? "Convert to text" : "Convert to checklist", function () {
        var v = ta.value.split("\n").map(function (l) {
          if (isCheck) return l.replace(/^(\s*)[☐☑] /, "$1");
          return l.trim() && !/^\s*[☐☑] /.test(l) ? "☐ " + l : l;
        }).join("\n");
        ta.value = v; cur.text = v; touch(); pushHist();
      }],
      [readMode ? "Switch to edit mode" : "Switch to read mode", function () { readMode = !readMode; ta.readOnly = readMode; ti.readOnly = readMode; toast(readMode ? "Read mode" : "Edit mode"); }],
      ["Print", function () { window.print(); }],
      [$("ntFmt").hidden ? "Show formatting bar" : "Hide formatting bar", function () { $("ntFmt").hidden = !$("ntFmt").hidden; }],
      ["Show info", function () {
        var v = ta.value, words = (v.trim().match(/\S+/g) || []).length;
        alert("Characters: " + v.length + "\nWords: " + words + "\nLines: " + (v ? v.split("\n").length : 0) + "\nCreated: " + fmt(cur.meta.created || cur.meta.updated) + "\nLast edit: " + fmt(cur.meta.updated));
      }]
    ]);
  }
  /* লেখা জমা (খালি নতুন নোট জমা হয় না) */
  function flush() {
    clearTimeout(saveT);
    if (!cur || !dirty) return Promise.resolve();
    var c = cur; dirty = false;
    if (!c.text.trim() && !(c.t || "").trim() && c.isNew && !c.saved) return Promise.resolve();
    c.meta.updated = Date.now(); c.meta.t = c.t || "";
    return putNote(c.meta, c.text).then(function () { c.saved = true; }, function () { dirty = true; var t = host.querySelector(".nt-toast"); if (t) toast("⚠ Could not save"); });
  }
  addEventListener("pagehide", flush);
  addEventListener("hashchange", flush);
  addEventListener("blur", flush);
  addEventListener("freeze", flush);
  setInterval(function () { if (dirty) flush(); }, 2000);
  document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); });

  window.DRNOTE = {
    show: function (id) { if (id) openEditor(id); else showList(); },
    leave: function () { lock(false); return flush(); }
  };
  /* note.js, app.js-এর পরে লোড হয়: #note সরাসরি খোলা থাকলে (অ্যাপ চালু/রিলোডে) এখানেই দেখাও */
  (function () {
    var m = /^#note(?:\/([^\/]+))?$/.exec(location.hash || "");
    if (m && !host.hidden) window.DRNOTE.show(m[1]);
  })();
})();
