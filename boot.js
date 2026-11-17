// সার্ভিস ওয়ার্কার (অফলাইনে অ্যাপ খোলা) + "হোম স্ক্রিনে যোগ করুন" বোতাম
(function(){
 if("serviceWorker" in navigator){
  var hadSW=!!navigator.serviceWorker.controller,rl=false;
  /* নতুন সংস্করণ এলে (সার্ভিস ওয়ার্কার বদলালে) পাতা একবার নিজে রিলোড হয়, ফলে ওয়েবসাইট ও অ্যাপ সবসময় সর্বশেষ */
  navigator.serviceWorker.addEventListener("controllerchange",function(){if(!hadSW||rl||window.__drRl)return;rl=true;location.reload()});
  window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(function(g){
   document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")g.update().catch(function(){})});
   setInterval(function(){g.update().catch(function(){})},600000)}).catch(function(){})});
 }
 /* ওয়েবসাইট (ব্লগের iframe) ও অ্যাপ নিজে নিজেই সর্বশেষ সংস্করণে আসে — সার্ভিস ওয়ার্কার/ব্রাউজার ক্যাশ যা-ই থাকুক: খোলার সময়, ট্যাবে ফিরলে ও প্রতি ৬০ সেকেন্ডে index.html নেট থেকে (ক্যাশ ছাড়া) এনে ফাইল-সংস্করণ (?v=) মেলায়; না মিললে পুরনো ক্যাশ মুছে পাতা রিলোড করে। অডিও বাজার সময় অপেক্ষা করে, শেষ হলে রিলোড */
 (function(){
  var tok=function(d){return Array.prototype.map.call(d.querySelectorAll("script[src],link[rel=stylesheet][href]"),function(e){return e.getAttribute("src")||e.getAttribute("href")}).filter(function(u){return /[?&]v=\d/.test(u)}).join("|")};
  var cur=tok(document),busy=false,miss=0,lastT=Date.now();["touchstart","touchmove","pointerdown","keydown","wheel"].forEach(function(ev){addEventListener(ev,function(){lastT=Date.now()},{passive:true,capture:true})});
  if(!cur||!window.fetch)return;
  var playing=function(){return Array.prototype.some.call(document.querySelectorAll("audio,video"),function(a){return !a.paused&&!a.ended})||!!window.__drPlaying};
  var recent=function(){var m=/[?&]_r=(\d+)/.exec(location.search);return m&&Date.now()-Number(m[1])<30000};
  var go=function(){
   window.__drRl=true;var done=function(){location.replace(location.pathname+"?_r="+Date.now()+location.hash)};
   var p=[];
   try{if(window.caches)p.push(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf("dr-shell-")===0}).map(function(k){return caches.delete(k)}))}))}catch(e){}
   try{if(navigator.serviceWorker)p.push(navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.update().catch(function(){})}))}))}catch(e){}
   Promise.all(p).catch(function(){}).then(done)};
  var check=function(){
   if(busy||recent()||navigator.onLine===false||document.visibilityState==="hidden")return;
   busy=true;
   fetch("index.html?_c="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.text():""}).then(function(t){
    if(!t)return;var n=tok(new DOMParser().parseFromString(t,"text/html"));
    if(n&&n!==cur){miss++;if(playing()||Date.now()-lastT<20000||miss<2){setTimeout(function(){busy=false;check()},miss<2?8000:15000);busy=true;return}go()}else miss=0
   }).catch(function(){}).then(function(){if(busy&&!playing())busy=false})};
  setTimeout(check,1500);setInterval(check,60000);
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")check()});
  addEventListener("online",check);
 })();

 /* কীবোর্ড খুললে নিচের বার ও ভাসমান বোতাম লুকায় (না হলে ওগুলো কীবোর্ডের ওপরে উঠে আসে); কীবোর্ড বন্ধ হলেই (ব্যাক চাপলে ঘরে ফোকাস থেকে গেলেও) আবার ফিরে আসে।
    অবস্থা প্রতিবার মাপ থেকে হিসাব হয়, আটকে থাকে না: "কীবোর্ড খোলা" = কোনো লেখার ঘরে ফোকাস আছে এবং পর্দার উচ্চতা স্বাভাবিকের (ref) চেয়ে ১৪০px-এর বেশি কম।
    ref = কোনো ঘরে ফোকাস না থাকা অবস্থায় সর্বশেষ মাপা উচ্চতা, তাই স্ট্যাটাস বার/ঘোরানো/অন্য কারণে মাপ বদলালেও ঠিক থাকে */
 var de=document.documentElement,ref=0,txt=function(e){var t=e&&e.tagName;return t==="TEXTAREA"||(t==="INPUT"&&!/^(checkbox|radio|button|submit|range|file|color)$/.test(e.type))};
 var vh=function(){return window.visualViewport?visualViewport.height:innerHeight};
 function chk(){var h=vh(),a=document.activeElement,f=txt(a)&&a.isConnected&&a.getClientRects().length>0;
  if(!ref)ref=Math.max(h,innerHeight);
  if(!f){ref=h;de.classList.remove("kb");return}
  if(h>ref)ref=h;
  if(h<ref-140)de.classList.add("kb");else de.classList.remove("kb")}
 ["resize","orientationchange","hashchange","pageshow","focusin","focusout","visibilitychange"].forEach(function(n){addEventListener(n,function(){if(n==="orientationchange")ref=0;setTimeout(chk,n==="focusout"||n==="orientationchange"?200:0);setTimeout(chk,600)})});
 if(window.visualViewport)visualViewport.addEventListener("resize",chk);
 setInterval(chk,400);
 chk();
 var box=document.getElementById("drInst"),ev=null;
 var standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
 if(!box||standalone)return;
 addEventListener("beforeinstallprompt",function(e){e.preventDefault();ev=e;box.style.display="block";box.textContent="ফোনে অ্যাপ হিসেবে রাখুন ";var b=document.createElement("button");b.type="button";b.textContent="ইনস্টল";b.onclick=function(){ev.prompt();ev.userChoice.finally(function(){box.style.display="none";ev=null})};box.appendChild(b)});
 if(/iphone|ipad|ipod/i.test(navigator.userAgent)){box.style.display="block";box.textContent="আইফোনে: Safari-র শেয়ার বোতাম → “Add to Home Screen”"}
})();
