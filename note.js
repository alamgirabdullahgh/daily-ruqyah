/* Daily Ruqyah — Daily Note (সাইডবার › Daily Note)। সীমাহীন নোট, সীমাহীন অক্ষর; ফোনেই (IndexedDB) জমা থাকে, অ্যাপ বন্ধ করলেও হারায় না।
   পাতা: #note (তালিকা + খোঁজা), #note/<id> (লেখা; নিজে নিজে সেভ হয়)। app.js রুট থেকে DRNOTE.show(id) ডাকে। */
(function () {
  "use strict";
  var host = document.getElementById("drNote");
  if (!host) return;
  var DB = null, cur = null, saveT = 0, dirty = false, searchSeq = 0, shown = 0;
  var PAGE = 100;

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
        var t = d.transaction(stores, mode), out;
        out = fn(t);
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
        t.onerror = t.onabort = function () { rej(t.error); };
      });
    });
  }
  function allMeta() {
    return tx(["meta"], "readonly", function (t) { return t.objectStore("meta").getAll(); })
      .then(function (r) { return (r || []).sort(function (a, b) { return (b.pin || 0) - (a.pin || 0) || b.updated - a.updated; }); });
  }
  function getBody(id) {
    return tx(["body"], "readonly", function (t) { return t.objectStore("body").get(id); }).then(function (r) { return r ? r.text : ""; });
  }
  function putNote(n, text) {
    var t0 = (text || "").replace(/^\s+/, "");
    var line = t0.split("\n")[0].trim();
    n.title = line.slice(0, 80);
    n.preview = t0.slice(line.length).trim().slice(0, 140);
    n.len = (text || "").length;
    return tx(["meta", "body"], "readwrite", function (t) { t.objectStore("meta").put(n); t.objectStore("body").put({ id: n.id, text: text }); });
  }
  function delNote(id) {
    return tx(["meta", "body"], "readwrite", function (t) { t.objectStore("meta").delete(id); t.objectStore("body").delete(id); });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function when(ts) {
    try {
      var d = new Date(ts), n = new Date();
      var same = d.toDateString() === n.toDateString();
      return same ? d.toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" })
        : d.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: d.getFullYear() === n.getFullYear() ? undefined : "numeric" });
    } catch (e) { return ""; }
  }
  function nid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function toast(m) {
    var t = host.querySelector(".nt-toast"); if (!t) return;
    t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("on"); }, 1800);
  }
  function persist() { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {} }

  /* ---------- তালিকা ---------- */
  function showList() {
    flush();
    cur = null;
    host.innerHTML =
      '<div class="nt-wrap"><div class="nt-head"><h2>Daily Note</h2><span class="nt-cnt" id="ntCnt"></span></div>' +
      '<div class="nt-search"><input id="ntQ" type="search" dir="auto" placeholder="নোটে খুঁজুন" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
      '<div id="ntList" class="nt-list"></div>' +
      '<button class="nt-fab" id="ntNew" type="button" aria-label="নতুন নোট">＋</button><div class="nt-toast"></div></div>';
    document.getElementById("ntNew").onclick = function () { location.hash = "#note/new"; };
    var q = document.getElementById("ntQ");
    var tmr = 0;
    q.oninput = function () { clearTimeout(tmr); tmr = setTimeout(function () { renderList(q.value.trim()); }, 180); };
    renderList("");
  }
  function renderList(query) {
    var seq = ++searchSeq, box = document.getElementById("ntList"), cnt = document.getElementById("ntCnt");
    if (!box) return;
    allMeta().then(function (metas) {
      if (seq !== searchSeq) return;
      if (cnt) cnt.textContent = metas.length ? metas.length + "টি" : "";
      if (!query) return draw(metas, box, "");
      var ql = query.toLowerCase();
      var hit = metas.filter(function (m) { return (m.title + " " + m.preview).toLowerCase().indexOf(ql) >= 0; });
      var rest = metas.filter(function (m) { return hit.indexOf(m) < 0; });
      /* বাকি নোটের পুরো লেখাতেও খোঁজে (লম্বা নোটের ভেতরেও) */
      tx(["body"], "readonly", function (t) {
        var out = { found: {}, result: null };
        var r = t.objectStore("body").openCursor();
        r.onsuccess = function () {
          var c = r.result; if (!c) return;
          if (String(c.value.text || "").toLowerCase().indexOf(ql) >= 0) out.found[c.value.id] = 1;
          c.continue();
        };
        return { get result() { return out.found; } };
      }).then(function (found) {
        if (seq !== searchSeq) return;
        var more = rest.filter(function (m) { return found[m.id]; });
        draw(hit.concat(more), box, query);
      }).catch(function () { draw(hit, box, query); });
    }).catch(function () {
      if (box) box.innerHTML = '<div class="nt-empty">নোট খোলা যায়নি। অ্যাপ আবার চালু করে দেখুন।</div>';
    });
  }
  function draw(list, box, query) {
    if (!list.length) {
      box.innerHTML = '<div class="nt-empty">' + (query ? "কোনো নোট মেলেনি" : "এখনো কোনো নোট নেই।<br>নিচের ＋ চেপে প্রথম নোট লিখুন।") + "</div>";
      return;
    }
    shown = 0;
    box.innerHTML = "";
    var more = document.createElement("button");
    more.className = "nt-more"; more.type = "button";
    function next() {
      var frag = document.createDocumentFragment(), end = Math.min(list.length, shown + PAGE);
      for (var i = shown; i < end; i++) {
        var m = list[i], a = document.createElement("a");
        a.className = "nt-item"; a.href = "#note/" + m.id;
        a.innerHTML = (m.pin ? '<i class="nt-pin">📌</i>' : "") + "<b>" + esc(m.title || "শিরোনামহীন") + "</b><small>" + esc(m.preview || "") + "</small><span>" + esc(when(m.updated)) + "</span>";
        frag.appendChild(a);
      }
      shown = end;
      box.insertBefore(frag, more);
      more.hidden = shown >= list.length;
      more.textContent = "আরও দেখুন (" + (list.length - shown) + ")";
    }
    more.onclick = next;
    box.appendChild(more);
    next();
  }

  /* ---------- এডিটর ---------- */
  function openEditor(id) {
    flush();
    var isNew = id === "new";
    var meta = isNew ? { id: nid(), created: Date.now(), updated: Date.now(), pin: 0 } : null;
    if (isNew) history.replaceState(null, "", "#note/" + meta.id);
    var p = isNew ? Promise.resolve(["", meta]) :
      Promise.all([getBody(id), tx(["meta"], "readonly", function (t) { return t.objectStore("meta").get(id); })]);
    p.then(function (r) {
      var text = r[0], m = r[1];
      if (!m) { location.replace("#note"); return; }
      cur = { meta: m, text: text, isNew: isNew, saved: !isNew };
      host.innerHTML =
        '<div class="nt-wrap nt-ed"><div class="nt-bar">' +
        '<span class="nt-st" id="ntSt"></span>' +
        '<button class="nt-ib" id="ntPin" type="button" aria-label="পিন">📌</button>' +
        '<button class="nt-ib" id="ntCopy" type="button" aria-label="কপি">📋</button>' +
        '<button class="nt-ib" id="ntShare" type="button" aria-label="শেয়ার">↗</button>' +
        '<button class="nt-ib nt-del" id="ntDel" type="button" aria-label="মুছুন">🗑</button></div>' +
        '<textarea id="ntTx" class="nt-tx" dir="auto" placeholder="এখানে লিখুন…" spellcheck="false"></textarea>' +
        '<div class="nt-foot"><span id="ntLen"></span><span id="ntWhen"></span></div><div class="nt-toast"></div></div>';
      var ta = document.getElementById("ntTx");
      ta.value = text;
      var upd = function () {
        document.getElementById("ntLen").textContent = ta.value.length.toLocaleString("bn-BD") + " অক্ষর";
        document.getElementById("ntWhen").textContent = cur.saved ? "সংরক্ষিত · " + when(cur.meta.updated) : "";
        var pb = document.getElementById("ntPin"); if (pb) pb.classList.toggle("on", !!cur.meta.pin);
      };
      upd();
      ta.oninput = function () {
        cur.text = ta.value; dirty = true;
        document.getElementById("ntSt").textContent = "লেখা হচ্ছে…";
        clearTimeout(saveT); saveT = setTimeout(flush, 500);
        document.getElementById("ntLen").textContent = ta.value.length.toLocaleString("bn-BD") + " অক্ষর";
      };
      document.getElementById("ntPin").onclick = function () {
        cur.meta.pin = cur.meta.pin ? 0 : Date.now(); dirty = true; flush().then(function () { toast(cur.meta.pin ? "পিন করা হয়েছে" : "পিন সরানো হয়েছে"); upd(); });
      };
      document.getElementById("ntCopy").onclick = function () {
        var v = ta.value;
        (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { toast("কপি হয়েছে"); }, function () { ta.select(); try { document.execCommand("copy"); toast("কপি হয়েছে"); } catch (e) {} });
      };
      document.getElementById("ntShare").onclick = function () {
        var v = ta.value; if (!v.trim()) return;
        if (navigator.share) navigator.share({ text: v }).catch(function () {}); else document.getElementById("ntCopy").onclick();
      };
      document.getElementById("ntDel").onclick = function () {
        if (!confirm("এই নোটটি মুছে ফেলবেন? আর ফেরানো যাবে না।")) return;
        clearTimeout(saveT); dirty = false;
        delNote(cur.meta.id).then(function () { cur = null; location.hash = "#note"; });
      };
      if (isNew) ta.focus();
      persist();
    }).catch(function () { host.innerHTML = '<div class="nt-empty">নোট খোলা যায়নি।</div>'; });
  }
  /* লেখা জমা (খালি নতুন নোট জমা হয় না) */
  function flush() {
    clearTimeout(saveT);
    if (!cur || !dirty) return Promise.resolve();
    var c = cur; dirty = false;
    if (!c.text.trim() && c.isNew && !c.saved) return Promise.resolve();
    c.meta.updated = Date.now();
    return putNote(c.meta, c.text).then(function () {
      c.saved = true;
      var s = document.getElementById("ntSt"); if (s && cur === c) s.textContent = "✓ সেভ হয়েছে";
      var w = document.getElementById("ntWhen"); if (w && cur === c) w.textContent = "সংরক্ষিত · " + when(c.meta.updated);
    }, function () { dirty = true; var s = document.getElementById("ntSt"); if (s) s.textContent = "⚠ সেভ হয়নি"; });
  }
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); });

  window.DRNOTE = {
    show: function (id) { if (id) openEditor(id); else showList(); },
    leave: function () { return flush(); }
  };
  /* note.js, app.js-এর পরে লোড হয়: #note সরাসরি খোলা থাকলে (অ্যাপ চালু/রিলোডে) এখানেই দেখাও */
  (function () {
    var m = /^#note(?:\/([^\/]+))?$/.exec(location.hash || "");
    if (m && !host.hidden) window.DRNOTE.show(m[1]);
  })();
})();
