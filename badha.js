/* বাধা দূর করার রুকইয়াহ — লুকানো সেকশন। লেখা badha.enc.js-এ এনক্রিপ্ট করা; ইমেইল-পাসওয়ার্ড দিলে তবেই খোলে।
   ভার্সন লেখায় ৭ বার চাপলে লগইন আসে। ভবিষ্যতের সব নতুন অপশন data-lock দিয়ে লুকানো থাকবে (index.html দেখুন)। */
(function(){
 var D=null,KEY="drBk",U=new TextEncoder(),ready=null;
 var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
 var P=function(a){return(a||[]).map(function(x){return'<p>'+esc(x)+'</p>'}).join("")};
 var UL=function(a){return'<ul>'+a.map(function(x){return'<li>'+esc(x)+'</li>'}).join("")+'</ul>'};
 var SVG={cp:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  pd:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>',
  au:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>'};
 // প্রতিটি আইটেমের সব আয়াত একই: ফাতির ৩৫:২, ইউনুস ১০:৮১, আ‘রাফ ৭:১১৮, ফালাক ১১৩:৪, ইনশিরাহ ৯৪:৫-৬ (প্রতিটি ২১ বার)
 var KEYS=[[35,2],[10,81],[7,118],[113,4],[94,5],[94,6]],CAT=function(k){return"বাধা|"+D[k].t};
 // অডিও তিন পার্টে, চিকিৎসার ক্রম মেনে। [সূরা,আয়াত,বার,শব্দ-শুরু,শব্দ-শেষ]; ["dua","dN",বার] = dua/dN.mp3 (Gemini TTS)
 // পার্ট ১ — তেল-পানি তৈরির সময় পড়া: পানি (ফাতির ২ ×৭); তেল (আয়াতুল কুরসি ×৭, ফালাক ×৭, নাস ×৭)
 function SEQP(){var o=[],q,i;
  o.push([35,2,7],[2,255,7]);
  for(q=0;q<7;q++)for(i=1;i<=5;i++)o.push([113,i,1]);
  for(q=0;q<7;q++)for(i=1;i<=6;i++)o.push([114,i,1]);
  return o}
 // পার্ট ২ — শুধু পড়া ও দোয়া (ধাপ ৩–৭): ফাতির ২ + দোয়া ২১; ইউনুস ৮১ + আ‘রাফ ১১৮ + দোয়া ২১; ফালাক ৪ ২১; ইনশিরাহ ৫-৬ জোড়ায় ২১; বাস্তব তালা
 function SEQ(){var o=[],q;
  for(q=0;q<21;q++)o.push([35,2,1],["dua","d1",1]);
  for(q=0;q<21;q++)o.push([10,81,1,5,11],[7,118,1],["dua","d2",1]);
  o.push([113,4,21,1,5]);
  for(q=0;q<21;q++)o.push([94,5,1],[94,6,1]);
  o.push([35,2,7],[10,81,7,5,11],["dua","d3",1],["dua","d4",1],["dua","d5",3]);
  return o}
 // পার্ট ৩ — তাহাজ্জুদের দোয়া ১০০ বার
 function SEQT(){return[["dua","d6",100]]}
 var PARTS=[{n:"১",t:"তেল-পানি তৈরি",s:"পানি: ফাতির ২ ×৭ · তেল: আয়াতুল কুরসি, ফালাক, নাস ×৭",f:SEQP},
  {n:"২",t:"পড়া ও দোয়া",s:"ধাপ ৩–৭: ২১ বার ও ৭ বার, দোয়াসহ",f:SEQ},
  {n:"৩",t:"তাহাজ্জুদ",s:"রাত ৩টায়: দোয়া ১০০ বার",f:SEQT}];
 function parts(k){
  if(document.getElementById("drPt"))return;
  var c=CAT(k),w=document.createElement("div");w.id="drPt";w.className="dr-lg";
  w.innerHTML='<div class="dr-lgb"><b>অডিওর পার্ট বেছে নিন</b>'+PARTS.map(function(p,i){return'<button type="button" data-i="'+i+'" style="display:block;width:100%;text-align:left;margin:6px 0;padding:10px 12px;border-radius:10px;border:1px solid currentColor;background:transparent;color:inherit;font:inherit"><b>পার্ট '+p.n+': '+esc(p.t)+'</b><br><small>'+esc(p.s)+'</small></button>'}).join("")+'<div class="dr-lgr"><button type="button" id="drPtC">বাতিল</button></div></div>';
  document.body.appendChild(w);
  var close=function(){w.remove()};
  w.onclick=function(e){
   if(e.target===w||(e.target.id==="drPtC")){close();return}
   var bt=e.target.closest&&e.target.closest("button[data-i]");if(!bt)return;
   var p=PARTS[+bt.getAttribute("data-i")],ca=c+" · পার্ট "+p.n+" "+p.t;
   close();window.__drXKeys(ca,p.f());window.__drHomeAudio("x",ca);
  };
 }
 function short(t){return t.replace(/ দূর করার রুকইয়াহ$/,"")}
 function plain(k){
  var d=D[k],o=[d.t,"",d.sub,"","আলামত:"];
  d.sym.forEach(function(s){o.push(s.h);s.l.forEach(function(x){o.push("• "+x)})});
  o.push("",d.when);
  d.steps.forEach(function(s){o.push("","["+s.n+"] "+(s.h||""));(s.p||[]).forEach(function(x){o.push(x)});if(s.ar)o.push(s.ar);if(s.tr)o.push(s.tr);(s.m||[]).forEach(function(x){o.push(x)})});
  o.push("",d.sign.h);d.sign.l.forEach(function(x){o.push("• "+x)});if(d.note)o.push("",d.note);
  return o.join("\n");
 }
 function copyText(x){
  return(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(x):Promise.reject()).catch(function(){
   var t=document.createElement("textarea");t.value=x;t.style.cssText="position:fixed;opacity:0";document.body.appendChild(t);t.select();var ok=false;try{ok=document.execCommand("copy")}catch(e){}t.remove();if(!ok)throw new Error("copy")});
 }
 function acts(k){
  return'<span class="bd-acts"><button type="button" class="bd-a" data-act="cp" data-k="'+k+'" aria-label="কপি" title="কপি">'+SVG.cp+'<small>কপি</small></button><button type="button" class="bd-a" data-act="pd" data-k="'+k+'" aria-label="PDF" title="PDF">'+SVG.pd+'<small>PDF</small></button><button type="button" class="bd-a" data-act="au" data-k="'+k+'" aria-label="অডিও" title="অডিও">'+SVG.au+'<small>অডিও</small></button></span>';
 }
 function list(){
  return'<h2 class="bd-h">🔓 বাধা দূর করার রুকইয়াহ</h2><div class="bd-g">'+Object.keys(D).map(function(k){var d=D[k];return'<div class="bd-cell"><a class="bd-bt" href="#badha/'+k+'"><i>'+d.icon+'</i><b>'+esc(short(d.t))+'</b></a>'+acts(k)+'</div>'}).join("")+'</div>';
 }
 function page(k){
  var d=D[k];if(!d)return list();
  var h='<a class="bd-back" href="#badha">← বাধা দূর করার রুকইয়াহ</a><h2 class="bd-h"><i>'+d.icon+'</i> '+esc(d.t)+'</h2><div class="bd-top">'+acts(k)+'</div>';
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
 function flash(b,t){var o=b.querySelector("small"),old=o.textContent;o.textContent=t;setTimeout(function(){o.textContent=old},1600)}
 function act(a,k,b){
  if(!D||!D[k])return;
  if(a==="cp"){copyText(plain(k)).then(function(){flash(b,"✓ কপি হয়েছে")},function(){flash(b,"হয়নি")});return}
  if(!window.__drXKeys||!window.__drHomePdf||!window.__drHomeAudio){flash(b,"একটু পরে");return}
  var c=CAT(k);window.__drXKeys(c,KEYS);
  if(a==="pd"){window.__drHomePdf("x",c);return}
  parts(k);
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
  var ab=t0.closest&&t0.closest(".bd-a");
  if(ab&&D){e.preventDefault();e.stopPropagation();act(ab.getAttribute("data-act"),ab.getAttribute("data-k"),ab)}
 },true);
})();
