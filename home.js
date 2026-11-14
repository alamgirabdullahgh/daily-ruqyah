/* হোম — ব্লগের (dailyruqyah.blogspot.com) হোম পেজের কার্ড-ডিজাইন।
   শুধু দেখানোর স্তর: প্রতিটি লিংক অ্যাপের আগে থেকে থাকা ফিচারে যায়; কোনো ডেটা এখানে পড়া বা লেখা হয় না। */
(function(){
 var G=[
  ["দৈনন্দিন রুকইয়াহ",[["শারীরিক",{list:"physical"}],["মানসিক",{list:"mentalmain"}]]],
  ["বদনজর",[["সিমটম ডায়াগনোসিস","#diag/nazar"],["রেসপন্স ডায়াগনোসিস","#resp/nazar"],["ট্রিটমেন্ট",{topic:"বদনজর"}]]],
  ["জাদু",[["সিমটম ডায়াগনোসিস","#diag/jadu"],["রেসপন্স ডায়াগনোসিস","#resp/jadu"],["ট্রিটমেন্ট","#amol/b2b"]]],
  ["জিন",[["সিমটম ডায়াগনোসিস","#diag/jin"],["রেসপন্স ডায়াগনোসিস","#resp/jin"],["ট্রিটমেন্ট","#amol/b1a"]]]
 ];
 var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
 var built=false;
 window.__drLanding=function(){
  if(built)return;
  var H=document.getElementById("drLanding");if(!H)return;
  built=true;
  var h='<div class="drq-support" aria-live="off"><div class="drq-st dsy-fit" id="drSupSt" hidden><span class="drq-st-t"></span><a class="drq-wa" href="https://wa.me/8801938327130" target="_blank" rel="noopener" aria-label="হোয়াটসঅ্যাপে যোগাযোগ: ০১৯৩৮৩২৭১৩০" title="হোয়াটসঅ্যাপ: ০১৯৩৮৩২৭১৩০"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#25D366" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"/><path fill="#fff" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z"/></svg></a></div><div class="drq-tk" id="drSupTk"><span></span></div></div><div class="drq-grid">';
  var TS=1,TE=3; /* G[TS..TE] = বদনজর · জাদু · জিন: এক কার্ডে ট্যাব; চতুর্থ ট্যাব "সব": একই তিন অপশন, তবে তিন বিষয়ের ফল একসাথে এক পাতায় */
  var AU={"রেসপন্স ডায়াগনোসিস":"resp","ট্রিটমেন্ট":"treat","শারীরিক":"phys","মানসিক":"ment"};
  var audioLi=function(a,o,cat){var k=AU[o[0]];if(!k||!cat)return '<li>'+a+'</li>';var c=esc(cat);return '<li class="drq-ai"><div class="drq-air">'+a+'<span class="drq-bt"><button type="button" class="drq-pd" data-au="'+k+'" data-c="'+c+'" aria-label="'+esc(o[0])+' — PDF"><span class="drq-bi">📄</span><span class="drq-bl"> PDF</span></button><button type="button" class="drq-au" data-au="'+k+'" data-c="'+c+'" aria-label="'+esc(o[0])+' — অডিও">🔊<span class="drq-bl"> অডিও</span></button></span></div><div class="drq-aup" data-k="pdf" hidden></div><div class="drq-aup" data-k="au" hidden></div></li>'};
  var item=function(o,cat){
   var t=o[1];
   if(typeof t==="string")return audioLi('<a href="'+t+'">'+esc(o[0])+'</a>',o,cat);
   if(t.soon)return '<li><span class="drq-soon">'+esc(o[0])+'<small>শীঘ্রই আসছে</small></span></li>';
   if(t.sub){var r='<li class="drq-grp"><button type="button" class="drq-tg" aria-expanded="false">'+esc(o[0])+'</button><ul class="drq-sub" hidden>';t.sub.forEach(function(x){r+=item(x)});return r+'</ul></li>'}
   if(t.list)return audioLi('<a href="#search" data-list="'+t.list+'">'+esc(o[0])+'</a>',o,cat);
   return audioLi('<a href="#search" data-'+(t.topic?'topic="'+esc(t.topic)+'"':t.mental?'mental="1"':'disease="1"')+'>'+esc(o[0])+'</a>',o,cat);
  };
  var ulOf=function(g,attr,cls,cat){var r='<ul class="drq-opts'+(cls?' '+cls:'')+'"'+(attr||'')+'>';g[1].forEach(function(o){r+=item(o,cat)});return r+'</ul>'};
  G.forEach(function(g,gi){
   var tab=gi>=TS&&gi<=TE;
   if(tab){
    if(gi!==TS)return;
    var names=G.slice(TS,TE+1).map(function(x){return esc(x[0])}).concat(['<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>৩টি একসাথে</span>']);
    h+='<section class="drq-card drq-tabcard"><h3 class="drq-tabs" role="tablist">'+names.map(function(n,i){return '<button type="button" role="tab" class="drq-tab'+(i?'':' on')+(i===3?' drq-tab-all':'')+'" data-t="'+i+'" aria-selected="'+(i?'false':'true')+'"'+(i===3?' aria-label="তিনটি একসাথে"':'')+'>'+n+'</button>'}).join('')+'</h3>';
    for(var k=TS;k<=TE;k++)h+=ulOf(G[k],' data-pane="'+(k-TS)+'"'+(k>TS?' hidden':''),'',G[k][0]);
    h+=ulOf(["সব",[["সিমটম ডায়াগনোসিস","#diag"],["রেসপন্স ডায়াগনোসিস","#resp"],["ট্রিটমেন্ট","#amol/all"]]],' data-pane="'+(TE-TS+1)+'" hidden','','সব')+'</section>';
    return;
   }
   h+='<section class="drq-card"><h3>'+esc(g[0])+'</h3>'+ulOf(g,'',gi===0?'drq-two':'',gi===0?'দৈনন্দিন':'')+'</section>';
  });
  H.innerHTML=h+'</div>';
  window.__drSysCard&&window.__drSysCard(H);
  var tk=document.getElementById("drSupTk");
  var startTk=function(){if(window.__drTicker)window.__drTicker(tk,function(){var a=(window.__drSunnahRules&&window.__drSunnahRules.support)||[];var st=document.getElementById("drSupSt");var s0=a.filter(function(x){return /হাদিয়া/.test(x)})[0]||a[0]||"";if(st){var tt=st.querySelector(".drq-st-t");if(tt&&tt.textContent!==s0)tt.textContent=s0;st.hidden=!s0}return a.filter(function(x){return x!==s0})});else setTimeout(startTk,300)};
  startTk();
  setTimeout(function(){window.__drHomePrebuild&&window.__drHomePrebuild()},8000); /* PDF আগে থেকে ব্যাকগ্রাউন্ডে বানানো থাকে */
  H.addEventListener("click",function(e){
   
   var au=e.target.closest&&e.target.closest(".drq-au,.drq-pd");
   if(au){e.preventDefault();var li=au.closest("li"),isP=au.classList.contains("drq-pd"),hp=li&&li.querySelector('.drq-aup[data-k="'+(isP?"pdf":"au")+'"]');var fn=isP?window.__drHomePdf:window.__drHomeAudio;fn&&fn(au.getAttribute("data-au"),au.getAttribute("data-c"),hp);return}
   var tb=e.target.closest&&e.target.closest(".drq-tab");
   if(tb){var k=tb.getAttribute("data-t");H.querySelectorAll(".drq-tab").forEach(function(x){var on=x===tb;x.classList.toggle("on",on);x.setAttribute("aria-selected",on?"true":"false")});H.querySelectorAll("[data-pane]").forEach(function(u){u.hidden=u.getAttribute("data-pane")!==k});return}
   var tg=e.target.closest&&e.target.closest(".drq-tg");
   if(tg){var u=tg.nextElementSibling,on=u.hidden;u.hidden=!on;tg.setAttribute("aria-expanded",on?"true":"false");tg.classList.toggle("on",on);return}
   var a=e.target.closest&&e.target.closest("a[data-list],a[data-topic],a[data-disease],a[data-mental]");if(!a)return;
   e.preventDefault();
   var topic=a.getAttribute("data-topic");
   location.hash="#search";
   var lk=a.getAttribute("data-list");
   setTimeout(function(){
    if(lk){window.__drOpenList&&window.__drOpenList(lk)}
    else if(topic){window.__drOpenTopic&&window.__drOpenTopic(topic)}
    else if(a.hasAttribute("data-mental")){window.__drOpenMental&&window.__drOpenMental()}
    else{window.__drOpenDisease&&window.__drOpenDisease()}
   },90);
  });
 };
 /* আর কোনো স্ক্রিপ্টের আগে #home খুললে app.js এটা পায় না; তাই লোড হওয়ার পর নিজেই আঁকি */
 var l=document.getElementById("drLanding");if(l&&!l.hidden)window.__drLanding();
})();
