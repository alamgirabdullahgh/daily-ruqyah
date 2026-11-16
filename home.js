/* হোম — ব্লগের (dailyruqyah.blogspot.com) হোম পেজের কার্ড-ডিজাইন।
   শুধু দেখানোর স্তর: প্রতিটি লিংক অ্যাপের আগে থেকে থাকা ফিচারে যায়; কোনো ডেটা এখানে পড়া বা লেখা হয় না। */
(function(){
 var G=[
  ["দৈনন্দিন রুকইয়াহ",[["শারীরিক",{list:"physical"}],["মানসিক",{list:"mentalmain"}]]],
  ["বদনজর",[["সিমটম ডায়াগনোসিস","#diag/nazar"],["রেসপন্স ডায়াগনোসিস","#resp/nazar"],["ট্রিটমেন্ট","#treat/nazar"]]],
  ["জাদু",[["সিমটম ডায়াগনোসিস","#diag/jadu"],["রেসপন্স ডায়াগনোসিস","#resp/jadu"],["ট্রিটমেন্ট","#treat/jadu"]]],
  ["জিন",[["সিমটম ডায়াগনোসিস","#diag/jin"],["রেসপন্স ডায়াগনোসিস","#resp/jin"],["ট্রিটমেন্ট","#treat/jin"]]]
 ];
 var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
 var built=false;
 window.__drLanding=function(){
  if(built)return;
  var H=document.getElementById("drLanding");if(!H)return;
  built=true;
  var h='<div class="drq-support drq-hero" aria-live="off"><svg class="drq-hero-bg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs><linearGradient id="dhSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b3f78"/><stop offset=".5" stop-color="#2f7fa6"/><stop offset=".85" stop-color="#4fb3a8"/><stop offset="1" stop-color="#f3cd8e"/></linearGradient><radialGradient id="dhMoon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".6"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient><radialGradient id="dhHz" cx=".5" cy="1" r=".75"><stop offset="0" stop-color="#ffd48a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd48a" stop-opacity="0"/></radialGradient><linearGradient id="dhBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a7282"/><stop offset="1" stop-color="#134552"/></linearGradient><linearGradient id="dhWat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d6173"/><stop offset="1" stop-color="#0e3a47"/></linearGradient><pattern id="dhPat" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M11 1l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="none" stroke="#f2d28a" stroke-width=".5"/></pattern><linearGradient id="dhFade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient><mask id="dhPm"><rect width="400" height="110" fill="url(#dhFade)"/></mask><g id="dhM"><path d="M171 78C171 60 187 50 200 40C213 50 229 60 229 78z"/><rect x="175" y="78" width="50" height="22"/><path d="M143 90C143 78 153 73 161 66C169 73 179 78 179 90z"/><path d="M221 90C221 78 231 73 239 66C247 73 257 78 257 90z"/><rect x="143" y="90" width="114" height="10"/><path d="M104 96C104 88 110 85 116 80C122 85 128 88 128 96z"/><path d="M272 96C272 88 278 85 284 80C290 85 296 88 296 96z"/><rect x="100" y="94" width="200" height="6"/><rect x="199.3" y="26" width="1.4" height="14"/><circle cx="200" cy="30" r="2"/><rect x="160.4" y="55" width="1.2" height="11"/><rect x="238.4" y="55" width="1.2" height="11"/><rect x="115.4" y="73" width="1.2" height="7"/><rect x="283.4" y="73" width="1.2" height="7"/><g id="dhMin"><rect x="58" y="40" width="8" height="60"/><rect x="55" y="62" width="14" height="3"/><rect x="55.5" y="44" width="13" height="3"/><rect x="59" y="28" width="6" height="14"/><path d="M58 28Q62 20 62 8Q62 20 66 28z"/><rect x="61.4" y="5" width="1.2" height="5"/></g><use href="#dhMin" x="276"/></g></defs><rect width="400" height="110" fill="url(#dhSky)"/><rect width="400" height="110" fill="url(#dhHz)"/><rect width="400" height="110" fill="url(#dhPat)" opacity=".07" mask="url(#dhPm)"/><circle cx="374" cy="22" r="24" fill="url(#dhMoon)"/><path d="M374 10a12 12 0 1 0 8.4 20.8a9.4 9.4 0 1 1-8.4-20.8z" fill="#ffe9a8"/><g fill="#fff"><circle cx="30" cy="18" r="1"/><circle cx="84" cy="32" r=".8"/><circle cx="132" cy="12" r="1"/><circle cx="268" cy="20" r=".9"/><circle cx="310" cy="38" r=".7"/><circle cx="388" cy="52" r=".8"/><circle cx="18" cy="52" r=".7"/></g><g fill="#ffe9a8"><path d="M110 22l1.1 3.1 3.1 1.1-3.1 1.1-1.1 3.1-1.1-3.1-3.1-1.1 3.1-1.1z"/><path d="M296 12l.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9z"/><path d="M42 40l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></g><g fill="url(#dhBody)"><use href="#dhM"/></g><g fill="none" stroke="#f2d28a" stroke-width=".7" opacity=".55"><path d="M171 78C171 60 187 50 200 40C213 50 229 60 229 78"/><path d="M143 90C143 78 153 73 161 66C169 73 179 78 179 90"/><path d="M221 90C221 78 231 73 239 66C247 73 257 78 257 90"/></g><g fill="#ffe9a8"><path d="M200 38a3.2 3.2 0 1 0 2.2 5.5a2.6 2.6 0 1 1-2.2-5.5z" transform="translate(0,-14)"/><path d="M62 4a2 2 0 1 0 1.4 3.5a1.6 1.6 0 1 1-1.4-3.5z" transform="translate(0,-2)"/><path d="M338 4a2 2 0 1 0 1.4 3.5a1.6 1.6 0 1 1-1.4-3.5z" transform="translate(0,-2)"/></g><g fill="#ffd98a" opacity=".92"><path d="M195 100v-10a5 5 0 0 1 10 0v10z"/><path d="M180 100v-6a3 3 0 0 1 6 0v6z"/><path d="M214 100v-6a3 3 0 0 1 6 0v6z"/><path d="M150 100v-5a2.5 2.5 0 0 1 5 0v5z"/><path d="M165 100v-5a2.5 2.5 0 0 1 5 0v5z"/><path d="M230 100v-5a2.5 2.5 0 0 1 5 0v5z"/><path d="M245 100v-5a2.5 2.5 0 0 1 5 0v5z"/><path d="M196 69a4 4 0 0 1 8 0v6h-8z"/><rect x="60.5" y="50" width="3" height="7" rx="1.5"/><rect x="336.5" y="50" width="3" height="7" rx="1.5"/><rect x="60.5" y="72" width="3" height="9" rx="1.5"/><rect x="336.5" y="72" width="3" height="9" rx="1.5"/></g></svg><div class="drq-hero-tx"><div class="drq-st" id="drSupSt" hidden><span class="drq-st-t"></span></div></div><div class="drq-hero-act"><a class="drq-wa" href="https://wa.me/8801938327130" target="_blank" rel="noopener" aria-label="হোয়াটসঅ্যাপে যোগাযোগ: ০১৯৩৮৩২৭১৩০" title="হোয়াটসঅ্যাপ: ০১৯৩৮৩২৭১৩০"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#25D366" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/><path fill="#fff" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z"/></svg></a><a class="drq-call" href="tel:+8801938327130" aria-label="সরাসরি ফোন করুন: ০১৯৩৮৩২৭১৩০" title="ফোন: ০১৯৩৮৩২৭১৩০"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#fff" d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg></a></div></div><div class="drq-tk drq-tkbar" id="drSupTk"><span></span></div><div class="drq-grid">';
  var TS=1,TE=3; /* G[TS..TE] = বদনজর · জাদু · জিন: এক কার্ডে ট্যাব; চতুর্থ ট্যাব "সব": একই তিন অপশন, তবে তিন বিষয়ের ফল একসাথে এক পাতায় */
  var AU={"সিমটম ডায়াগনোসিস":"sym","রেসপন্স ডায়াগনোসিস":"resp","ট্রিটমেন্ট":"treat","শারীরিক":"phys","মানসিক":"ment"};
  var audioLi=function(a,o,cat){var k=AU[o[0]];if(!k||!cat)return '<li>'+a+'</li>';var c=esc(cat);return '<li class="drq-ai"><div class="drq-air">'+a+'<span class="drq-bt"><button type="button" class="drq-pd" data-au="'+k+'" data-c="'+c+'" aria-label="'+esc(o[0])+' — PDF"><span class="drq-bi">📄</span><span class="drq-bl"> PDF</span></button>'+(k==="sym"?'':'<button type="button" class="drq-au" data-au="'+k+'" data-c="'+c+'" aria-label="'+esc(o[0])+' — অডিও">🔊<span class="drq-bl"> অডিও</span></button>')+'</span></div><div class="drq-aup" data-k="pdf" hidden></div>'+(k==="sym"?'':'<div class="drq-aup" data-k="au" hidden></div>')+'</li>'};
  var LBL={"সিমটম ডায়াগনোসিস":"<span>লক্ষণ ভিত্তিক<br>রোগ নির্ণয়</span>","রেসপন্স ডায়াগনোসিস":"<span>প্রতিক্রিয়া ভিত্তিক<br>রোগ নির্ণয়</span>","ট্রিটমেন্ট":"<span>চিকিৎসা</span>"};
  var lab=function(n){return LBL[n]||esc(n)};
  var item=function(o,cat){
   var t=o[1];
   if(typeof t==="string")return audioLi('<a href="'+t+'">'+lab(o[0])+'</a>',o,cat);
   if(t.soon)return '<li><span class="drq-soon">'+esc(o[0])+'<small>শীঘ্রই আসছে</small></span></li>';
   if(t.sub){var r='<li class="drq-grp"><button type="button" class="drq-tg" aria-expanded="false">'+esc(o[0])+'</button><ul class="drq-sub" hidden>';t.sub.forEach(function(x){r+=item(x)});return r+'</ul></li>'}
   if(t.list)return audioLi('<a href="#search" data-list="'+t.list+'">'+lab(o[0])+'</a>',o,cat);
   return audioLi('<a href="#search" data-'+(t.topic?'topic="'+esc(t.topic)+'"':t.mental?'mental="1"':'disease="1"')+'>'+lab(o[0])+'</a>',o,cat);
  };
  var ulOf=function(g,attr,cls,cat){var r='<ul class="drq-opts'+(cls?' '+cls:'')+'"'+(attr||'')+'>';g[1].forEach(function(o){r+=item(o,cat)});return r+'</ul>'};
  /* দৈনন্দিন রুকইয়াহ: বদনজর·জাদু·জিন কার্ডের মতোই ট্যাব (শারীরিক | মানসিক); ট্যাবে শুধু ভেতরের তথ্য বদলায়, বাটনের নাম একই (অঙ্গভিত্তিক · রোগভিত্তিক), প্রতিটির নিজের PDF ও অডিও; নিচে সব একসাথের PDF/অডিও। অঙ্গভিত্তিক/রোগভিত্তিকের অডিও এই কার্ডেই বাজে, কোন অঙ্গ/রোগের আয়াত চলছে জ্বলে। */
  var DL=[["শারীরিক",[["অঙ্গভিত্তিক","physical@organ","শারীরিক অঙ্গভিত্তিক"],["রোগভিত্তিক","physical@disease","শারীরিক রোগভিত্তিক"]],["physical","phys"]],["মানসিক",[["অঙ্গভিত্তিক","mentalmain@organ","মানসিক অঙ্গভিত্তিক"],["রোগভিত্তিক","mentalmain@disease","মানসিক রোগভিত্তিক"]],["mentalmain","ment"]]];
  var dli=function(label,list,kind,cat,live,cls){var c=esc(cat),l=esc(label),al=esc(cat==="দৈনন্দিন"?label:cat);return '<li class="drq-ai'+(cls?' '+cls:'')+'"><div class="drq-air"><a href="#search" data-list="'+list+'">'+l+'</a><span class="drq-bt"><button type="button" class="drq-pd" data-au="'+kind+'" data-c="'+c+'" aria-label="'+al+' — PDF"><span class="drq-bi">📄</span><span class="drq-bl"> PDF</span></button><button type="button" class="drq-au'+(live?' drq-lv':'')+'" data-au="'+kind+'" data-c="'+c+'" aria-label="'+al+' — অডিও">🔊<span class="drq-bl"> অডিও</span></button></span></div><div class="drq-aup" data-k="pdf" hidden></div>'+(live?'':'<div class="drq-aup" data-k="au" hidden></div>')+'</li>'};
  var dailyCard=function(title){var r='<section class="drq-card drq-tabcard drq-daily"><h3 class="drq-tabs drq-dtabs" role="tablist">'+DL.map(function(d,i){return '<button type="button" role="tab" class="drq-tab'+(i?'':' on')+'" data-t="'+i+'" aria-selected="'+(i?'false':'true')+'">'+esc(d[0])+'</button>'}).join('')+'<button type="button" role="tab" class="drq-tab drq-tab-all" data-t="2" aria-selected="false" aria-label="দুইটি একসাথে"><span>২টি একসাথে</span></button></h3>';
   DL.forEach(function(d,i){r+='<ul class="drq-opts drq-two" data-pane="'+i+'"'+(i?' hidden':'')+'>'+dli(d[1][0][0],d[1][0][1],'x',d[1][0][2],true)+dli(d[1][1][0],d[1][1][1],'x',d[1][1][2],true)+'</ul>'});
   r+='<ul class="drq-opts drq-two" data-pane="2" hidden>'+dli('অঙ্গভিত্তিক','both@organ','x','শারীরিক ও মানসিক অঙ্গভিত্তিক',true)+dli('রোগভিত্তিক','both@disease','x','শারীরিক ও মানসিক রোগভিত্তিক',true)+'</ul>';return r+'<div class="drq-live" hidden></div></section>'};
  /* ===== লাইভ অডিও: অঙ্গভিত্তিক/রোগভিত্তিক বাটনে চাপলে এই কার্ডেই বাজে; নিচে নামের তালিকা, যে অঙ্গ/রোগের আয়াত চলছে সেটি জ্বলে ===== */
  var AUH='🔊<span class="drq-bl"> অডিও</span>',LV=null;
  var bn=function(n){return String(n).replace(/\d/g,function(d){return "০১২৩৪৫৬৭৮৯"[d]})};
  var shortN=function(n){n=String(n).normalize("NFC");var S={"কণ্ঠনালী ও কণ্ঠার হাড়":"কণ্ঠনালী","বুক ও বক্ষ":"বুক","অন্ত্র ও নাড়িভুঁড়ি":"অন্ত্র"};return S[n]||(n.replace(/\s*\([^)]*\)/g,"").trim()||n)};
  var mk=function(c,x){var e=document.createElement("div");if(c)e.className=c;if(x!=null)e.textContent=x;return e};
  var stopLive=function(){if(!LV)return;var s=LV;LV=null;s.stop=true;try{if(s.a){s.a.pause();s.a.ontimeupdate=s.a.onended=s.a.onplay=null}}catch(e){}
   if(s.host){s.host.hidden=true;s.host.textContent=""}if(s.btn){s.btn.classList.remove("on");s.btn.innerHTML=AUH}};
  window.addEventListener("hashchange",function(){var h=location.hash;if(h&&h!=="#"&&h!=="#home"&&h!=="#/home")stopLive()});
  var playLive=async function(btn){
   var cat=btn.getAttribute("data-c"),same=LV&&LV.btn===btn;stopLive();if(same)return;
   var card=btn.closest(".drq-daily"),host=card&&card.querySelector(".drq-live");if(!host||!window.__drGroupAudio||!window.__drGroupItems)return;
   var st={btn:btn,a:null,stop:false,host:host};LV=st;btn.classList.add("on");btn.innerHTML='⏹<span class="drq-bl"> থামান</span>';
   host.hidden=false;host.textContent="";var tx=mk("drq-lt","▶ "+cat),nt=mk("drq-ln","⏳ তালিকা তৈরি হচ্ছে…"),hb=mk("drq-lp"),bar=mk("drq-lbar");bar.append(tx,nt,hb);host.appendChild(bar);
   var fail=function(e){console.error(e);if(LV===st){nt.textContent="অডিও তৈরি করা যায়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন";btn.classList.remove("on");btn.innerHTML=AUH;LV=null}};
   var items,list=[],segs=[],seen={},out=mk();
   try{items=await window.__drGroupItems(cat)}catch(e){return fail(e)}
   if(st.stop||LV!==st)return;
   /* আইটেমের ক্রমে আয়াত; আগের আইটেমে এসে গেলে আবার নয় */
   items.forEach(function(it,k){var f=list.length;it.keys.forEach(function(x){var id=x[0]+":"+x[1];if(!seen[id]){seen[id]=1;list.push(x)}});if(list.length>f)segs.push({k:k,from:f,to:list.length})});
   if(!list.length)return fail(new Error("empty"));
   var grid=mk("drq-lg "+(cat.indexOf("অঙ্গ")>-1?"drq-lg8":"drq-lg4"));var lb=items.map(function(it){var b=mk("drq-lb",shortN(it.name));b.title=it.name;grid.appendChild(b);return b});host.appendChild(grid);/* সব বাটন একই মাপের; লম্বা নাম দুই লাইনে ভাঙে, বাটন বড় হয় না — না আঁটলে শুধু লেখা একটু ছোট হয় */var fitLb=function(){lb.forEach(function(b){b.style.fontSize="";if(!b.clientWidth)return;var f=parseFloat(getComputedStyle(b).fontSize)||10;while((b.scrollHeight>b.clientHeight+.5||b.scrollWidth>b.clientWidth+.5)&&f>7){f-=.5;b.style.fontSize=f+"px"}})};fitLb();requestAnimationFrame(fitLb);setTimeout(fitLb,300);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitLb);
   nt.textContent="⏳ অডিও প্রস্তুত হচ্ছে…";
   var marks=null;
   try{await window.__drGroupAudio(list,out,function(t){if(LV===st)nt.textContent="⏳ "+t},cat+" +লাইভ",function(m){marks=m});if(!out.querySelector("audio"))throw new Error("noaudio")}catch(e){return fail(e)}
   if(st.stop||LV!==st)return;
   nt.remove();hb.appendChild(out);var a=out.querySelector("audio");st.a=a;
   var segOf=function(i){for(var q=0;q<segs.length;q++)if(i>=segs[q].from&&i<segs[q].to)return segs[q];return null};
   var cur=-2;
   var upd=function(){var m=marks||[];if(!m.length&&a.duration)m=list.map(function(_,i){return{i:i,t:(i+1)/list.length*a.duration}});if(!m.length)return;
    var t=a.currentTime+.03,k=-1;for(var q=0;q<m.length;q++){if(m[q].t>t){k=q;break}}if(k<0)k=m.length-1;
    var sg=segOf(m[k].i);if(!sg||sg.k===cur)return;cur=sg.k;
    grid.querySelectorAll(".drq-lb.now").forEach(function(x){x.classList.remove("now")});var b=lb[sg.k];b.classList.add("now");
    tx.textContent="▶ "+cat+" › "+items[sg.k].name+"  ("+bn(sg.k+1)+"/"+bn(items.length)+")";
    var r=b.getBoundingClientRect();if(r.top<60||r.bottom>innerHeight-60)b.scrollIntoView({behavior:"smooth",block:"center"})};
   a.ontimeupdate=upd;a.onplay=upd;a.onended=function(){if(LV===st)stopLive()};
   try{a.currentTime=0;await a.play()}catch(e){}
   upd()};
  G.forEach(function(g,gi){
   var tab=gi>=TS&&gi<=TE;
   if(tab){
    if(gi!==TS)return;
    /* এক কার্ডে ট্যাব: বদনজর · জাদু · জিন · ৩টি একসাথে। প্রতিটি ট্যাবে আগের তিন অপশনই থাকে, তার নিচে সেই বিষয়ের সাতটি অক্ষের চার্ট (৩টি একসাথে = তিনটি চার্টই) */
    var names=G.slice(TS,TE+1).map(function(x){return esc(x[0])}).concat(['<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>৩টি একসাথে</span>']);
    h+='<section class="drq-card drq-tabcard"><h3 class="drq-tabs" role="tablist">'+names.map(function(n,i){return '<button type="button" role="tab" class="drq-tab'+(i?'':' on')+(i===3?' drq-tab-all':'')+'" data-t="'+i+'" aria-selected="'+(i?'false':'true')+'"'+(i===3?' aria-label="তিনটি একসাথে"':'')+'>'+n+'</button>'}).join('')+'</h3>';
    for(var k=TS;k<=TE;k++)h+=ulOf(G[k],' data-pane="'+(k-TS)+'"'+(k>TS?' hidden':''),'drq-two drq-three',G[k][0]);
    h+=ulOf(["সব",[["সিমটম ডায়াগনোসিস","#diag"],["রেসপন্স ডায়াগনোসিস","#resp"],["ট্রিটমেন্ট","#treat"]]],' data-pane="'+(TE-TS+1)+'" hidden','drq-two drq-three','সব')+'</section>';
    return;
   }
   if(gi===0){h+=dailyCard(g[0]);return}
   h+='<section class="drq-card"><h3>'+esc(g[0])+'</h3>'+ulOf(g,'',gi===0?'drq-two':'',gi===0?'দৈনন্দিন':'')+'</section>';
  });
  H.innerHTML=h+'</div>';
  var fitT=function(){H.querySelectorAll('.drq-two').forEach(function(ul){var as=[].slice.call(ul.querySelectorAll('.drq-air>a'));if(!as.length||!as[0].clientWidth)return;var m=99;as.forEach(function(el){el.style.fontSize='';var f=parseFloat(getComputedStyle(el).fontSize);while(el.scrollWidth>el.clientWidth&&f>8){f-=.5;el.style.fontSize=f+'px'}m=Math.min(m,f)});as.forEach(function(el){el.style.fontSize=m+'px'})})};
  var fitA=function(){H.querySelectorAll('.drq-tab-all').forEach(function(t){if(!t.clientWidth)return;t.style.fontSize='';var f=parseFloat(getComputedStyle(t).fontSize);while(t.scrollWidth>t.clientWidth&&f>10){f-=.5;t.style.fontSize=f+'px'}})};var fitT0=fitT;fitT=function(){fitT0();fitA()};
  window.addEventListener('resize',function(){fitT()});
  window.__drSysCard&&window.__drSysCard(H);
  var tk=document.getElementById("drSupTk");
  var startTk=function(){if(window.__drTicker)window.__drTicker(tk,function(){var a=(window.__drSunnahRules&&window.__drSunnahRules.support)||[];var st=document.getElementById("drSupSt");var s0=a.filter(function(x){return /হাদিয়া/.test(x)})[0]||a[0]||"";if(st){var tt=st.querySelector(".drq-st-t");if(tt&&tt.getAttribute("data-s")!==s0){tt.setAttribute("data-s",s0);var m=s0.match(/^([^,،]+[,،])\s*(.+)$/);tt.innerHTML=m?"<span>"+esc(m[1])+"</span><span>"+esc(m[2])+"</span>":"<span>"+esc(s0)+"</span>"}st.hidden=!s0}return a.filter(function(x){return x!==s0})});else setTimeout(startTk,300)};
  startTk();
  window.__drLandingFit=function(){fitT()};
  fitT();setTimeout(fitT,400);
  setTimeout(function(){window.__drHomePrebuild&&window.__drHomePrebuild()},1500); /* PDF আগে থেকে ব্যাকগ্রাউন্ডে বানানো থাকে */
  H.addEventListener("click",function(e){
   
   var au=e.target.closest&&e.target.closest(".drq-au,.drq-pd");
   if(au&&au.classList.contains("drq-lv")){e.preventDefault();playLive(au);return}
   if(au){e.preventDefault();var li=au.closest("li"),isP=au.classList.contains("drq-pd"),hp=li&&li.querySelector('.drq-aup[data-k="'+(isP?"pdf":"au")+'"]');var fn=isP?window.__drHomePdf:window.__drHomeAudio;fn&&fn(au.getAttribute("data-au"),au.getAttribute("data-c"),hp);return}
   var tb=e.target.closest&&e.target.closest(".drq-tab");
   if(tb){var k=tb.getAttribute("data-t"),cd=tb.closest(".drq-tabcard")||H;if(cd.classList.contains("drq-daily"))stopLive();cd.querySelectorAll(".drq-tab").forEach(function(x){var on=x===tb;x.classList.toggle("on",on);x.setAttribute("aria-selected",on?"true":"false")});cd.querySelectorAll("[data-pane]").forEach(function(u){u.hidden=u.getAttribute("data-pane")!==k});fitT();return}
   var tg=e.target.closest&&e.target.closest(".drq-tg");
   if(tg){var u=tg.nextElementSibling,on=u.hidden;u.hidden=!on;tg.setAttribute("aria-expanded",on?"true":"false");tg.classList.toggle("on",on);return}
   var a=e.target.closest&&e.target.closest("a[data-list],a[data-topic],a[data-disease],a[data-mental]");if(!a)return;
   e.preventDefault();
   var topic=a.getAttribute("data-topic");
   window.__drHold=true;{var ro=document.getElementById("rsOut"),ri=document.getElementById("rsInfo");if(ro)ro.innerHTML="";if(ri)ri.textContent=""}
   location.hash="#search";
   var lk=a.getAttribute("data-list");
   setTimeout(function(){
    if(lk){window.__drOpenList&&window.__drOpenList(lk)}
    else if(topic){window.__drOpenTopic&&window.__drOpenTopic(topic)}
    else if(a.hasAttribute("data-mental")){window.__drOpenMental&&window.__drOpenMental()}
    else{window.__drOpenDisease&&window.__drOpenDisease()}
   window.__drHold=false;
   },90);
  });
 };
 /* আর কোনো স্ক্রিপ্টের আগে #home খুললে app.js এটা পায় না; তাই লোড হওয়ার পর নিজেই আঁকি */
 var l=document.getElementById("drLanding");if(l&&!l.hidden)window.__drLanding();
})();
