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
 var CAT=function(k){return"বাধা|"+D[k].t};
 // অডিও চার পার্টে, চিকিৎসার ক্রম মেনে। [সূরা,আয়াত,বার,শব্দ-শুরু,শব্দ-শেষ]; ["dua","dN",বার] = dua/dN.mp3 (Gemini TTS)
 // ফাতির ৩৫:২ শুধু "মা ইয়াফতাহিল্লাহু ... মিম বা‘দিহী" পর্যন্ত (শব্দ ১–১৬); "ওয়া হুয়াল আযীযুল হাকীম" বাদ
 var FT=function(n){return[35,2,n,1,16]};
 // পার্ট ১ (ধাপ ১) — পানি: মাগরিবের আগে ফাতির ২ ×৭
 function SEQ1(){return[FT(7)]}
 // পার্ট ২ (ধাপ ২) — তেল: আয়াতুল কুরসি ×৭; তারপর ফালাক ও নাস মিলে একবার (ফালাক ১টি + নাস ১টি), এভাবে ৭ বার
 function SEQ2(){var o=[[2,255,7]],q,i;
  for(q=0;q<7;q++){for(i=1;i<=5;i++)o.push([113,i,1]);for(i=1;i<=6;i++)o.push([114,i,1])}
  return o}
 // পার্ট ৩ (ধাপ ৩–৭) — পড়া ও দোয়া: ফাতির ২ + দোয়া ২১; ইউনুস ৮১ (শব্দ ৫–১৭: "মা জিতুম বিহিস সিহরু" থেকে আয়াতের শেষ "আল-মুফসিদীন" পর্যন্ত) + আ‘রাফ ১১৮ (পুরো) + দোয়া ২১; ফালাক ৪ ২১; ইনশিরাহ ৫-৬ জোড়ায় ২১; বাস্তব তালা
 function SEQ(){var o=[],q;
  for(q=0;q<21;q++)o.push(FT(1),["dua","d1",1]);
  for(q=0;q<21;q++)o.push([10,81,1,5,17],[7,118,1],["dua","d2",1]);
  o.push([113,4,21,1,5]);
  for(q=0;q<21;q++)o.push([94,5,1],[94,6,1]);
  o.push(FT(7),[10,81,7,5,17],["dua","d3",1],["dua","d4",1],["dua","d5",3]);
  return o}
 // পার্ট ৪ (ধাপ ৮) — তাহাজ্জুদের দোয়া ১০০ বার
 function SEQT(){return[["dua","d6",100]]}
 var PARTS=[{n:"১",t:"পানি",s:"মাগরিবের আগে: ফাতির ২ ×৭",f:SEQ1,pdf:1,sn:["১"]},
  {n:"২",t:"তেল",s:"আয়াতুল কুরসি ×৭; ফালাক+নাস মিলে ১ বার, ×৭",f:SEQ2,pdf:1,sn:["২"]},
  {n:"৩–৭",t:"পড়া ও দোয়া",s:"২১ বার ও ৭ বার, দোয়াসহ",f:SEQ,pdf:1,sn:["৩","৪","৫","৬","৭"]},
  {n:"৮",t:"তাহাজ্জুদ",s:"রাত ৩টায়: দোয়া ১০০ বার",f:SEQT,pdf:1,sn:["৮"]}];
 // ক্রম থেকে অনন্য [সূরা,আয়াত] (PDF-এর জন্য); "dua" ঘর বাদ
 // ছাঁটা অংশের অনুবাদ-শব্দ পাল্লা (অনুবাদের শব্দ, ১-ভিত্তিক): ফাতির ৩৫:২ শব্দ ১–১৬ = অনুবাদ ১–২৬ ("…তিনি ব্যতিত।"); ইউনুস ১০:৮১ শব্দ ৫–১৭ = অনুবাদ ৮–২৭ ("যা কিছু তোমরা এনেছ… করেন না।")
 var BNR={"35:2:1-16":[1,26],"10:81:5-17":[8,27]};
 // PDF-এর তালিকা: ছাঁটা অংশ থাকলে [সূরা,আয়াত,0,শব্দ-শুরু,শব্দ-শেষ,অনুবাদ-শুরু,অনুবাদ-শেষ] (অডিওর কাটের সাথে একই)
 function keysOf(seq){var o=[],seen={};seq.forEach(function(x){if(typeof x[0]!=="number")return;var id=x[0]+":"+x[1];if(seen[id])return;seen[id]=1;var r=x[3]&&x[4]?BNR[id+":"+x[3]+"-"+x[4]]:null;o.push(r?[x[0],x[1],0,x[3],x[4],r[0],r[1]]:[x[0],x[1]])});return o}
 function SEQALL(){return SEQ1().concat(SEQ2(),SEQ(),SEQT())}
 var BTN=function(act,k,i,svg,lbl,al){return'<button type="button" class="bd-a" data-act="'+act+'" data-k="'+k+'"'+(i==null?'':' data-p="'+i+'"')+' aria-label="'+esc(al||lbl)+'" title="'+esc(al||lbl)+'">'+svg+'<small>'+esc(lbl)+'</small></button>'};
 // পাতার মাথায়: পুরো আমলের PDF ও সম্পূর্ণ অডিও
 function topActs(k){return'<span class="bd-acts">'+BTN("cp",k,null,SVG.cp,"কপি")+BTN("pd",k,null,SVG.pd,"পুরো আমল PDF")+BTN("au",k,null,SVG.au,"সম্পূর্ণ অডিও")+'</span>'}
 // প্রতিটি ধাপের আলাদা সারি: নাম + নিজের PDF ও অডিও (দৈনন্দিন রুকইয়াহর "শারীরিক" তালিকার মতো)
 function rows(k){
  return'<section class="bd-c bd-parts"><h3>ধাপ অনুযায়ী অডিও ও PDF</h3>'+PARTS.map(function(p,i){
   return'<div class="bd-pr"><div class="bd-pl"><b>'+esc(p.n)+'</b><span>'+esc(p.t)+'<small>'+esc(p.s)+'</small></span></div><span class="bd-pb">'+(p.pdf?BTN("ps",k,i,SVG.pd,"PDF","ধাপ "+p.n+" — PDF"):'')+BTN("pa",k,i,SVG.au,"অডিও","ধাপ "+p.n+" — অডিও")+'</span></div>'}).join("")+'</section>'}
// PDF-র লেখা: পাতায় যেমন আছে হুবহু (সময়ের শিরোনাম, ধাপ, নির্দেশনা, আরবি, অনুবাদ, দোয়া); sn = কোন কোন ধাপ (নেই হলে পুরো আমল)
 function blocksOf(k,sn){var d=D[k],o=[];if(!sn&&d.when)o.push({k:"g",t:d.when});
  d.steps.forEach(function(s){if(sn&&sn.indexOf(s.n)<0)return;
   if(s.g)o.push({k:"g",t:s.g});
   o.push({k:"h",t:"ধাপ "+s.n+(s.h?" — "+s.h:"")});
   (s.p||[]).forEach(function(x){o.push({k:"p",t:x})});
   if(s.ar)o.push({k:"ar",t:s.ar});
   if(s.tr)s.tr.split("\n").forEach(function(x){o.push({k:"tr",t:x})});
   (s.m||[]).forEach(function(x){o.push({k:"m",t:x})})});
  return o}
 function short(t){return t.replace(/ দূর করার রুকইয়াহ$/,"")}
 function plain(k){
  var d=D[k],o=[d.t,"",d.sub,"","আলামত:"];
  d.sym.forEach(function(s){o.push(s.h);s.l.forEach(function(x){o.push("• "+x)})});
  o.push("",d.when);
  d.steps.forEach(function(s){if(s.g)o.push("","— "+s.g+" —");o.push("","["+s.n+"] "+(s.h||""));(s.p||[]).forEach(function(x){o.push(x)});if(s.ar)o.push(s.ar);if(s.tr)o.push(s.tr);(s.m||[]).forEach(function(x){o.push(x)})});
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
  var h='<a class="bd-back" href="#badha">← বাধা দূর করার রুকইয়াহ</a><h2 class="bd-h"><i>'+d.icon+'</i> '+esc(d.t)+'</h2><div class="bd-top">'+topActs(k)+'</div>'+rows(k);
  h+='<section class="bd-c"><h3>আলামত</h3>'+d.sym.map(function(s){return'<h4>'+esc(s.h)+'</h4>'+UL(s.l)}).join("")+'</section>';
  h+='<section class="bd-c bd-when"><b>'+esc(d.when)+'</b></section>';
  d.steps.forEach(function(s){
   if(s.g)h+='<h4 class="bd-g2">'+esc(s.g)+'</h4>';
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
  if(!window.__drXKeys||!window.__drTextDoc||!window.__drHomePdf||!window.__drHomeAudio){flash(b,"একটু পরে");return}
  var c=CAT(k),X=window.__drXKeys,p;
  if(a==="pd"){window.__drTextDoc(c,blocksOf(k));window.__drHomePdf("x",c);return}
  if(a==="au"){var cf=c+" · সম্পূর্ণ আমল";X(cf,SEQALL());window.__drHomeAudio("x",cf);return}
  p=PARTS[+b.getAttribute("data-p")];if(!p)return;
  if(a==="ps"){var cp=c+" · ধাপ "+p.n+" "+p.t;window.__drTextDoc(cp,blocksOf(k,p.sn));window.__drHomePdf("x",cp);return}
  if(a==="pa"){var ca=c+" · ধাপ "+p.n+" "+p.t+" (অডিও)";X(ca,p.f());window.__drHomeAudio("x",ca)}
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
