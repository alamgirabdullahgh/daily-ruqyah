/* আমল ও চিকিৎসা-নির্দেশিকা — data/amol-guide.json থেকে পাতা আঁকে। আয়াত দেখায় অ্যাপের নিজস্ব কুরআন-ডেটা (__drChunk) থেকে। */
(function(){
 var SN={1:"ফাতিহা",2:"বাকারা",3:"আলে ইমরান",6:"আন'আম",7:"আ'রাফ",8:"আনফাল",10:"ইউনুস",11:"হূদ",12:"ইউসুফ",13:"রা'দ",15:"হিজর",16:"নাহল",18:"কাহফ",20:"ত্ব-হা",21:"আম্বিয়া",24:"নূর",25:"ফুরকান",27:"নামল",28:"কাসাস",29:"আনকাবুত",30:"রূম",31:"লুকমান",33:"আহযাব",35:"ফাতির",36:"ইয়াসীন",37:"সাফফাত",39:"যুমার",41:"ফুসসিলাত",43:"যুখরুফ",44:"দুখান",50:"ক্বাফ",54:"কামার",59:"হাশর",67:"মুলক",68:"কালাম",71:"নূহ",72:"জিন",85:"বুরূজ",94:"ইনশিরাহ",95:"তীন",99:"যিলযাল",105:"ফীল",112:"ইখলাস",113:"ফালাক",114:"নাস"};
 var BD="০১২৩৪৫৬৭৮৯",DATA=null,CAT="daily",Q="",box=null,loading=null;
 var bn=function(n){return String(n).replace(/\d/g,function(d){return BD[d]})};
 var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
 var GC={"সহীহ হাদিস":"h","কুরআন":"q"};
 function load(){
  if(DATA)return Promise.resolve(DATA);
  if(loading)return loading;
  loading=fetch(new URL("data/amol-guide.json?v=3",location.href).href).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){DATA=d;return d}).catch(function(e){loading=null;throw e});
  return loading;
 }
 function refLabel(r){var n=SN[r[0]]||("সূরা "+bn(r[0]));return "সূরা "+n+" "+bn(r[0])+":"+bn(r[1])+(r[2]?"-"+bn(r[2]):"")}
 function card(it){
  var h='<article class="am-it" data-t="'+esc(it.t.toLowerCase())+'">';
  h+='<h3>'+esc(it.t)+'</h3><div class="am-tags"><span class="am-g am-g-'+(GC[it.g]||"s")+'">'+esc(it.g)+'</span>';
  if(it.src)h+='<span class="am-src">'+esc(it.src)+'</span>';
  h+='</div>';
  if(it.pages)h+=it.pages.map(function(p,i){return'<div class="am-tx">'+esc(p)+'</div>'}).join("");
  if(it.why)h+='<p class="am-why">'+esc(it.why)+'</p>';
  if(it.ar)h+='<div class="am-ar" dir="rtl" lang="ar">'+esc(it.ar)+'</div>';
  if(it.how&&it.how.length)h+='<ol class="am-how">'+it.how.map(function(x){return'<li>'+esc(x)+'</li>'}).join("")+'</ol>';
  if(it.note)h+='<div class="am-note">ℹ️ '+esc(it.note)+'</div>';
  if(it.refs&&it.refs.length){
   h+='<div class="am-refs">'+it.refs.map(function(r,i){return'<details class="am-ref" data-r="'+r.join(",")+'"><summary>'+esc(refLabel(r))+'</summary><div class="am-v">লোড হচ্ছে…</div></details>'}).join("")+'</div>';
  }
  if(it.bk)h+='<div class="am-bk">📚 বই: '+esc(it.bk)+'</div>';
  return h+'</article>';
 }
 function fillRef(d){
  var v=d.querySelector(".am-v");if(!v||d.__done)return;d.__done=1;
  var r=d.dataset.r.split(",").map(Number),s=r[0],a=r[1],b=r[2]||a;
  var C=window.__drChunk;
  if(!C){v.textContent="আয়াতের ডেটা এখন পাওয়া যাচ্ছে না।";d.__done=0;return}
  Promise.all([C("a",s),C("b",s)]).then(function(x){
   var h="";for(var i=a;i<=b;i++){var ar=x[0][i-1],t=x[1][i-1];if(ar==null)continue;
    h+='<div class="am-ay"><div class="am-ay-ar" dir="rtl" lang="ar">'+esc(ar)+' <span class="am-n">﴿'+bn(i)+'﴾</span></div>'+(t?'<div class="am-ay-bn">'+esc(t)+'</div>':'')+'</div>'}
   v.innerHTML=h||"আয়াত পাওয়া যায়নি।";
  }).catch(function(){v.textContent="আয়াত লোড করা যায়নি। ইন্টারনেট চালু করে আবার চেষ্টা করুন।";d.__done=0});
 }
 function draw(){
  if(!box||!DATA)return;
  var tabs='<div class="am-tabs" role="tablist">'+DATA.cats.map(function(c){return'<button type="button" class="am-tab'+(CAT===c.id?" on":"")+'" data-c="'+c.id+'"><i>'+c.icon+'</i>'+esc(c.title)+'</button>'}).join("")+'</div>';
  var body="";
  {var c=DATA.cats.filter(function(x){return x.id===CAT})[0]||DATA.cats[0];body=c.items.map(card).join("")}
  box.innerHTML='<h2 class="am-h">আমল ও চিকিৎসা-নির্দেশিকা</h2><p class="am-intro">'+esc(DATA.intro)+'</p><div class="am-warn">⚕ রুকইয়াহ ও আমল মেডিক্যাল চিকিৎসার বিকল্প নয়। বইয়ে বর্ণিত লক্ষণ বহু রোগেরও হয়; গুরুতর বা হঠাৎ উপসর্গে আগে ডাক্তার দেখান।</div><input class="am-q" id="amQ" type="search" placeholder="খুঁজুন (যেমন: হাঁড়ি, পুতুল, বন্দিশ, বিয়ে)" autocomplete="off" value="'+esc(Q)+'">'+tabs+'<div id="amBody">'+body+'</div>';
  filter();
 }
 function filter(){
  var q=Q.trim().toLowerCase(),b=document.getElementById("amBody");if(!b)return;
  var n=0;b.querySelectorAll(".am-it").forEach(function(a){var ok=!q||(a.__t||(a.__t=a.textContent.toLowerCase())).indexOf(q)>=0;a.style.display=ok?"":"none";if(ok)n++});
  var e=b.querySelector(".am-empty");if(!n&&q){if(!e){e=document.createElement("div");e.className="am-empty";e.textContent="এই ট্যাবে কিছু পাওয়া যায়নি। অন্য ট্যাবে দেখুন।";b.appendChild(e)}}else if(e)e.remove();
 }
 function init(){
  box=document.getElementById("drAmol");if(!box||box.__w)return;box.__w=1;
  box.addEventListener("click",function(e){var t=e.target.closest&&e.target.closest(".am-tab");if(t){CAT=t.dataset.c;draw();window.scrollTo(0,0)}});
  box.addEventListener("toggle",function(e){var d=e.target;if(d.classList&&d.classList.contains("am-ref")&&d.open)fillRef(d)},true);
  box.addEventListener("input",function(e){if(e.target.id==="amQ"){Q=e.target.value;filter()}});
 }
 window.__drAmol=function(sub){
  init();if(!box)return;
  if(sub)CAT=sub;
  if(DATA){draw();return}
  box.innerHTML='<div class="am-load">লোড হচ্ছে…</div>';
  load().then(draw).catch(function(){box.innerHTML='<div class="am-load">তথ্য লোড করা যায়নি। ইন্টারনেট চালু করে আবার খুলুন।</div>'});
 };
 /* সরাসরি #amol লিংকে/রিলোডে app.js আগে চলে যায়; তাই স্ক্রিপ্ট লোড হলে নিজেই আঁকি */
 var m=/^#amol(?:\/([a-z]+))?/.exec(location.hash||"");if(m)window.__drAmol(m[1]);
})();
