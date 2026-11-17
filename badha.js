/* বাধা দূর করার রুকইয়াহ — লুকানো সেকশন। লেখা badha.enc.js-এ এনক্রিপ্ট করা; ইমেইল-পাসওয়ার্ড দিলে তবেই খোলে।
   ভার্সন লেখায় ৭ বার চাপলে লগইন আসে। ভবিষ্যতের সব নতুন অপশন data-lock দিয়ে লুকানো থাকবে (index.html দেখুন)। */
(function(){
 var D=null,KEY="drBk",U=new TextEncoder(),ready=null;
 var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
 var P=function(a){return(a||[]).map(function(x){return'<p>'+esc(x)+'</p>'}).join("")};
 var UL=function(a){return'<ul>'+a.map(function(x){return'<li>'+esc(x)+'</li>'}).join("")+'</ul>'};
 function list(){
  return'<h2 class="bd-h">🔓 বাধা দূর করার রুকইয়াহ</h2><div class="bd-l">'+Object.keys(D).map(function(k){var d=D[k];return'<a class="bd-b" href="#badha/'+k+'"><i>'+d.icon+'</i><span><b>'+esc(d.t)+'</b><small>'+esc(d.sub)+'</small></span><u>›</u></a>'}).join("")+'</div>';
 }
 function page(k){
  var d=D[k];if(!d)return list();
  var h='<a class="bd-back" href="#badha">← বাধা দূর করার রুকইয়াহ</a><h2 class="bd-h"><i>'+d.icon+'</i> '+esc(d.t)+'</h2>';
  h+='<section class="bd-c"><h3>আলামত</h3>'+d.sym.map(function(s){return'<h4>'+esc(s.h)+'</h4>'+UL(s.l)}).join("")+'</section>';
  h+='<section class="bd-c bd-when"><b>'+esc(d.when)+'</b></section>';
  d.steps.forEach(function(s){
   h+='<section class="bd-c"><h3><span class="bd-n">'+s.n+'</span>'+(s.h?esc(s.h):'')+'</h3>'+P(s.p);
   if(s.ar)h+='<div class="bd-ar" dir="rtl" lang="ar">'+esc(s.ar)+'</div>';
   if(s.tr)h+=s.tr.split("\n").map(function(x){return'<p class="bd-tr">'+esc(x)+'</p>'}).join("");
   if(s.m)h+=P(s.m).replace(/<p>/g,'<p class="bd-m">');
   h+='</section>';
  });
  h+='<section class="bd-c bd-sign"><h3>'+esc(d.sign.h)+'</h3>'+UL(d.sign.l)+'</section>';
  if(d.note)h+='<div class="bd-note">ℹ️ '+esc(d.note)+'</div>';
  return h;
 }
 var b64d=function(s){var r=atob(s),a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a};
 var b64e=function(a){var s="";a=new Uint8Array(a);for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s)};
 function show(on){document.body.classList.toggle("dr-unlocked",!!on)}
 function open(rawKey){
  var E=window.__drBadhaEnc;if(!E||!window.crypto||!crypto.subtle)return Promise.reject(new Error("x"));
  return crypto.subtle.importKey("raw",rawKey,"AES-GCM",false,["decrypt"]).then(function(k){
   return crypto.subtle.decrypt({name:"AES-GCM",iv:b64d(E.n)},k,b64d(E.c))}).then(function(pt){
   D=JSON.parse(new TextDecoder().decode(pt));show(true)});
 }
 function derive(email,pass){
  var E=window.__drBadhaEnc;
  return crypto.subtle.importKey("raw",U.encode(email.trim().toLowerCase()+"\n"+pass),"PBKDF2",false,["deriveBits"]).then(function(m){
   return crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:b64d(E.s),iterations:E.i},m,256)});
 }
 function logout(){D=null;try{localStorage.removeItem(KEY)}catch(e){}show(false);if(/^#badha/.test(location.hash))location.hash="#home";var b=document.getElementById("drBadha");if(b)b.innerHTML=""}
 // ফোনে আগে লগইন করা থাকলে চাবি থেকে নিজে থেকে খোলে
 ready=new Promise(function(res){
  var k=null;try{k=localStorage.getItem(KEY)}catch(e){}
  if(!k)return res();
  open(b64d(k)).then(res,function(){try{localStorage.removeItem(KEY)}catch(e){}res()});
 });
 window.__drBadha=function(k){
  var b=document.getElementById("drBadha");if(!b)return;
  ready.then(function(){
   if(!D){b.innerHTML="";location.replace("#home");return}
   b.innerHTML=k?page(k):list();
  });
 };

 // কিবোর্ড কখনো অদৃশ্য অক্ষর/বাংলা সংখ্যা/ফুল-উইডথ চিহ্ন বসিয়ে দেয়; আগে যেমন লেখা তেমন, না মিললে পরিষ্কার করে আবার দেখা হয়
 var ZW=/[\u200b-\u200f\u2028-\u202f\u2060\ufeff]/g,BNS="০১২৩৪৫৬৭৮৯";
 function clean(s){try{s=s.normalize("NFKC")}catch(e){}return s.replace(ZW,"").replace(/[০-৯]/g,function(c){return BNS.indexOf(c)})}
 function pairs(em,pw){var a=[[em,pw],[em,pw.trim()],[clean(em),clean(pw).trim()]],o=[],seen={};a.forEach(function(p){var k=p[0].trim().toLowerCase()+"\n"+p[1];if(!seen[k]){seen[k]=1;o.push(p)}});return o}
 function attempt(list,i){
  if(i>=list.length)return Promise.reject(new Error("nomatch"));
  return derive(list[i][0],list[i][1]).then(function(raw){return open(raw).then(function(){return raw})}).catch(function(){return attempt(list,i+1)});
 }
 // লগইন ঘর
 function dialog(){
  if(document.getElementById("drLg"))return;
  var w=document.createElement("div");w.id="drLg";w.className="dr-lg";
  w.innerHTML='<form class="dr-lgb" autocomplete="off"><b>লগইন</b><input type="email" id="drLgE" placeholder="ইমেইল" autocapitalize="none" autocomplete="off"><div class="dr-lgp"><input type="password" id="drLgP" placeholder="পাসওয়ার্ড" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"><button type="button" id="drLgS" aria-label="পাসওয়ার্ড দেখান" title="পাসওয়ার্ড দেখান"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="dr-lge" id="drLgM" aria-live="polite"></div><div class="dr-lgr"><button type="button" id="drLgC">বাতিল</button><button type="submit" id="drLgO">লগইন</button></div></form>';
  document.body.appendChild(w);
  var f=w.firstChild,m=document.getElementById("drLgM"),ok=document.getElementById("drLgO");
  var close=function(){w.remove()};
  document.getElementById("drLgC").onclick=close;
  var pe=document.getElementById("drLgP"),sb=document.getElementById("drLgS"),ICON_ON='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',ICON_OFF='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.9 10.9 0 0 1 12 19c-7 0-11-7-11-7a19.8 19.8 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 7 11 7a19.9 19.9 0 0 1-3.17 4.19M14.12 14.12A3 3 0 1 1 9.88 9.88"/><path d="M1 1l22 22"/></svg>';
  sb.onclick=function(){var show=pe.type==="password";pe.type=show?"text":"password";sb.innerHTML=show?ICON_OFF:ICON_ON;var l=show?"পাসওয়ার্ড লুকান":"পাসওয়ার্ড দেখান";sb.setAttribute("aria-label",l);sb.title=l;try{pe.focus();var n=pe.value.length;pe.setSelectionRange(n,n)}catch(e){}};
  w.onclick=function(e){if(e.target===w)close()};
  f.onsubmit=function(e){
   e.preventDefault();var em=document.getElementById("drLgE").value,pw=document.getElementById("drLgP").value;
   if(!em||!pw){m.textContent="ইমেইল ও পাসওয়ার্ড দিন";return}
   ok.disabled=true;m.textContent="যাচাই হচ্ছে…";
   if(!window.__drBadhaEnc){ok.disabled=false;m.textContent="লুকানো ডেটা লোড হয়নি — অ্যাপ বন্ধ করে আবার খুলুন";return}
   if(!window.crypto||!crypto.subtle){ok.disabled=false;m.textContent="এই ব্রাউজারে লগইন চলছে না (নিরাপদ https সংযোগ দরকার)";return}
   attempt(pairs(em,pw),0).then(function(raw){try{localStorage.setItem(KEY,b64e(raw))}catch(e){}close()}).catch(function(){
    ok.disabled=false;m.textContent="ইমেইল বা পাসওয়ার্ড মিলছে না"});
  };
  setTimeout(function(){var i=document.getElementById("drLgE");if(i)i.focus()},50);
 }
 // ভার্সন লেখায় ৭ বার চাপ (৪ সেকেন্ডের মধ্যে)
 var n=0,t=0;
 document.addEventListener("click",function(e){
  var t0=e.target;
  if(t0.closest&&t0.closest("#drVer")){
   var now=Date.now();if(now-t>4000)n=0;t=now;n++;
   if(n>=7){n=0;if(!D)dialog()}
  }
  if(t0.closest&&t0.closest("#drLogout")){logout()}
 },true);
})();
