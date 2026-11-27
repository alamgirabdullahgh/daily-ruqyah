/* Daily Ruqyah — সাতটি অক্ষের চার্ট (#axes)।
   শুধু চার্ট থাকে; কোনো ঘরে (যেমন বদনজর → ধরন → মুগ্ধতা) চাপলে নিচে ওই ঘরের মৌলিক আয়াত আসে — মৌলিক অংশ সোনালি রঙে মার্ক করা — আর তার নিচে বাকি সব আয়াত।
   ডেটা: data/axis-ayat.json (tools/build-axis-ayat.py দিয়ে তৈরি) */
(function(){"use strict";
const BASE=new URL("data/",location.href).href,DV="4",STEP=10;
const $=i=>document.getElementById(i);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const bn2=n=>String(n).replace(/\d/g,d=>"০১২৩৪৫৬৭৮৯"[d]);
const SN="الفاتحة,البقرة,آل عمران,النساء,المائدة,الأنعام,الأعراف,الأنفال,التوبة,يونس,هود,يوسف,الرعد,إبراهيم,الحجر,النحل,الإسراء,الكهف,مريم,طه,الأنبياء,الحج,المؤمنون,النور,الفرقان,الشعراء,النمل,القصص,العنكبوت,الروم,لقمان,السجدة,الأحزاب,سبأ,فاطر,يس,الصافات,ص,الزمر,غافر,فصلت,الشورى,الزخرف,الدخان,الجاثية,الأحقاف,محمد,الفتح,الحجرات,ق,الذاريات,الطور,النجم,القمر,الرحمن,الواقعة,الحديد,المجادلة,الحشر,الممتحنة,الصف,الجمعة,المنافقون,التغابن,الطلاق,التحريم,الملك,القلم,الحاقة,المعارج,نوح,الجن,المزمل,المدثر,القيامة,الإنسان,المرسلات,النبأ,النازعات,عبس,التكوير,الانفطار,المطففين,الانشقاق,البروج,الطارق,الأعلى,الغاشية,الفجر,البلد,الشمس,الليل,الضحى,الشرح,التين,العلق,القدر,البينة,الزلزلة,العاديات,القارعة,التكاثر,العصر,الهمزة,الفيل,قريش,الماعون,الكوثر,الكافرون,النصر,المسد,الإخلاص,الفلق,الناس".split(",");

/* আয়াতের ডেটা অ্যাপের মূল ক্যাশেই (rs-4) থাকে — একই URL, তাই একবার নামালে দুই জায়গাতেই কাজ করে */
const rsFetch=async u=>{let c=null;try{c=window.caches&&await caches.open("rs-"+DV);const m=c&&await c.match(u);if(m)return await m.json()}catch(e){c=null}
 const r=await fetch(u);if(!r.ok)throw new Error(r.status);try{c&&await c.put(u,r.clone())}catch(e){}return await r.json()};
const CH={};
const chunk=(k,s)=>CH[k+s]||(CH[k+s]=rsFetch(BASE+"quran-chunks/"+k+"/"+s+".json?v="+DV).catch(e=>{delete CH[k+s];throw e}));

/* আরবি শব্দ-নম্বর → বাংলা অনুবাদের শব্দ-সীমা (০-ভিত্তিক), অ্যাপের quran-chunks/m অ্যালাইনমেন্ট থেকে */
function alRange(str,w){for(const it of String(str||"").split(",")){const p=it.split(":");if(+p[0]===w&&p[1]){const r=p[1].split("-").map(Number);if(r.length===2&&r[0]>=0&&r[1]>=r[0])return r}}return null}
function bnPortion(al,PR,N,nb){let b=1e9,e=-1;for(const it of String(al||"").split(",")){const p=it.split(":"),w=+p[0];if(!p[1]||w<PR[0]||w>PR[1])continue;const r=p[1].split("-").map(Number);if(r.length!==2||!(r[1]>=r[0]))continue;b=Math.min(b,r[0]);e=Math.max(e,r[1])}
 if(e<0)return null;if(PR[0]<=1)b=0;if(PR[1]>=N)e=nb-1;e=Math.min(e,nb-1);return b<=e?[b,e]:null}

/* ws = শব্দের তালিকা; port = সোনালি (মৌলিক) অংশ [শুরু, শেষ]; hit = লাল মার্ক [শুরু, শেষ] — সবই ০-ভিত্তিক */
function paint(box,ws,port,hit){box.textContent="";let seg=null;
 const inP=i=>!!(port&&i>=port[0]&&i<=port[1]),inH=i=>!!(hit&&i>=hit[0]&&i<=hit[1]);
 for(let i=0;i<ws.length;i++){const p=inP(i);
  if(p&&!seg){if(i)box.appendChild(document.createTextNode(" "));seg=el("span","rs-gold");box.appendChild(seg)}
  else if(!p){seg=null;if(i)box.appendChild(document.createTextNode(" "))}
  else if(i)seg.appendChild(document.createTextNode(" "));
  const host=seg||box;
  if(inH(i)){let j=i;while(j+1<ws.length&&inH(j+1)&&inP(j+1)===p)j++;host.appendChild(el("mark",null,ws.slice(i,j+1).join(" ")));i=j}
  else host.appendChild(document.createTextNode(ws[i]))}}

/* ref = {s,a,f,t,w}: f–t = মৌলিক অংশ (আরবি শব্দ-নম্বর, ১ থেকে), w = মিলে যাওয়া একটি শব্দ */
async function verseCard(ref,isBase){const{s,a,f,t,w}=ref;
 const[A,B]=await Promise.all([chunk("a",s),chunk("b",s)]);const at=(A||[])[a-1];if(at==null)return null;
 const aw=at.split(" "),bw=String((B||[])[a-1]||"").split(" ");let al=null;try{al=((await chunk("m",s))||[])[a-1]}catch(e){}
 const box=el("div","rs-vi ax-vi"+(isBase?" ax-base":""));
 if(isBase)box.appendChild(el("div","ax-bd","মৌলিক আয়াত"));
 const tx=el("div","rs-vt rs-ar"),tb=el("div","rs-vb");
 const aPort=f?[f-1,Math.min(t,aw.length)-1]:null,aHit=w?[w-1,w-1]:null;
 let bPort=f?bnPortion(al,[f,t],aw.length,bw.length):null;const bAuto=bPort?[bPort[0]+1,bPort[1]+1]:null;if(ref.bn&&ref.bn.length===2&&ref.bn[0]>=1&&ref.bn[1]>=ref.bn[0])bPort=[ref.bn[0]-1,Math.min(ref.bn[1],bw.length)-1];let bHit=null;if(w){const r=alRange(al,w);if(r)bHit=[r[0],Math.min(r[1],bw.length-1)]}
 paint(tx,aw,aPort,aHit);paint(tb,bw,bPort,bHit);
 const ft=el("div","rs-vf"),rf=el("div","rs-vr");rf.append("সূরা ",el("span","rs-ar",SN[s-1])," — "+bn2(s)+":"+bn2(a));ft.append(rf);
 if(ref.ck&&window.__drEditOpen&&document.body.classList.contains("dr-unlocked")){const eb=el("button","ed-btn","✂ কাস্টমাইজ");eb.type="button";eb.onclick=()=>window.__drEditOpen({s,a,f:f||0,t:t||0,ck:ref.ck,id:ref.id,aw,bw,al,bn:ref.bn||null,bAuto,cn:ref.cn});ft.append(eb)}
  box.append(tx,tb,ft);return box}

let DATA=null;
const EDO=()=>{try{return JSON.parse(localStorage.getItem("drEd")||"{}")||{}}catch(e){return{}}};
/* মালিকের ✂ কাস্টমাইজে বদলানো মার্ক (শুধু এই ফোনে): cells[ঘর]["b|সূরা:আয়াত"] বা ["m|<m-এর লেখা>"] = [শুরু-শব্দ, শেষ-শব্দ] */
function applyEd(D){const o=EDO().cells||{};for(const ck in o){const C=D.cells&&D.cells[ck];if(!C)continue;for(const id in o[ck]){const v=o[ck][id],ty=id[0],rest=id.slice(2);
  if(ty==="n"){C.bnr=C.bnr||{};C.bnr[rest]=v}else if(ty==="b"){const p=rest.split(":").map(Number),r=C.b.find(x=>x[0]===p[0]&&x[1]===p[1]);if(r){r[2]=v[0];r[3]=v[1]}}else{C.mp=C.mp||{};C.mp[rest]=v}}}return D}
const load=async()=>{if(DATA)return DATA;try{DATA=applyEd(await rsFetch(BASE+"axis-ayat.json?v=10"))}catch(e){DATA=null;throw e}return DATA};
/* "অবস্থান → শরীরে" ঘরের অডিওতে অঙ্গ ধরে ধরে আয়াত বাজে; অঙ্গের নাম ও আয়াত দৈনন্দিন রুকইয়াহর "শারীরিক → অঙ্গভিত্তিক" তালিকা (app.js এর ORG) থেকে আসে। শুধু দরকারের সময় লোড হয় */
let ORGS=[],ORGP=null;
const loadOrg=()=>Promise.resolve();/* অঙ্গ-প্রত্যঙ্গের তালিকা ও অঙ্গের আয়াত আর যোগ হয় না (ব্যবহারকারীর নির্দেশে বাদ); ORGS সব সময় খালি */
const isBodyCell=(c,n)=>c.name==="অবস্থান"&&n==="শরীরে";
const hasBody=id=>{const t=id[0];if(t==="g")return true;const p=id.slice(1).split(".").map(Number);return t==="r"?DATA.axes[p[0]].cols[p[1]].name==="অবস্থান":isBodyCell(DATA.axes[p[0]].cols[p[1]],DATA.axes[p[0]].cols[p[1]].opts[p[2]])};

function closePanel(R){R.__g=(R.__g||0)+1;R.querySelectorAll(".ax-p").forEach(x=>x.remove());R.querySelectorAll(".ax-c.on,.ax-hb.on").forEach(x=>x.classList.remove("on"))}

async function openCell(btn){const key=btn.dataset.k,[gi,ci,oi]=key.split(".").map(Number),G=DATA.axes[gi],C=DATA.cells[key];
 const R=btn.closest(".ax-root");closePanel(R);const my=R.__g;btn.classList.add("on");
 const sec=btn.closest(".ax-g"),pn=el("div","ax-p");
 const hd=el("div","ax-ph"),x=el("button","ax-x","✕");x.type="button";x.setAttribute("aria-label","বন্ধ করুন");x.onclick=()=>closePanel(R);
 hd.append(el("span",null,G.name+" › "+G.cols[ci].name+" › "+G.cols[ci].opts[oi]),x);
 pn.append(hd);
 const lg=el("div","ax-lg");lg.append(el("span","rs-gold","সোনালি অংশ")," = মৌলিক অংশ");pn.appendChild(lg);
 sec.appendChild(pn);
 if(C&&window.__drXKeys){const md=R.__mode,cat="অক্ষ "+G.name+" "+G.cols[ci].name+" "+G.cols[ci].opts[oi]+(SFX[md]||""),seen=new Set(),ks=[];
  [...C.b.map(r=>[r[0],r[1],0,r[2],r[3]]),...(md==="resp"?[]:C.m).map(v=>{const p=v.split(":").map(Number),q=C.mp&&C.mp[v];return q?[p[0],p[1],0,q[0],q[1]]:[p[0],p[1]]})].forEach(k=>{const id=k[0]+":"+k[1];if(!seen.has(id)){seen.add(id);ks.push(k)}});
  window.__drXKeys(cat,ks);
  const act=el("div","ax-act"),hp=el("div","ax-hp"),ha=el("div","ax-hp");hp.hidden=ha.hidden=true;
  const bp=el("button","ax-ab","📄 PDF"),ba=el("button","ax-ab","🔊 অডিও");bp.type=ba.type="button";
  bp.onclick=()=>window.__drHomePdf&&window.__drHomePdf("x",cat,hp);ba.onclick=()=>window.__drHomeAudio&&window.__drHomeAudio("x",cat,ha);
  act.append(bp,ba);pn.append(act,hp,ha)}
 if(!C){pn.appendChild(el("div","ax-n","এই ঘরের আয়াত এখনো যোগ হয়নি।"));return}
 const b=el("div","rs-v");pn.appendChild(b);
 for(const r of C.b){const c=await verseCard({s:r[0],a:r[1],f:r[2],t:r[3],ck:key,id:"b|"+r[0]+":"+r[1],bn:C.bnr&&C.bnr["b|"+r[0]+":"+r[1]],cn:G.cols[ci].opts[oi]},true).catch(()=>null);if(my!==R.__g)return;if(c)b.appendChild(c)}
 if(R.__mode==="resp")return;/* প্রতিক্রিয়া ভিত্তিক: প্রতিটি অপশনে শুধু একটি মৌলিক আয়াত; "বাকি আয়াত" শুধু চিকিৎসায় */
 const more=C.m.map(v=>{const p=v.split(":").map(Number),q=C.mp&&C.mp[v];return{s:p[0],a:p[1],w:p[2]||0,f:q?q[0]:0,t:q?q[1]:0,ck:key,id:"m|"+v,bn:C.bnr&&C.bnr["m|"+v],cn:G.cols[ci].opts[oi]}});
 pn.appendChild(el("div","ax-sh","বাকি আয়াত"+(more.length?" ("+bn2(more.length)+"টি)":"")));
 if(!more.length){pn.appendChild(el("div","ax-n","এই ঘরে মৌলিক আয়াতের বাইরে আর কোনো আয়াত নেই।"));return}
 const lst=el("div","rs-v"),btnMore=el("button","rs-more");btnMore.type="button";pn.append(lst,btnMore);
 let shown=0,busy=false,io=null;
 const add=async()=>{if(busy)return;busy=true;btnMore.disabled=true;btnMore.textContent="আয়াত লোড হচ্ছে…";
  const end=Math.min(more.length,shown+STEP);
  for(;shown<end;shown++){const c=await verseCard(more[shown],false).catch(()=>null);if(my!==R.__g){io&&io.disconnect();return}if(c)lst.appendChild(c)}
  busy=false;btnMore.disabled=false;
  if(shown<more.length)btnMore.textContent="আরও আয়াত দেখান ("+bn2(more.length-shown)+" বাকি)";
  else{btnMore.style.display="none";io&&io.disconnect()}};
 btnMore.onclick=add;
 await add();
 if(my===GEN&&"IntersectionObserver"in window&&shown<more.length){io=new IntersectionObserver(es=>{if(my!==R.__g){io.disconnect();return}if(es[es.length-1].isIntersecting&&!busy&&shown<more.length)add()},{rootMargin:"600px 0px"});io.observe(btnMore)}}

/* হেডিং-বাটন (বদনজর/জাদু/জিন): চাপলে ওই হেডিংয়ের নিচের সব ঘরের আয়াত, ঘরের ক্রমে, ঘরের নামের সাব-হেডিংসহ লিখিতভাবে একসাথে। প্রতিক্রিয়া পাতায় শুধু মৌলিক আয়াত, অন্যত্র মৌলিক + বাকি সব (PDF/অডিওর তালিকার মতোই) */
async function openGroup(btn){const gi=+btn.dataset.g,G=DATA.axes[gi],R=btn.closest(".ax-root");closePanel(R);const my=R.__g;btn.classList.add("on");
 const sec=btn.closest(".ax-g"),pn=el("div","ax-p"),md=R.__mode;
 const q=[];let cnt=0;
 G.cols.forEach((c,ci)=>c.opts.forEach((n,oi)=>{const key=gi+"."+ci+"."+oi,C=DATA.cells[key];if(!C)return;
  const rs=C.b.map(r=>({ref:{s:r[0],a:r[1],f:r[2],t:r[3],ck:key,id:"b|"+r[0]+":"+r[1],bn:C.bnr&&C.bnr["b|"+r[0]+":"+r[1]],cn:n},base:true}));
  if(md!=="resp")C.m.forEach(v=>{const p=v.split(":").map(Number),qq=C.mp&&C.mp[v];rs.push({ref:{s:p[0],a:p[1],w:p[2]||0,f:qq?qq[0]:0,t:qq?qq[1]:0,ck:key,id:"m|"+v,bn:C.bnr&&C.bnr["m|"+v],cn:n},base:false})});
  if(rs.length){q.push({head:c.name+" › "+n});rs.forEach(r=>{q.push(r);cnt++})}}));
 const hd=el("div","ax-ph"),x=el("button","ax-x","✕");x.type="button";x.setAttribute("aria-label","বন্ধ করুন");x.onclick=()=>closePanel(R);
 hd.append(el("span",null,G.name+" — সব আয়াত"+(cnt?" ("+bn2(cnt)+"টি)":"")),x);pn.append(hd);
 const lg=el("div","ax-lg");lg.append(el("span","rs-gold","সোনালি অংশ")," = মৌলিক অংশ");pn.appendChild(lg);
 sec.querySelector(".ax-h3").after(pn);
 if(!q.length){pn.appendChild(el("div","ax-n","এই হেডিংয়ের আয়াত এখনো যোগ হয়নি।"));return}
 const lst=el("div","rs-v"),btnMore=el("button","rs-more");btnMore.type="button";pn.append(lst,btnMore);
 let pos=0,done=0,busy=false,io=null;
 const add=async()=>{if(busy)return;busy=true;btnMore.disabled=true;btnMore.textContent="আয়াত লোড হচ্ছে…";let n=0;
  while(pos<q.length&&n<STEP){const it=q[pos++];if(it.head){lst.appendChild(el("div","ax-sh",it.head));continue}
   const c=await verseCard(it.ref,it.base).catch(()=>null);if(my!==R.__g){io&&io.disconnect();return}if(c)lst.appendChild(c);n++;done++}
  busy=false;btnMore.disabled=false;
  if(pos<q.length)btnMore.textContent="আরও আয়াত দেখান ("+bn2(cnt-done)+" বাকি)";else{btnMore.style.display="none";io&&io.disconnect()}};
 btnMore.onclick=add;await add();
 if("IntersectionObserver"in window&&pos<q.length){io=new IntersectionObserver(es=>{if(my!==R.__g){io.disconnect();return}if(es[es.length-1].isIntersecting&&!busy&&pos<q.length)add()},{rootMargin:"600px 0px"});io.observe(btnMore)}}

/* লক্ষণ ভিত্তিক রোগ নির্ণয় পাতার চার্টের একই ছক (সাতটি হেডিং, প্রতিটির নিচে অপশন) */
const AUL="🔊\nঅডিও",PDL="📄\nPDF";
const mkb=(cls,id,txt,lab)=>{const b=el("button",cls,txt==="🔊"?AUL:txt==="📄"?PDL:txt);b.type="button";b.dataset.s=id;b.setAttribute("aria-label",lab);return b};
function buildGroup(gi,g){const sec=el("section","ax-g zs");sec.dataset.slug=g.slug;
 {const h=el("h3","ax-h3"),hb=el("button","ax-hb",g.name);hb.type="button";hb.dataset.g=gi;hb.setAttribute("aria-label",g.name+" — সব আয়াত লিখিত দেখান");
  /* হেডিং এখন বাটন: বাঁয়ে PDF, ডানে অডিও; চাপলে এই হেডিংয়ের নিচের সব ঘরের আয়াত লিখিতভাবে একসাথে */
  h.append(mkb("ax-pd ax-ga","g"+gi,"📄",g.name+" — PDF"),hb,mkb("ax-au ax-ga","g"+gi,"🔊",g.name+" — অডিও"));sec.appendChild(h)}
 const tb=el("div","ax-tb");
 g.cols.forEach((c,ci)=>{const r=el("div","ax-r"),o=el("div","ax-ro");r.dataset.r=gi+"."+ci;
  c.opts.forEach((n,oi)=>{const k=gi+"."+ci+"."+oi,w=el("div","ax-cw"),b=el("button","ax-c",n);b.type="button";b.dataset.k=k;if(ci===0){const st=el("span","ax-st","★");st.setAttribute("aria-hidden","true");b.appendChild(st)}const cb=el("div","ax-cb");cb.append(mkb("ax-pd ax-mb","c"+k,"📄",n+" — PDF"),mkb("ax-au ax-mb","c"+k,"🔊",n+" — অডিও"));w.append(b,cb);o.appendChild(w)});
  if(o.children.length>2)o.classList.add("ax-3");const rh=el("div","ax-rh"),rb=el("div","ax-rb");rb.append(mkb("ax-pd ax-mb","r"+gi+"."+ci,"📄",c.name+" — PDF"),mkb("ax-au ax-mb","r"+gi+"."+ci,"🔊",c.name+" — অডিও"));rh.append(el("span","ax-rl",c.name),rb);r.append(rh,o);tb.appendChild(r)});
 sec.appendChild(tb);return sec}

/* সব ঘরের লেখা একই মাপে: পুরো চার্টের সবচেয়ে চাপা ঘরটা যে মাপে আঁটে, সব বাটনে সেই এক মাপ (দৃশ্যমান অবস্থায় মাপা যায়) */
function fitH(R){/* আগে পুরো চার্ট এক স্ক্রিনে আঁটাতে ছোট (zoom) করা হতো; এখন আর নয় — সারির ফাঁকা বেশি, পাতা স্ক্রল হয়, লেখা ছোট হয় না */
 R.querySelectorAll(".ax-g").forEach(g=>{g.style.zoom=""})}
function fit(R){const rows=[...R.querySelectorAll(".ax-g:not([hidden]) .ax-ro")].filter(o=>o.querySelector(".ax-c")&&o.querySelector(".ax-c").clientWidth);
 if(rows.length){const all=rows.flatMap(o=>[...o.querySelectorAll(".ax-c")]);let s=17;all.forEach(b=>b.style.fontSize=s+"px");while(s>13&&all.some(b=>b.scrollWidth>b.clientWidth)){s-=.25;all.forEach(b=>b.style.fontSize=s+"px")}}
 const hs=[...R.querySelectorAll(".ax-g:not([hidden]) .ax-rh")].filter(h=>h.clientWidth);
 if(hs.length){let s=15;hs.forEach(h=>h.style.fontSize=s+"px");while(s>6&&hs.some(h=>h.scrollWidth>h.clientWidth)){s-=.25;hs.forEach(h=>h.style.fontSize=s+"px")}};fitH(R)}

/* ===== হেডিংয়ের পাশের অডিও: ওই বিষয়ের ঘরগুলো ক্রমানুসারে (ধরন → মুগ্ধতা, হিংসা → উৎস …) এই পাতাতেই বাজে; যে ঘর বাজছে সেখানে জ্বলজ্বলে ফোঁটা ===== */
/* mode: "resp" = শুধু মৌলিক আয়াত (প্রতিক্রিয়া ভিত্তিক), অন্যথায় মৌলিক + বাকি সব (চিকিৎসা) */
const SFX={resp:" · প্রতিক্রিয়া",treat:" · চিকিৎসা"},REPN={resp:11,treat:1};
function regCell(gi,ci,oi,mode){const key=gi+"."+ci+"."+oi,C=DATA.cells[key];if(!C)return null;
 const seen=new Set(),ks=[];
 [...C.b.map(r=>[r[0],r[1],0,r[2],r[3]]),...(mode==="resp"?[]:C.m.map(v=>{const p=v.split(":").map(Number),q=C.mp&&C.mp[v];return q?[p[0],p[1],0,q[0],q[1]]:[p[0],p[1]]}))].forEach(k=>{const id=k[0]+":"+k[1];if(!seen.has(id)){seen.add(id);ks.push(k)}});
 return ks.length?{ks}:null}
/* স্কোপ: "g0" = পুরো হেডিং · "r0.1" = একটি সারি (যেমন ধরন) · "c0.1.0" = একটি ঘর (যেমন মুগ্ধতা)। আয়াত-তালিকা ক্রমানুসারে */
function scope(id,sec,mode){const t=id[0],p=id.slice(1).split(".").map(Number),gi=p[0],G=DATA.axes[gi],plist=[],list=[],cells=[];let hasOrg=false;
 G.cols.forEach((c,ci)=>c.opts.forEach((n,oi)=>{if(t==="r"&&ci!==p[1])return;if(t==="c"&&(ci!==p[1]||oi!==p[2]))return;
  const r=regCell(gi,ci,oi,mode);if(!r)return;const from=list.length;r.ks.forEach(k=>{plist.push(k);list.push(k)});
  /* শরীরে ঘর: ঘরের নিজের আয়াতের পর অঙ্গের ক্রমে প্রতিটি অঙ্গের আয়াত (ঘরে আগেই থাকা আয়াত বা আগের অঙ্গে এসে গেলে আবার নয়); og = প্রতিটি অঙ্গের আয়াত-সীমা */
  let og=null;if(ORGS.length&&isBodyCell(c,n)){og=[];hasOrg=true;const sn=new Set(r.ks.map(k=>k[0]+":"+k[1]));
   /* "শরীরে" ঘরের অঙ্গ-তালিকা পালাক্রমে: "শরীরে" ঘরের মৌলিক আয়াত একবার, অঙ্গের আয়াত একবার — আবার "শরীরে", আবার অঙ্গ (ফলে আয়াত শুনেই বোঝা যায় এটা বদনজর/জাদু/জিনের কোন চার্ট)। প্রতিক্রিয়া: প্রতিটি অঙ্গের মূল আয়াতে ১১ পালা; চিকিৎসা: অঙ্গের প্রতিটি আয়াতের আগে "শরীরে"-র আয়াত। তৃতীয় সংখ্যা ১ = এই আয়াত একবারই */
   const B=r.ks[0];ORGS.forEach((o,k)=>{const f=list.length;if(mode==="resp"){if(o.base){if(B)for(let q=0;q<REPN.resp;q++){list.push([B[0],B[1],1]);list.push([o.base[0],o.base[1],1])}else list.push(o.base)}}else o.keys.forEach(x=>{const i=x[0]+":"+x[1];if(!sn.has(i)){sn.add(i);if(mode==="treat"&&B)list.push([B[0],B[1],1]);list.push(x)}});if(list.length>f)og.push({k,from:f,to:list.length})})}
  cells.push({b:sec?sec.querySelector('.ax-c[data-k="'+gi+"."+ci+"."+oi+'"]'):null,name:c.name+" › "+n,from,to:list.length,og})}));
 const cat="অক্ষ "+G.name+(t!=="g"?" "+G.cols[p[1]].name:"")+(t==="c"?" "+G.cols[p[1]].opts[p[2]]:"")+(SFX[mode]||"");
 const seen=new Set(),ks=[];plist.forEach(k=>{const i=k[0]+":"+k[1];if(!seen.has(i)){seen.add(i);ks.push(k)}});
 if(window.__drXKeys)window.__drXKeys(cat,ks);/* PDF-এর আয়াত আগের মতোই (অঙ্গ ছাড়া); শুধু অডিওতে অঙ্গ যোগ হয়, তাই অডিওর নাম আলাদা */
 return{G,list,cells,cat,acat:cat+(hasOrg?" +অঙ্গ":""),hasOrg,gi,rep:REPN[mode]||3}}
function stopPlay(R){const st=R&&R.__pl;if(!st)return;st.stop=true;R.__pl=null;try{if(st.a){st.a.pause();st.a.ontimeupdate=st.a.onended=st.a.onplay=null}}catch(e){}
 R.querySelectorAll(".ax-now").forEach(x=>x.classList.remove("ax-now"));R.querySelectorAll(".ax-live,.ax-orgs").forEach(x=>x.remove());
 R.querySelectorAll(".ax-au.on").forEach(b=>{b.classList.remove("on");b.textContent=AUL})}
/* একবার জোড়া হলে মনে থাকে: দ্বিতীয়বার সাথে সাথে বাজে */
const GM={};
function gMerge(id,sc){const gk=id+"|"+sc.acat;if(GM[gk])return GM[gk];
 const ent={out:el("div"),marks:null,note:()=>{}};
 ent.p=(async()=>{await window.__drGroupAudio(sc.list,ent.out,t=>ent.note(t),sc.acat,m=>{ent.marks=m},sc.rep);if(!ent.out.querySelector("audio"))throw new Error("noaudio");return ent})().catch(e=>{delete GM[gk];throw e});
 GM[gk]=ent;return ent}
const rowEl=(sec,id)=>sec.querySelector('.ax-r[data-r="'+id.slice(1).split(".").slice(0,2).join(".")+'"]');
const anchorOf=(sec,id)=>id[0]==="g"?sec.querySelector("h3"):rowEl(sec,id);
/* অডিও: চাপলে সাথে সাথে এই পাতাতেই বাজে (নিজে ডাউনলোড হয় না); কোন ঘর বাজছে জ্বলজ্বলে ফোঁটায় দেখায়; প্লেয়ারের পাশে ⬇ ও শেয়ার */
async function playSeq(R,id,sec,btn){const same=R.__pl&&R.__pl.id===id;stopPlay(R);if(same)return;
 if(!window.__drGroupAudio)return;
 const sc=scope(id,sec,R.__mode),{G,list,cells}=sc;
 if(!list.length)return;
 const st={id,stop:false,a:null};R.__pl=st;btn.classList.add("on");btn.textContent="⏹\nথামান";
 const bar=el("div","ax-live"),tx=el("div","ax-lt"),nt=el("div","ax-ln"),hb=el("div");bar.append(tx,nt,hb);anchorOf(sec,id).after(bar);
 const ttl=id[0]==="c"?cells[0].name:id[0]==="r"?G.cols[+id.slice(1).split(".")[1]].name+" — "+bn2(cells.length)+"টি ঘর একসাথে":"সব "+bn2(cells.length)+"টি ঘর একসাথে";
 tx.textContent="▶ "+G.name+" › "+ttl;nt.textContent="⏳ অডিও প্রস্তুত হচ্ছে…";
 const ent=gMerge(id,sc);ent.note=t=>{if(R.__pl===st)nt.textContent="⏳ "+t};
 try{await ent.p}catch(e){console.error(e);if(R.__pl===st){nt.textContent="অডিও তৈরি করা যায়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন";btn.classList.remove("on");btn.textContent=AUL;R.__pl=null}return}
 if(st.stop||R.__pl!==st)return;
 nt.remove();hb.appendChild(ent.out);
 const a=ent.out.querySelector("audio");let mk=ent.marks||[];st.a=a;
 const cellOf=i=>{for(let k=0;k<cells.length;k++)if(i>=cells[k].from&&i<cells[k].to)return k;return -1};
 const orgOf=(c,i)=>{const og=cells[c].og;if(og)for(const x of og)if(i>=x.from&&i<x.to)return x.k;return -1};
 /* শরীরে ঘরে এলে একেবারে নিচে অঙ্গের নাম আটটি কলামে (যত সারি লাগে); যে অঙ্গের আয়াত চলছে সেটি জ্বলে, সাথে "শরীরে" বাটনও */
 const seeIf=b=>{const r=b.getBoundingClientRect();if(r.top<60||r.bottom>innerHeight-60)b.scrollIntoView({behavior:"smooth",block:"center"})};
 let cur=-2,curO=-2;
 const upd=()=>{if(!mk.length&&a.duration)mk=list.map((_,i)=>({i,t:(i+1)/list.length*a.duration}));if(!mk.length)return;
  const t=a.currentTime+.03;let k=mk.findIndex(m=>m.t>t);if(k<0)k=mk.length-1;const i=mk[k].i,c=cellOf(i);if(c<0)return;const o=orgOf(c,i);if(c===cur&&o===curO)return;
  const newCell=c!==cur;cur=c;curO=o;
  R.querySelectorAll(".ax-now").forEach(x=>x.classList.remove("ax-now"));const C=cells[c];
  if(C.b){C.b.classList.add("ax-now");if(newCell)seeIf(C.b)}
  tx.textContent="▶ "+G.name+" › "+C.name+(o>=0?" › "+ORGS[o].name:"")+(id[0]!=="c"?"  ("+bn2(c+1)+"/"+bn2(cells.length)+")":"")};
 a.ontimeupdate=upd;a.onplay=upd;a.onended=()=>{if(R.__pl===st)stopPlay(R)};
 try{a.currentTime=0;await a.play()}catch(e){}
 upd()}
function openPdf(R,id,sec){const sc=scope(id,sec,R.__mode);window.__drHomePdf&&window.__drHomePdf("x",sc.cat,null)}
/* অ্যাপ চালু হলে ব্যাকগ্রাউন্ডে সবকিছুর অডিও ও PDF আগে থেকে তৈরি: আগে প্রতিটি ঘর, তারপর সারি, শেষে পুরো হেডিং (আয়াতের এনকোড ভাগ হয়, তাই পরের দুটো দ্রুত) */
window.__drAxPre=async()=>{await load();const sl=()=>new Promise(r=>setTimeout(r,300)),ids=[];
 DATA.axes.forEach((g,gi)=>{g.cols.forEach((c,ci)=>c.opts.forEach((n,oi)=>ids.push("c"+gi+"."+ci+"."+oi)));g.cols.forEach((c,ci)=>ids.push("r"+gi+"."+ci));ids.push("g"+gi)});
 /* দুই পাতার (প্রতিক্রিয়া ভিত্তিক / চিকিৎসা) আলাদা আয়াত-তালিকা, তাই দুই রকমই আগে থেকে তৈরি */
 const all=[];["resp","treat"].forEach(m=>ids.forEach(id=>{const sc=scope(id,null,m);if(sc.list.length)all.push({id,sc,m})}));
 window.__drPreAdd&&window.__drPreAdd(all.length*2);
 /* সব অডিওই আগে থেকে তৈরি: হালকাগুলো আগে, "শরীরে" ঘর-যুক্ত (অঙ্গসহ, লম্বা) গুলো শেষে — চাপলে আর জোড়া লাগাতে হয় না */
 if(window.__drGroupAudio)for(const x of all.slice().sort((a,b)=>hasBody(a.id)-hasBody(b.id))){const t0=Date.now();try{await gMerge(x.id,x.sc).p}catch(e){console.error(e)}window.__drPreTick&&window.__drPreTick();if(Date.now()-t0>80)await sl()}
 if(window.__drHomePdfPre)for(const x of all){const t0=Date.now();try{await window.__drHomePdfPre(x.sc.cat)}catch(e){console.error(e)}window.__drPreTick&&window.__drPreTick();if(Date.now()-t0>80)await sl()}};
/* হোমের প্রতিক্রিয়া/চিকিৎসা অডিও-PDF-এর আয়াত-তালিকা: kind = resp | treat; slug = nazar | jadu | jin | "" (তিন চার্ট পরপর)। প্রতিটি ঘর চার্টের ক্রমে */
window.__drAxList=async(kind,slug)=>{await load();const out=[];
 DATA.axes.forEach((g,gi)=>{if(slug&&g.slug!==slug)return;scope("g"+gi,null,kind).list.forEach(k=>out.push(k))});return out};

const SLUG={nazar:1,jadu:1,jin:1};
/* R = চার্ট বসানোর ঘর: #axBody (পুরো পাতা, শিরোনামসহ) অথবা হোমের ট্যাবের ভেতরের .ax-home (শুধু চার্ট) */
async function mount(R,slug,full,title,mode){if(!R)return;R.__mode=mode||"";
 if(!R.dataset.ready){if(R.__ld)return;R.__ld=1;R.textContent="";R.appendChild(el("div","ax-info","লোড হচ্ছে…"));
  try{await load()}catch(e){R.__ld=0;R.textContent="";const m=el("div","ax-info","চার্ট লোড করা যায়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন"),r=el("button","rs-more","আবার চেষ্টা");r.type="button";r.onclick=()=>mount(R,slug,full,title);R.append(m,r);return}
  R.textContent="";
  if(full){R.appendChild(el("h2","ax-t",title||"সাতটি অক্ষ"));}
  DATA.axes.forEach((g,gi)=>R.appendChild(buildGroup(gi,g)));
  R.addEventListener("click",e=>{const ab=e.target.closest&&e.target.closest(".ax-au,.ax-pd");if(ab){const sec=ab.closest(".ax-g");if(ab.classList.contains("ax-au"))playSeq(R,ab.dataset.s,sec,ab);else openPdf(R,ab.dataset.s,sec);return}
   const hb=e.target.closest&&e.target.closest(".ax-hb");if(hb){if(hb.classList.contains("on")){closePanel(R);return}
    openGroup(hb).then(()=>{const p=hb.closest(".ax-g").querySelector(".ax-p");if(p&&p.getBoundingClientRect().top>innerHeight*.7)p.scrollIntoView({behavior:"smooth",block:"start"})}).catch(()=>{});return}
   const b=e.target.closest&&e.target.closest(".ax-c");if(!b)return;if(b.classList.contains("on")){closePanel(R);return}
   openCell(b).then(()=>{const p=b.closest(".ax-g").querySelector(".ax-p");if(p&&p.getBoundingClientRect().top>innerHeight*.7)p.scrollIntoView({behavior:"smooth",block:"start"})}).catch(()=>{})});
  R.dataset.ready="1";R.__ld=0}
 stopPlay(R);closePanel(R);
 if(full){const tt=R.querySelector(".ax-t");if(tt)tt.textContent=title||"সাতটি অক্ষ"}
 const sl=SLUG[slug]?slug:"";R.querySelectorAll(".ax-g").forEach(g=>{g.hidden=!!sl&&g.dataset.slug!==sl});
 requestAnimationFrame(()=>requestAnimationFrame(()=>fit(R)))}
window.addEventListener("resize",()=>{const R=$("axBody");if(R&&R.dataset.ready&&R.offsetParent)fit(R)});
window.addEventListener("hashchange",()=>{if(!/^#(resp|treat|axes)/.test(location.hash))stopPlay($("axBody"))});
window.__drAxes=(slug,title,mode)=>mount($("axBody"),slug,true,title,mode);
window.__drAxesMount=(R,slug)=>mount(R,slug,false);
window.__drAxesFit=R=>fit(R);

/* ===== মালিকের ✂ কাস্টমাইজ: শুধু আয়াত ও আয়াতের অর্থের মার্ক (কোন শব্দ থেকে কোন শব্দ)। অডিও মার্ক/কাটার অপশন নেই। শুধু লগইন করা (dr-unlocked) অবস্থায় দেখা যায়; বদল শুধু এই ফোনে জমে (localStorage drEd) ও সাথে সাথে অ্যাপে কাজ করে; "কপি" দিয়ে সব বদল নিয়ে রিপোতে স্থায়ী করা যায় ===== */
(function(){
 if(!document.getElementById("edCss")){const s=document.createElement("style");s.id="edCss";s.textContent=".ed-btn{margin-top:6px;padding:7px 12px;border-radius:10px;border:1px solid #c9a227;background:transparent;color:inherit;font:inherit;font-size:14px;cursor:pointer}body:not(.dr-unlocked) .ed-btn{display:none!important}.ed-m{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.55);overflow:auto;padding:10px}.ed-b{background:var(--card-bg,#fff);color:var(--text-main,#111);border-radius:16px;padding:14px;max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:10px}.ed-b h4{margin:0;font-size:16px}.ed-ws{direction:rtl;line-height:2.3}.ed-w{display:inline-block;padding:2px 8px;margin:2px;border-radius:8px;border:1px solid #aaa;font-size:22px;cursor:pointer}.ed-w.on{background:#e8c25a;color:#000;border-color:#c9a227}.ed-r{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ed-k{padding:7px 10px;border-radius:10px;border:1px solid #999;background:transparent;color:inherit;font:inherit;font-size:14px;cursor:pointer}.ed-k.p{background:#2e7d32;color:#fff;border-color:#2e7d32}.ed-k.d{border-color:#c62828;color:#c62828}.ed-n{font-size:13px;opacity:.8}.ed-bs{direction:ltr;line-height:2}.ed-wb{font-size:16px!important}";document.head.appendChild(s)}
 window.__drEditOpen=async function(o){
  if(!document.body.classList.contains("dr-unlocked"))return;
  const{s,a,ck,id,aw}=o,bw=o.bw||[],al=o.al,nid="n|"+id;let f=o.f||0,t=o.t||0;const f0=f,t0=t;
  /* অর্থ (বাংলা) মার্ক: বাংলা শব্দ-নম্বর ১ থেকে। হাতে না বদলালে আরবির মার্ক থেকে অ্যালাইনমেন্টে নিজে নির্ধারিত হয় */
  let bf=0,bt=0,bTouched=!!(o.bn&&o.bn.length===2);const bc=o.bn||o.bAuto;if(bc){bf=bc[0];bt=bc[1]}const bf0=bf,bt0=bt;
  const m=el("div","ed-m"),b=el("div","ed-b");m.appendChild(b);
  const close=()=>{m.remove()};
  const hd=el("div","ed-r");hd.append(el("h4",null,"✂ সূরা "+bn2(s)+":"+bn2(a)+(o.cn?" — "+o.cn:"")));const x=el("button","ed-k","✕");x.type="button";x.onclick=close;x.style.marginLeft="auto";hd.append(x);b.append(hd);
  b.append(el("div","ed-n","১) আরবি মার্ক: শুরু-শব্দ ও শেষ-শব্দে চাপুন (দুটো আলাদা শব্দে চাপলে মাঝেরটুকু সোনালি)। অডিও ডাউনলোডে ঠিক এই মার্ক-করা আরবি অংশটুকুই কেটে জোড়া লাগবে।"));
  const ws=el("div","ed-ws rs-ar");b.append(ws);const sel=el("div","ed-n");b.append(sel);
  b.append(el("div","ed-n","২) অর্থ মার্ক: বাংলা অর্থের শুরু-শব্দ ও শেষ-শব্দে চাপুন। না চাপলে আরবির মার্কের সাথে মিলিয়ে নিজে ঠিক হবে।"));
  const bs=el("div","ed-ws ed-bs");b.append(bs);const bsel=el("div","ed-n");b.append(bsel);
  const autoB=()=>{const r=f?bnPortion(al,[f,t],aw.length,bw.length):null;if(r){bf=r[0]+1;bt=r[1]+1}else{bf=bt=0}};
  const paintB=()=>{bs.textContent="";if(!bw.length){bsel.textContent="এই আয়াতের অর্থ পাওয়া যায়নি";return}
   bw.forEach((w,i)=>{const c=el("span","ed-w ed-wb"+(bf&&i+1>=bf&&i+1<=bt?" on":""),w);c.onclick=()=>{bTouched=true;if(bf&&bt&&bf===bt&&i+1!==bf){const lo=Math.min(bf,i+1),hi=Math.max(bt,i+1);bf=lo;bt=hi}else{bf=bt=i+1}paintB()};bs.append(c)});
   bsel.textContent=bf?"অর্থ মার্ক: শব্দ "+bn2(bf)+" থেকে "+bn2(bt)+(bTouched?(bf!==bf0||bt!==bt0?" (আপনার বদলানো)":" (আপনার আগের মার্ক)"):" (আরবির সাথে মিলিয়ে নিজে ঠিক)"):"অর্থে এখনো মার্ক নেই — শব্দে চাপুন"};
  const paintW=()=>{ws.textContent="";aw.forEach((w,i)=>{const c=el("span","ed-w"+(f&&i+1>=f&&i+1<=t?" on":""),w);c.onclick=()=>{if(f&&t&&f===t&&i+1!==f){f=Math.min(f,i+1);t=Math.max(t,i+1)}else{f=t=i+1}if(!bTouched)autoB();paintW();paintB()};ws.append(c)});sel.textContent=f?"আরবি মার্ক: শব্দ "+bn2(f)+" থেকে "+bn2(t)+(f!==f0||t!==t0?" (বদলানো)":""):"এই আয়াতে এখনো মার্ক নেই — শব্দে চাপুন"};
  const bact=el("div","ed-r"),ba=el("button","ed-k","↻ অর্থ আরবির সাথে মেলান");ba.type="button";ba.onclick=()=>{bTouched=false;autoB();paintB()};bact.append(ba);b.append(bact);
  const act=el("div","ed-r"),sv=el("button","ed-k p","💾 সংরক্ষণ"),rs=el("button","ed-k d","↩ আগের অবস্থায়");sv.type=rs.type="button";
  const bump=()=>{try{localStorage.setItem("drEdV",Date.now().toString(36))}catch(e){}};
  sv.onclick=()=>{if(!f&&!bf){alert("আগে শব্দে চেপে মার্ক ঠিক করুন");return}
   const ed=EDO();ed.cells=ed.cells||{};const C=ed.cells[ck]=ed.cells[ck]||{};
   if(f&&(f!==f0||t!==t0))C[id]=[f,t];
   if(bTouched&&bf&&(bf!==bf0||bt!==bt0))C[nid]=[bf,bt];else if(!bTouched)delete C[nid];
   if(!Object.keys(C).length)delete ed.cells[ck];
   try{localStorage.setItem("drEd",JSON.stringify(ed))}catch(e){alert("ফোনে জমানো যায়নি");return}bump();alert("✓ সংরক্ষিত। অ্যাপ নতুন করে লোড হচ্ছে।");location.reload()};
  rs.onclick=()=>{if(!confirm("এই আয়াতের আপনার বদল (আরবি ও অর্থ দুটোই) মুছে মূল অবস্থায় ফিরবে?"))return;const ed=EDO();if(ed.cells&&ed.cells[ck]){delete ed.cells[ck][id];delete ed.cells[ck][nid]}try{localStorage.setItem("drEd",JSON.stringify(ed))}catch(e){}bump();location.reload()};
  act.append(sv,rs);b.append(act);
  const n=Object.values(EDO().cells||{}).reduce((q,c)=>q+Object.keys(c).length,0);
  const ex=el("div","ed-r");const cp=el("button","ed-k","📋 সব বদল কপি ("+bn2(n)+"টি)"),dl=el("button","ed-k","⬇ ফাইল");cp.type=dl.type="button";
  cp.onclick=async()=>{const j=JSON.stringify(EDO());try{await navigator.clipboard.writeText(j);cp.textContent="✓ কপি হয়েছে"}catch(e){const ta=document.createElement("textarea");ta.value=j;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");cp.textContent="✓ কপি হয়েছে"}catch(x){cp.textContent="কপি হয়নি"}ta.remove()}};
  dl.onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(EDO(),null,1)],{type:"application/json"})),A=document.createElement("a");A.href=u;A.download="dr-edits.json";A.click();setTimeout(()=>URL.revokeObjectURL(u),3000)};
  ex.append(cp,dl);b.append(ex,el("div","ed-n","কপি করা লেখা আমাকে (Claude) পাঠালে আমি রিপোতে স্থায়ী করে দেব, তখন সবার অ্যাপে ঠিক হবে। এই বদল শুধু এই ফোনে থাকে।"));
  document.body.appendChild(m);paintW();paintB();
 };
})();
})();
