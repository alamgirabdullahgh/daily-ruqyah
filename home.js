/* হোম — ব্লগের (dailyruqyah.blogspot.com) হোম পেজের কার্ড-ডিজাইন।
   শুধু দেখানোর স্তর: প্রতিটি লিংক অ্যাপের আগে থেকে থাকা ফিচারে যায়; কোনো ডেটা এখানে পড়া বা লেখা হয় না। */
(function(){
 var G=[
  ["দৈনন্দিন রুকইয়াহ",[["শারীরিক",{list:"physical"}],["মানসিক",{list:"mentalmain"}]]],
  ["বদনজর",[["সিমটম ডায়াগনোসিস","#diag/nazar"],["রেসপন্স ডায়াগনোসিস","#resp/nazar"],["ট্রিটমেন্ট",{topic:"বদনজর"}]]],
  ["জাদু",[["সিমটম ডায়াগনোসিস","#diag/jadu"],["রেসপন্স ডায়াগনোসিস","#resp/jadu"],["ট্রিটমেন্ট","#amol/b2a"]]],
  ["জিন",[["সিমটম ডায়াগনোসিস","#diag/jin"],["রেসপন্স ডায়াগনোসিস","#resp/jin"],["ট্রিটমেন্ট","#amol/b1a"]]]
 ];
 var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
 var built=false;
 window.__drLanding=function(){
  if(built)return;
  var H=document.getElementById("drLanding");if(!H)return;
  built=true;
  var h='<div class="drq-support" aria-live="off"><div class="drq-tk" id="drSupTk"><span></span></div></div><div class="drq-grid">';
  var TS=1,TE=3; /* G[TS..TE] = বদনজর · জাদু · জিন: এক কার্ডে ট্যাব; চতুর্থ ট্যাব "সব": একই তিন অপশন, তবে তিন বিষয়ের ফল একসাথে এক পাতায় */
  var item=function(o){
   var t=o[1];
   if(typeof t==="string")return '<li><a href="'+t+'">'+esc(o[0])+'</a></li>';
   if(t.soon)return '<li><span class="drq-soon">'+esc(o[0])+'<small>শীঘ্রই আসছে</small></span></li>';
   if(t.sub){var r='<li class="drq-grp"><button type="button" class="drq-tg" aria-expanded="false">'+esc(o[0])+'</button><ul class="drq-sub" hidden>';t.sub.forEach(function(x){r+=item(x)});return r+'</ul></li>'}
   if(t.list)return '<li><a href="#search" data-list="'+t.list+'">'+esc(o[0])+'</a></li>';
   return '<li><a href="#search" data-'+(t.topic?'topic="'+esc(t.topic)+'"':t.mental?'mental="1"':'disease="1"')+'>'+esc(o[0])+'</a></li>';
  };
  var ulOf=function(g,attr,cls){var r='<ul class="drq-opts'+(cls?' '+cls:'')+'"'+(attr||'')+'>';g[1].forEach(function(o){r+=item(o)});return r+'</ul>'};
  G.forEach(function(g,gi){
   var tab=gi>=TS&&gi<=TE;
   if(tab){
    if(gi!==TS)return;
    var names=G.slice(TS,TE+1).map(function(x){return esc(x[0])}).concat(['<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>৩টি একসাথে</span>']);
    h+='<section class="drq-card drq-tabcard"><h3 class="drq-tabs" role="tablist">'+names.map(function(n,i){return '<button type="button" role="tab" class="drq-tab'+(i?'':' on')+(i===3?' drq-tab-all':'')+'" data-t="'+i+'" aria-selected="'+(i?'false':'true')+'"'+(i===3?' aria-label="তিনটি একসাথে"':'')+'>'+n+'</button>'}).join('')+'</h3>';
    for(var k=TS;k<=TE;k++)h+=ulOf(G[k],' data-pane="'+(k-TS)+'"'+(k>TS?' hidden':''));
    h+=ulOf(["সব",[["সিমটম ডায়াগনোসিস","#diag"],["রেসপন্স ডায়াগনোসিস","#resp"],["ট্রিটমেন্ট","#amol/all"]]],' data-pane="'+(TE-TS+1)+'" hidden')+'</section>';
    return;
   }
   h+='<section class="drq-card"><h3>'+esc(g[0])+'</h3>'+ulOf(g,'',gi===0?'drq-two':'')+'</section>';
  });
  H.innerHTML=h+'</div>';
  window.__drSysCard&&window.__drSysCard(H);
  var tk=document.getElementById("drSupTk");
  var startTk=function(){if(window.__drTicker)window.__drTicker(tk,function(){return (window.__drSunnahRules&&window.__drSunnahRules.support)||[]});else setTimeout(startTk,300)};
  startTk();
  H.addEventListener("click",function(e){
   
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
