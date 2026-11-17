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
 const bPort=f?bnPortion(al,[f,t],aw.length,bw.length):null;let bHit=null;if(w){const r=alRange(al,w);if(r)bHit=[r[0],Math.min(r[1],bw.length-1)]}
 paint(tx,aw,aPort,aHit);paint(tb,bw,bPort,bHit);
 const ft=el("div","rs-vf"),rf=el("div","rs-vr");rf.append("সূরা ",el("span","rs-ar",SN[s-1])," — "+bn2(s)+":"+bn2(a));ft.append(rf);
 if(ref.ck&&window.__drEditOpen&&document.body.classList.contains("dr-unlocked")){const eb=el("button","ed-btn","✂ কাস্টমাইজ");eb.type="button";eb.onclick=()=>window.__drEditOpen({s,a,f:f||0,t:t||0,ck:ref.ck,id:ref.id,aw,cn:ref.cn});ft.append(eb)}
  box.append(tx,tb,ft);return box}

let DATA=null;
const EDO=()=>{try{return JSON.parse(localStorage.getItem("drEd")||"{}")||{}}catch(e){return{}}};
/* মালিকের ✂ কাস্টমাইজে বদলানো মার্ক (শুধু এই ফোনে): cells[ঘর]["b|সূরা:আয়াত"] বা ["m|<m-এর লেখা>"] = [শুরু-শব্দ, শেষ-শব্দ] */
function applyEd(D){const o=EDO().cells||{};for(const ck in o){const C=D.cells&&D.cells[ck];if(!C)continue;for(const id in o[ck]){const v=o[ck][id],ty=id[0],rest=id.slice(2);
  if(ty==="b"){const p=rest.split(":").map(Number),r=C.b.find(x=>x[0]===p[0]&&x[1]===p[1]);if(r){r[2]=v[0];r[3]=v[1]}}else{C.mp=C.mp||{};C.mp[rest]=v}}}return D}
const load=async()=>{if(DATA)return DATA;try{DATA=applyEd(await rsFetch(BASE+"axis-ayat.json?v=7"))}catch(e){DATA=null;throw e}return DATA};
/* "অবস্থান → শরীরে" ঘরের অডিওতে অঙ্গ ধরে ধরে আয়াত বাজে; অঙ্গের নাম ও আয়াত দৈনন্দিন রুকইয়াহর "শারীরিক → অঙ্গভিত্তিক" তালিকা (app.js এর ORG) থেকে আসে। শুধু দরকারের সময় লোড হয় */
let ORGS=[],ORGP=null;
const loadOrg=()=>Promise.resolve();/* অঙ্গ-প্রত্যঙ্গের তালিকা ও অঙ্গের আয়াত আর যোগ হয় না (ব্যবহারকারীর নির্দেশে বাদ); ORGS সব সময় খালি */
const isBodyCell=(c,n)=>c.name==="অবস্থান"&&n==="শরীরে";
const hasBody=id=>{const t=id[0];if(t==="g")return true;const p=id.slice(1).split(".").map(Number);return t==="r"?DATA.axes[p[0]].cols[p[1]].name==="অবস্থান":isBodyCell(DATA.axes[p[0]].cols[p[1]],DATA.axes[p[0]].cols[p[1]].opts[p[2]])};

function closePanel(R){R.__g=(R.__g||0)+1;R.querySelectorAll(".ax-p").forEach(x=>x.remove());R.querySelectorAll(".ax-c.on").forEach(x=>x.classList.remove("on"))}

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
 for(const r of C.b){const c=await verseCard({s:r[0],a:r[1],f:r[2],t:r[3],ck:key,id:"b|"+r[0]+":"+r[1],cn:G.cols[ci].opts[oi]},true).catch(()=>null);if(my!==R.__g)return;if(c)b.appendChild(c)}
 if(R.__mode==="resp")return;/* প্রতিক্রিয়া ভিত্তিক: প্রতিটি অপশনে শুধু একটি মৌলিক আয়াত; "বাকি আয়াত" শুধু চিকিৎসায় */
 const more=C.m.map(v=>{const p=v.split(":").map(Number),q=C.mp&&C.mp[v];return{s:p[0],a:p[1],w:p[2]||0,f:q?q[0]:0,t:q?q[1]:0,ck:key,id:"m|"+v,cn:G.cols[ci].opts[oi]}});
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

/* লক্ষণ ভিত্তিক রোগ নির্ণয় পাতার চার্টের একই ছক (সাতটি হেডিং, প্রতিটির নিচে অপশন) */
const AUL="🔊\nঅডিও",PDL="📄\nPDF";
const mkb=(cls,id,txt,lab)=>{const b=el("button",cls,txt==="🔊"?AUL:txt==="📄"?PDL:txt);b.type="button";b.dataset.s=id;b.setAttribute("aria-label",lab);return b};
function buildGroup(gi,g){const sec=el("section","ax-g zs");sec.dataset.slug=g.slug;
 {const h=el("h3","ax-h3");h.append(el("span",null,g.name),mkb("ax-pd ax-ga","g"+gi,"📄",g.name+" — PDF"),mkb("ax-au ax-ga","g"+gi,"🔊",g.name+" — অডিও"));sec.appendChild(h)}
 const tb=el("div","ax-tb");
 g.cols.forEach((c,ci)=>{const r=el("div","ax-r"),o=el("div","ax-ro");r.dataset.r=gi+"."+ci;
  c.opts.forEach((n,oi)=>{const k=gi+"."+ci+"."+oi,w=el("div","ax-cw"),b=el("button","ax-c",n);b.type="button";b.dataset.k=k;const cb=el("div","ax-cb");cb.append(mkb("ax-pd ax-mb","c"+k,"📄",n+" — PDF"),mkb("ax-au ax-mb","c"+k,"🔊",n+" — অডিও"));w.append(b,cb);o.appendChild(w)});
  if(o.children.length>2)o.classList.add("ax-3");const rh=el("div","ax-rh"),rb=el("div","ax-rb");rb.append(mkb("ax-pd ax-mb","r"+gi+"."+ci,"📄",c.name+" — PDF"),mkb("ax-au ax-mb","r"+gi+"."+ci,"🔊",c.name+" — অডিও"));rh.append(el("span","ax-rl",c.name),rb);r.append(rh,o);tb.appendChild(r)});
 sec.appendChild(tb);return sec}

/* সব ঘরের লেখা একই মাপে: পুরো চার্টের সবচেয়ে চাপা ঘরটা যে মাপে আঁটে, সব বাটনে সেই এক মাপ (দৃশ্যমান অবস্থায় মাপা যায়) */
function fitH(R){/* পুরো চার্ট এক স্ক্রিনে: নিচের নেভিগেশন বাদে যতটুকু জায়গা, তার চেয়ে লম্বা হলে ছোট করে আঁটানো */
 const gs=[...R.querySelectorAll(".ax-g:not([hidden])")];if(!gs.length||R.querySelector(".ax-p"))return;
 gs.forEach(g=>g.style.zoom="");const g=gs[0],r=g.getBoundingClientRect();if(!r.height)return;
 const avail=innerHeight-64-r.top,z=Math.max(.6,Math.min(1,avail/r.height));if(z<1)gs.forEach(x=>x.style.zoom=z.toFixed(3))}
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

/* ===== মালিকের ✂ কাস্টমাইজ: আয়াতের মার্ক (কোন শব্দ থেকে কোন শব্দ) ও অডিও-কাট (শুরু/শেষ সেকেন্ড) অ্যাপ থেকেই ঠিক করা। শুধু লগইন করা (dr-unlocked) অবস্থায় দেখা যায়; বদল শুধু এই ফোনে জমে (localStorage drEd) ও সাথে সাথে অ্যাপে কাজ করে; "কপি" দিয়ে সব বদল নিয়ে রিপোতে স্থায়ী করা যায় ===== */
(function(){
 if(!document.getElementById("edCss")){const s=document.createElement("style");s.id="edCss";s.textContent=".ed-btn{margin-top:6px;padding:7px 12px;border-radius:10px;border:1px solid #c9a227;background:transparent;color:inherit;font:inherit;font-size:14px;cursor:pointer}body:not(.dr-unlocked) .ed-btn{display:none!important}.ed-m{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.55);overflow:auto;padding:10px}.ed-b{background:var(--card-bg,#fff);color:var(--text-main,#111);border-radius:16px;padding:14px;max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:10px}.ed-b h4{margin:0;font-size:16px}.ed-ws{direction:rtl;line-height:2.3}.ed-w{display:inline-block;padding:2px 8px;margin:2px;border-radius:8px;border:1px solid #aaa;font-size:22px;cursor:pointer}.ed-w.on{background:#e8c25a;color:#000;border-color:#c9a227}.ed-r{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ed-r b{min-width:48px}.ed-v{min-width:64px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}.ed-k{padding:7px 10px;border-radius:10px;border:1px solid #999;background:transparent;color:inherit;font:inherit;font-size:14px;cursor:pointer}.ed-k.p{background:#2e7d32;color:#fff;border-color:#2e7d32}.ed-k.d{border-color:#c62828;color:#c62828}.ed-n{font-size:13px;opacity:.8}.ed-wv{position:relative;border-radius:10px;background:#1b1b1f;overflow:hidden;height:240px;touch-action:none;user-select:none;-webkit-user-select:none}.ed-wv canvas{display:block;width:100%;height:100%}.ed-live{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-variant-numeric:tabular-nums}.ed-cw{font-size:24px;direction:rtl;font-weight:700;min-width:80px;text-align:center}.ed-ct{font-weight:700;font-size:17px}.ed-wi{position:relative;height:100%}.ed-wi canvas{display:block;height:100%;touch-action:pan-x}.ed-h{position:absolute;top:14px;bottom:14px;width:30px;margin-left:-15px;display:flex;align-items:center;justify-content:center;touch-action:none;cursor:ew-resize;z-index:3}.ed-h i{display:block;width:12px;height:100%;background:#fff;border-radius:6px;position:relative}.ed-h i:after{content:'';position:absolute;left:5px;top:36%;bottom:36%;width:2px;background:#555;border-radius:1px}.ed-ph{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#fff;z-index:2;pointer-events:none}.ed-z{display:flex;gap:6px;align-items:center}";document.head.appendChild(s)}
 const DEF=()=>rsFetch(BASE+"audio-cuts.json?v=6").then(j=>j.cuts||{}).catch(()=>({}));
 const f3=x=>(Math.round(x*1000)/1000).toFixed(3);
 window.__drEditOpen=async function(o){
  if(!document.body.classList.contains("dr-unlocked"))return;
  const{s,a,ck,id,aw}=o;let f=o.f||0,t=o.t||0;const f0=f,t0=t;
  const ed0=EDO(),dc=await DEF(),key=()=>s+":"+a+":"+f+"-"+t;
  let T0=null,T1=null;const loadT=()=>{const v=(ed0.cuts&&ed0.cuts[key()])||dc[key()];if(v){T0=v[0];T1=v[1]}};loadT();
  const m=el("div","ed-m"),b=el("div","ed-b");m.appendChild(b);
  const close=()=>{try{window.__drCutStop&&window.__drCutStop()}catch(e){}m.remove()};
  const hd=el("div","ed-r");hd.append(el("h4",null,"✂ সূরা "+bn2(s)+":"+bn2(a)+(o.cn?" — "+o.cn:"")));const x=el("button","ed-k","✕");x.type="button";x.onclick=close;x.style.marginLeft="auto";hd.append(x);b.append(hd);
  b.append(el("div","ed-n","১) মার্ক: শুরু-শব্দ ও শেষ-শব্দে চাপুন (দুটো আলাদা শব্দে চাপলে মাঝেরটুকু সোনালি)। ২) অডিও: শুনে শুরু ও শেষ ঠিক করুন।"));
  const ws=el("div","ed-ws rs-ar");b.append(ws);const sel=el("div","ed-n");b.append(sel);
  const paintW=()=>{ws.textContent="";aw.forEach((w,i)=>{const c=el("span","ed-w"+(f&&i+1>=f&&i+1<=t?" on":""),w);c.onclick=()=>{if(f&&t&&f===t&&i+1!==f){f=Math.min(f,i+1);t=Math.max(t,i+1)}else{f=t=i+1}loadT();paintW();paintT()};ws.append(c)});sel.textContent=f?"মার্ক: শব্দ "+bn2(f)+" থেকে "+bn2(t)+(f!==f0||t!==t0?" (বদলানো)":""):"এই আয়াতে এখনো মার্ক নেই — শব্দে চাপুন"};
  const au=document.createElement("audio");au.controls=true;au.style.width="100%";let AB=null,OFF=false;
  const info=el("div","ed-n","অডিও আনা হচ্ছে…");
  let onT=()=>{};const rowT=(lab,get,set)=>{const r=el("div","ed-r");const v=el("span","ed-v","—");r.append(el("b",null,lab));
   [["−০.০৫",-.05],["−০.০১",-.01]].forEach(([n,d])=>{const k=el("button","ed-k",n);k.type="button";k.onclick=()=>{set(Math.max(0,(get()||0)+d));upd();onT()};r.append(k)});r.append(v);
   [["+০.০১",.01],["+০.০৫",.05]].forEach(([n,d])=>{const k=el("button","ed-k",n);k.type="button";k.onclick=()=>{set((get()||0)+d);upd();onT()};r.append(k)});
   const hr=el("button","ed-k","⌖ প্লেয়ারের এখানে");hr.type="button";hr.onclick=()=>{set(au.currentTime||0);upd();onT()};r.append(hr);
   const upd=()=>{v.textContent=get()==null?"—":f3(get())};upd();r.__u=upd;return r};
  const r0=rowT("শুরু",()=>T0,v=>T0=v),r1=rowT("শেষ",()=>T1,v=>T1=v);
  const wv=el("div");const paintT=()=>{r0.__u();r1.__u();onT()};
  const pv=el("div","ed-r");const mk=(txt,mode)=>{const k=el("button","ed-k",txt);k.type="button";k.onclick=async()=>{if(!AB||T0==null||T1==null||T1<=T0){info.textContent="আগে শুরু ও শেষ বসান";return}try{const d=await window.__drCutPrev(AB,T0,T1,mode);info.textContent="▶ বাজছে ("+f3(d)+" সে.)"}catch(e){info.textContent="বাজানো যায়নি"}};return k};
  const stp=el("button","ed-k","⏹");stp.type="button";stp.onclick=()=>{window.__drCutStop&&window.__drCutStop();try{au.pause()}catch(e){}};
  pv.append(mk("▶ কাটা অংশ",""),mk("▶ শেষের ২ সেকেন্ড","tail"),mk("▶ শুরুর ২ সেকেন্ড","head"),stp);
  b.append(info,au,wv,r0,r1,pv,el("div","ed-n","শুরুতে কাটা অংশ পুরোটা পর্দায় ধরে (⤢ চাপলে আবার সব দেখায়)। সাদা হ্যান্ডেল ধরে টানুন। লাল দাগ মাঝে স্থির: তরঙ্গ সরিয়ে লাল দাগ ঠিক জায়গায় আনুন, তারপর ✂ শুরু এখানে / ✂ শেষ এখানে চাপুন (ভিডিও-এডিটরের স্প্লিটের মতো)। রেখায় আঙুল রাখলেই বাজা থামে; আঙুল টানলে রেখা সরে আর সেই জায়গার শব্দ শোনা যায়। সাদা ফ্রেমের দুই পাশের হ্যান্ডেল টানলেও শব্দ শোনা যায় (শুরুর হ্যান্ডেলে তার ঠিক পরের শব্দ, শেষের হ্যান্ডেলে তার ঠিক আগের শব্দ)। দুই আঙুলে চিমটি কেটে জুম করুন। ওপরের সোনালি ঘরে বর্তমান শব্দ দেখায়। ⌖ চাপলে লাল দাগের জায়গা শুরু/শেষ হয়। ▶ বোতামগুলো হুবহু অ্যাপের কাটা-অডিও বাজায় (গতিসহ)।"));
  const act=el("div","ed-r"),sv=el("button","ed-k p","💾 সংরক্ষণ"),rs=el("button","ed-k d","↩ আগের অবস্থায়");sv.type=rs.type="button";
  const bump=()=>{try{localStorage.setItem("drEdV",Date.now().toString(36))}catch(e){}};
  sv.onclick=()=>{if(!f){alert("আগে শব্দে চেপে মার্ক ঠিক করুন");return}
   const ed=EDO();ed.cuts=ed.cuts||{};ed.cells=ed.cells||{};
   if(T0!=null&&T1!=null){if(T1-T0<0.1){alert("শেষ অবশ্যই শুরুর পরে হতে হবে");return}ed.cuts[key()]=[+f3(T0),+f3(T1)]}
   if(f!==f0||t!==t0){ed.cells[ck]=ed.cells[ck]||{};ed.cells[ck][id]=[f,t]}
   try{localStorage.setItem("drEd",JSON.stringify(ed))}catch(e){alert("ফোনে জমানো যায়নি");return}bump();alert("✓ সংরক্ষিত। অ্যাপ নতুন করে লোড হচ্ছে — এরপর সব অডিও-PDF-এ নতুন বদল কাজ করবে।");location.reload()};
  rs.onclick=()=>{if(!confirm("এই আয়াতের আপনার বদল মুছে মূল অবস্থায় ফিরবে?"))return;const ed=EDO();if(ed.cuts)delete ed.cuts[key()];if(ed.cuts)delete ed.cuts[s+":"+a+":"+f0+"-"+t0];if(ed.cells&&ed.cells[ck])delete ed.cells[ck][id];try{localStorage.setItem("drEd",JSON.stringify(ed))}catch(e){}bump();location.reload()};
  act.append(sv,rs);b.append(act);
  const n=(Object.keys(ed0.cuts||{}).length)+(Object.values(ed0.cells||{}).reduce((q,c)=>q+Object.keys(c).length,0));
  const ex=el("div","ed-r");const cp=el("button","ed-k","📋 সব বদল কপি ("+bn2(n)+"টি)"),dl=el("button","ed-k","⬇ ফাইল");cp.type=dl.type="button";
  cp.onclick=async()=>{const j=JSON.stringify(EDO());try{await navigator.clipboard.writeText(j);cp.textContent="✓ কপি হয়েছে"}catch(e){const ta=document.createElement("textarea");ta.value=j;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");cp.textContent="✓ কপি হয়েছে"}catch(x){cp.textContent="কপি হয়নি"}ta.remove()}};
  dl.onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(EDO(),null,1)],{type:"application/json"})),A=document.createElement("a");A.href=u;A.download="dr-edits.json";A.click();setTimeout(()=>URL.revokeObjectURL(u),3000)};
  ex.append(cp,dl);b.append(ex,el("div","ed-n","কপি করা লেখা আমাকে (Claude) পাঠালে আমি রিপোতে স্থায়ী করে দেব, তখন সবার অ্যাপে ঠিক হবে। এই বদল শুধু এই ফোনে থাকে।"));
  document.body.appendChild(m);paintW();paintT();
  try{const r=await window.__drEdAud(s,a);AB=r.ab;OFF=r.off;au.src=URL.createObjectURL(new Blob([AB.slice(0)],{type:"audio/mpeg"}));
   /* তরঙ্গ-রেখা: সাদা হ্যান্ডেল টেনে শুরু/শেষ, রেখায় চাপলে প্লেয়ার সেখানে যায়, সাদা দাগ = এখন যেখানে বাজছে */
   try{const AC=window.AudioContext||window.webkitAudioContext,cx=new AC({sampleRate:22050}),dd=await cx.decodeAudioData(AB.slice(0));const ch=dd.getChannelData(0),sr=dd.sampleRate,dur=dd.duration;try{cx.close()}catch(e){}
    /* ১ মিলিসেকেন্ডের শিখর-মান (দ্রুত আঁকার জন্য) */
    const NB=Math.ceil(dur*1000)+1,pk=new Float32Array(NB),spm=sr/1000;for(let i=0;i<NB;i++){const i0=Math.floor(i*spm),i1=Math.min(ch.length,Math.floor((i+1)*spm));let m=0;for(let j=i0;j<i1;j++){const v=ch[j]<0?-ch[j]:ch[j];if(v>m)m=v}pk[i]=m}
    let pps=320,ct=0,dirty=true,scrub=false,alive=true;
    const cv=document.createElement("canvas"),live=el("div","ed-live"),ct0=el("span","ed-ct","০.০০০"),cw=el("span","ed-cw","—"),cs=el("span","ed-n","");live.append(ct0,cw,cs);
    wv.append(live,el("div","ed-wv"));const box=wv.lastChild;box.append(cv);
    const zb=el("div","ed-z"),zi=el("button","ed-k","🔍＋"),zo=el("button","ed-k","🔍−"),pp=el("button","ed-k p","▶ চালাও / ⏸ থামাও"),zt=el("span","ed-n","");zi.type=zo.type=pp.type="button";zb.append(pp,zo,zi,zt);wv.append(zb);
    const tb=el("div","ed-z"),bS=el("button","ed-k","✂ শুরু এখানে"),bE=el("button","ed-k","✂ শেষ এখানে"),bF=el("button","ed-k","⤢ সব দেখাও");bS.type=bE.type=bF.type="button";tb.append(bS,bE,bF);wv.append(tb);
    const strip=x=>x.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,"");
    /* শব্দের আনুমানিক সময়: অক্ষর-সংখ্যার অনুপাতে, মার্ক+কাটা থেকে মাপ নিয়ে */
    const wtimes=()=>{const n=aw.length;if(!n)return[];const w=aw.map(x=>strip(x).length+.6),cum=[0];w.forEach((v,i)=>cum.push(cum[i]+v));
     let rate,orig;if(f&&t>=f&&T0!=null&&T1!=null&&T1>T0){rate=(T1-T0)/(cum[t]-cum[f-1]);orig=T0-cum[f-1]*rate}else{rate=Math.max(.05,(dur-.4)/cum[n]);orig=.15}
     return w.map((v,i)=>[orig+cum[i]*rate,orig+cum[i+1]*rate])};
    const curTime=()=>(!au.paused&&!scrub)?au.currentTime:ct;
    const stepFor=()=>{const L=[.01,.02,.05,.1,.2,.5,1,2,5];for(const v of L)if(v*pps>=64)return v;return 5};
    const fmt=x=>(x<0?0:x).toFixed(3);
    const draw=()=>{const R=box.getBoundingClientRect(),W=Math.max(200,Math.round(R.width)),H=Math.max(120,Math.round(R.height)),dp=Math.min(2,window.devicePixelRatio||1);
     if(cv.width!==W*dp||cv.height!==H*dp){cv.width=W*dp;cv.height=H*dp}
     const g=cv.getContext("2d");g.setTransform(dp,0,0,dp,0,0);g.fillStyle="#1b1b1f";g.fillRect(0,0,W,H);
     const c=curTime(),cx0=W/2,tL=c-cx0/pps,tR=c+cx0/pps,X=x=>cx0+(x-c)*pps;
     const TOP=30,WT=30,wy=TOP,wh=WT,my=TOP+WT+8,mh=H-my-6,mid=my+mh/2;
     const hasR=T0!=null&&T1!=null&&T1>T0;
     /* কাটা অংশের পেছনের রং */
     if(hasR){g.fillStyle="rgba(176,123,224,.16)";g.fillRect(X(T0),my-4,X(T1)-X(T0),mh+8)}
     /* তরঙ্গ */
     for(let x=0;x<W;x++){const tt=tL+x/pps,tt2=tL+(x+1)/pps;let i0=Math.floor(tt*1000),i1=Math.max(i0+1,Math.ceil(tt2*1000));if(i1<0||i0>=NB)continue;let m=0;for(let i=Math.max(0,i0);i<Math.min(NB,i1);i++)if(pk[i]>m)m=pk[i];
      const hh=Math.max(1,Math.sqrt(m)*(mh/2-2));const inr=hasR&&tt>=T0&&tt<=T1;g.fillStyle=inr?"#b07be0":"#6a6a76";g.fillRect(x,mid-hh,1,hh*2)}
     /* সময়ের দাগ: বড় দাগে সংখ্যা, ছোট দাগে ধাপ */
     const st=stepFor();g.font="11px sans-serif";g.textBaseline="top";
     const sub=st/5;if(sub*pps>=7){g.fillStyle="#4a4a55";for(let k=Math.ceil(tL/sub);k*sub<=tR;k++){if(k<0)continue;const x=Math.round(X(k*sub));g.fillRect(x,0,1,5)}}
     for(let k=Math.ceil(tL/st);k*st<=tR;k++){if(k<0)continue;const tt=k*st,x=Math.round(X(tt));g.fillStyle="#8a8a96";g.fillRect(x,0,1,9);g.fillStyle="#b9b9c4";g.textAlign="left";g.fillText(tt.toFixed(st<.1?2:st<1?1:0),x+3,12)}
     /* শব্দের ফালি */
     const wt=wtimes();g.textBaseline="middle";g.textAlign="center";const fam=getComputedStyle(ws).fontFamily;let curI=-1;const pt=(mode==="h")?(which?T1:T0):c;
     wt.forEach((r,i)=>{if(pt>=r[0]&&pt<r[1])curI=i;const x0=X(r[0]),x1=X(r[1]);if(x1<0||x0>W)return;const on=f&&i+1>=f&&i+1<=t,isC=i===curI;
      g.fillStyle=isC?"#c9a227":on?"#5b3b86":"#2e2e36";g.fillRect(x0+1,wy,Math.max(1,x1-x0-2),wh);g.fillStyle=isC?"#111":"#eee";g.font="19px "+fam;
      if(x1-x0>26)g.fillText(aw[i],(x0+x1)/2,wy+wh/2+1,x1-x0-4)});
     /* ক্লিপের সাদা ফ্রেম + দুই পাশে সাদা হ্যান্ডেল (ভিডিও-এডিটরের মতো) */
     const rr=(x,y,w,h,r)=>{g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h)};
     if(hasR){const xa=X(T0),xb=X(T1),y0=my-5,hh2=mh+10;g.strokeStyle="#fff";g.lineWidth=2;g.strokeRect(xa,y0,xb-xa,hh2);
      const hnd=(x,left,lab)=>{g.fillStyle=(mode==="h"&&which===(left?0:1))?"#ffe27a":"#fff";rr(left?x-17:x,y0,17,hh2,5);g.fill();g.fillStyle="#222";g.fillRect((left?x-9:x+7),y0+hh2/2-9,2,18);g.fillStyle="#fff";g.font="bold 11px sans-serif";g.textBaseline="top";g.textAlign=left?"left":"right";g.fillText(lab,left?x+4:x-4,y0+4)};
      hnd(xa,true,"শুরু");hnd(xb,false,"শেষ")}
     else{[[T0,"শুরু"],[T1,"শেষ"]].forEach(([v,lab])=>{if(v==null)return;const x=X(v);g.fillStyle="#fff";g.fillRect(x-1,my-6,2,mh+12);g.font="bold 11px sans-serif";g.textAlign="left";g.textBaseline="bottom";g.fillText(lab,x+3,my-6)})}
     /* মাঝের স্থির প্লেহেড */
     g.fillStyle="#ff4d4d";g.fillRect(cx0-1,0,2,H);g.beginPath();g.moveTo(cx0-7,0);g.lineTo(cx0+7,0);g.lineTo(cx0,9);g.fill();
     ct0.textContent=(mode==="h"?(which?"শেষ ":"শুরু ")+fmt(pt):fmt(c))+" / "+fmt(dur)+" সে.";cw.textContent=curI>=0?aw[curI]:"—";
     cs.textContent=(curI>=0?"শব্দ "+bn2(curI+1)+" (আনুমানিক)":"শব্দের বাইরে/নীরবতা")+(hasR?(pt<T0?" · কাটার আগে":pt>T1?" · কাটার পরে":" · কাটার ভেতরে"):"");
     zt.textContent="১ সে. = "+Math.round(pps)+"px";dirty=false;return};
    onT=()=>{dirty=true};
    /* স্ক্রাবিং-শব্দ: টানার সময়ই সেই জায়গার ছোট টুকরো বাজে (Web Audio) */
    let gx=null,lastG=0;
    const grain=(tt,end)=>{try{const nw=performance.now();if(nw-lastG<40)return;lastG=nw;if(!gx){gx=new(window.AudioContext||window.webkitAudioContext)()}if(gx.state==="suspended")gx.resume();
     const L=.16;let st=end?tt-L:tt-.03;st=Math.max(0,Math.min(dur-.03,st));const sr2=gx.createBufferSource(),gn=gx.createGain();sr2.buffer=dd;sr2.connect(gn);gn.connect(gx.destination);
     const n0=gx.currentTime;gn.gain.setValueAtTime(0,n0);gn.gain.linearRampToValueAtTime(1,n0+.012);gn.gain.setValueAtTime(1,n0+L-.03);gn.gain.linearRampToValueAtTime(0,n0+L);sr2.start(n0,st,L)}catch(e){}};
    /* আঙুল: হ্যান্ডেল ধরলে হ্যান্ডেল টানা; রেখায় আঙুল রাখলেই বাজা থামে ও টানলে সরে (শব্দসহ); দুই আঙুলে জুম */
    let mode=null,sx=0,sc0=0,wasPlay=false,which=0,lastX=0,moved=0,t0d=0,pts=new Map(),pd0=0,pps0=0;
    const tOfX=x=>curTime()+(x-box.getBoundingClientRect().left-box.clientWidth/2)/pps;
    const setH=cx=>{const v=Math.max(0,Math.min(dur,tOfX(cx)));if(which===0)T0=v;else T1=v;r0.__u();r1.__u();grain(v,which===1);dirty=true};
    box.addEventListener("pointerdown",e=>{e.preventDefault();try{box.setPointerCapture(e.pointerId)}catch(x){}pts.set(e.pointerId,e.clientX);
     if(pts.size===2){const v=[...pts.values()];pd0=Math.abs(v[0]-v[1])||1;pps0=pps;if(mode==="s"){mode="z"}else if(mode==null){mode="z";wasPlay=!au.paused;if(wasPlay)au.pause();ct=curTime()}else if(mode==="h"){mode="z"}return}
     const R=box.getBoundingClientRect(),x=e.clientX-R.left,c=curTime(),X=v=>R.width/2+(v-c)*pps;
     let best=null,bd=40;[[T0,0],[T1,1]].forEach(([v,i])=>{if(v==null)return;const d=Math.abs(X(v)+(i===0?-8:8)-x);if(d<bd){bd=d;best=i}});
     wasPlay=!au.paused;if(wasPlay)au.pause();ct=c;scrub=true;lastX=e.clientX;moved=0;t0d=performance.now();sx=e.clientX;sc0=c;
     if(best!=null){mode="h";which=best;grain(which===0?T0:T1,which===1)}else{mode="s"}dirty=true});
    box.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,e.clientX);lastX=e.clientX;
     if(mode==="z"&&pts.size>=2){const v=[...pts.values()];pps=Math.max(12,Math.min(4000,pps0*(Math.abs(v[0]-v[1])||1)/pd0));dirty=true;return}
     if(!mode)return;moved=Math.max(moved,Math.abs(e.clientX-sx));
     if(mode==="h")setH(e.clientX);
     else if(mode==="s"){ct=Math.max(0,Math.min(dur,sc0-(e.clientX-sx)/pps));try{au.currentTime=ct}catch(x){}grain(ct,false);dirty=true}});
    const up=e=>{pts.delete(e.pointerId);if(mode==="z"){if(pts.size<2){mode=null;scrub=false;if(wasPlay)au.play().catch(()=>{});dirty=true}return}
     if(!mode)return;
     if(mode==="s"&&moved<6&&performance.now()-t0d<400){/* ছোট চাপ: ওই জায়গায় যাও, থামা অবস্থায় থাকো */const R=box.getBoundingClientRect(),tt=Math.max(0,Math.min(dur,tOfX(e.clientX)));ct=tt;try{au.currentTime=tt}catch(x){}grain(tt,false);wasPlay=false}
     scrub=false;mode=null;if(wasPlay)au.play().catch(()=>{});dirty=true};
    box.addEventListener("pointerup",up);box.addEventListener("pointercancel",up);
    box.addEventListener("wheel",e=>{e.preventDefault();ct=Math.max(0,Math.min(dur,curTime()+(e.deltaX||e.deltaY)/pps));try{au.currentTime=ct}catch(x){}grain(ct,false);dirty=true},{passive:false});
    const zoom=k=>{pps=Math.max(12,Math.min(4000,pps*k));dirty=true};zi.onclick=()=>zoom(1.6);zo.onclick=()=>zoom(1/1.6);
    pp.onclick=()=>{if(au.paused)au.play().catch(()=>{});else au.pause()};
    au.addEventListener("seeked",()=>{if(!scrub)ct=au.currentTime;dirty=true});au.addEventListener("pause",()=>{ct=au.currentTime;dirty=true});
    /* প্রতি ফ্রেমে: বাজলে তরঙ্গ নিজে সরে (প্লেহেড মাঝে স্থির) */
    let lastTs=0;const loop=ts=>{if(!alive||!document.body.contains(m)){alive=false;return}const dt=Math.min(.05,lastTs?(ts-lastTs)/1000:.016);lastTs=ts;if(mode==="h"){const R=box.getBoundingClientRect(),x=lastX-R.left,Z=36;let v=0;if(x<Z)v=-(Z-Math.max(0,x))/Z*200;else if(x>R.width-Z)v=(x-(R.width-Z))/Z*200;if(v){ct=Math.max(0,Math.min(dur,ct+v*dt/pps));setH(lastX)}}if(!au.paused||dirty)draw();requestAnimationFrame(loop)};
    const fit=()=>{const W=Math.max(200,box.getBoundingClientRect().width||340);if(T0!=null&&T1!=null&&T1>T0){const sp=T1-T0;pps=Math.max(12,Math.min(900,(W-110)/sp));ct=(T0+T1)/2}else{pps=Math.max(12,Math.min(900,(W-60)/dur));ct=dur/2}ct=Math.max(0,Math.min(dur,ct));try{au.currentTime=ct}catch(e){}dirty=true};fit();
    bF.onclick=()=>{au.pause();fit()};
    bS.onclick=()=>{au.pause();const v=Math.max(0,Math.min(dur,curTime()));T0=v;if(T1!=null&&T1<=v+.05)T1=null;r0.__u();r1.__u();dirty=true};
    bE.onclick=()=>{au.pause();const v=Math.max(0,Math.min(dur,curTime()));T1=v;if(T0!=null&&T0>=v-.05)T0=null;r0.__u();r1.__u();dirty=true};
    au.addEventListener("loadedmetadata",()=>{try{au.currentTime=ct}catch(e){}dirty=true});requestAnimationFrame(loop);
    window.addEventListener("resize",()=>{dirty=true})}catch(e){console.error(e);wv.append(el("div","ed-n","তরঙ্গ-রেখা আঁকা যায়নি — নিচের সংখ্যা ও ± বোতাম দিয়ে করুন"))}

   info.textContent=OFF?"✓ অফলাইন অডিও প্যাক থেকে (অ্যাপের কাটার সময় এই অডিওর সাথেই মেলে)":"⚠ অফলাইন অডিও প্যাক চালু নেই — এটা ইন্টারনেটের অডিও, এর সময় অ্যাপের কাটার সময়ের সাথে মেলে না। আগে অডিও প্যাক নামান, তারপর সময় ঠিক করুন; মার্ক ঠিক করা যাবে।"}
  catch(e){info.textContent="অডিও আনা যায়নি"}
 }
})();
})();
