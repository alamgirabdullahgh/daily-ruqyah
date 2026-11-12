/* হোম — ব্লগের (dailyruqyah.blogspot.com) হোম পেজের কার্ড-ডিজাইন।
   শুধু দেখানোর স্তর: প্রতিটি লিংক অ্যাপের আগে থেকে থাকা ফিচারে যায়; কোনো ডেটা এখানে পড়া বা লেখা হয় না। */
(function(){
 var G=[
  ["বদনজর",[["সিমটম ডায়াগনোসিস","#diag"],["রেসপন্স ডায়াগনোসিস","#resp"],["ট্রিটমেন্ট",{topic:"বদনজর"}]]],
  ["জিন",[["সিমটম ডায়াগনোসিস","#diag"],["রেসপন্স ডায়াগনোসিস","#resp"],["ট্রিটমেন্ট","#amol/b1a"]]],
  ["জাদু",[["সিমটম ডায়াগনোসিস","#diag"],["রেসপন্স ডায়াগনোসিস","#resp"],["ট্রিটমেন্ট","#amol/b2a"]]],
  ["দৈনন্দিন রুকইয়াহ",[["শারীরিক সমস্যা",{disease:1}],["মানসিক সমস্যা",{soon:1}]]]
 ];
 var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
 var built=false;
 window.__drLanding=function(){
  if(built)return;
  var H=document.getElementById("drLanding");if(!H)return;
  built=true;
  var h='<div class="drq-grid">';
  G.forEach(function(g){
   h+='<section class="drq-card"><h3>'+esc(g[0])+'</h3><ul class="drq-opts">';
   g[1].forEach(function(o){
    var t=o[1];
    if(typeof t==="string")h+='<li><a href="'+t+'">'+esc(o[0])+'</a></li>';
    else if(t.soon)h+='<li><span class="drq-soon">'+esc(o[0])+'<small>শীঘ্রই আসছে</small></span></li>';
    else h+='<li><a href="#search" data-'+(t.topic?'topic="'+esc(t.topic)+'"':'disease="1"')+'>'+esc(o[0])+'</a></li>';
   });
   h+='</ul></section>';
  });
  H.innerHTML=h+'</div>';
  H.addEventListener("click",function(e){
   var a=e.target.closest&&e.target.closest("a[data-topic],a[data-disease]");if(!a)return;
   e.preventDefault();
   var topic=a.getAttribute("data-topic");
   location.hash="#search";
   setTimeout(function(){
    if(topic){window.__drOpenTopic&&window.__drOpenTopic(topic)}
    else{window.__drOpenDisease&&window.__drOpenDisease()}
   },90);
  });
 };
 /* আর কোনো স্ক্রিপ্টের আগে #home খুললে app.js এটা পায় না; তাই লোড হওয়ার পর নিজেই আঁকি */
 var l=document.getElementById("drLanding");if(l&&!l.hidden)window.__drLanding();
})();
