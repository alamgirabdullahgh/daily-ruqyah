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
 box.append(tx,tb,ft);return box}

let DATA=null;
const load=async()=>DATA||(DATA=await rsFetch(BASE+"axis-ayat.json?v=1").catch(e=>{DATA=null;throw e}));

function closePanel(R){R.__g=(R.__g||0)+1;R.querySelectorAll(".ax-p").forEach(x=>x.remove());R.querySelectorAll(".ax-c.on").forEach(x=>x.classList.remove("on"))}

async function openCell(btn){const key=btn.dataset.k,[gi,ci,oi]=key.split(".").map(Number),G=DATA.axes[gi],C=DATA.cells[key];
 const R=btn.closest(".ax-root");closePanel(R);const my=R.__g;btn.classList.add("on");
 const sec=btn.closest(".ax-g"),pn=el("div","ax-p");
 const hd=el("div","ax-ph"),x=el("button","ax-x","✕");x.type="button";x.setAttribute("aria-label","বন্ধ করুন");x.onclick=()=>closePanel(R);
 hd.append(el("span",null,G.name+" › "+G.cols[ci].name+" › "+G.cols[ci].opts[oi]),x);
 pn.append(hd);
 const lg=el("div","ax-lg");lg.append(el("span","rs-gold","সোনালি অংশ")," = মৌলিক অংশ");pn.appendChild(lg);
 sec.appendChild(pn);
 if(C&&window.__drXKeys){const cat="অক্ষ "+G.name+" "+G.cols[ci].name+" "+G.cols[ci].opts[oi],seen=new Set(),ks=[];
  [...C.b.map(r=>[r[0],r[1]]),...C.m.map(v=>{const p=v.split(":").map(Number);return[p[0],p[1]]})].forEach(k=>{const id=k[0]+":"+k[1];if(!seen.has(id)){seen.add(id);ks.push(k)}});
  window.__drXKeys(cat,ks);
  const act=el("div","ax-act"),hp=el("div","ax-hp"),ha=el("div","ax-hp");hp.hidden=ha.hidden=true;
  const bp=el("button","ax-ab","📄 PDF"),ba=el("button","ax-ab","🔊 অডিও");bp.type=ba.type="button";
  bp.onclick=()=>window.__drHomePdf&&window.__drHomePdf("x",cat,hp);ba.onclick=()=>window.__drHomeAudio&&window.__drHomeAudio("x",cat,ha);
  act.append(bp,ba);pn.append(act,hp,ha)}
 if(!C){pn.appendChild(el("div","ax-n","এই ঘরের আয়াত এখনো যোগ হয়নি।"));return}
 const b=el("div","rs-v");pn.appendChild(b);
 for(const r of C.b){const c=await verseCard({s:r[0],a:r[1],f:r[2],t:r[3]},true).catch(()=>null);if(my!==R.__g)return;if(c)b.appendChild(c)}
 const more=C.m.map(v=>{const p=v.split(":").map(Number);return{s:p[0],a:p[1],w:p[2]||0}});
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
function buildGroup(gi,g){const sec=el("section","ax-g zs");sec.dataset.slug=g.slug;{const h=el("h3","ax-h3"),ga=el("button","ax-ga","🔊");ga.type="button";ga.setAttribute("aria-label",g.name+" — অডিও");h.append(el("span",null,g.name),ga);sec.appendChild(h)}
 const tb=el("div","ax-tb");g.cols.forEach((c,ci)=>{const r=el("div","ax-r"),o=el("div","ax-ro");c.opts.forEach((n,oi)=>{if(n==="উভয়")return;const b=el("button","ax-c",n);b.type="button";b.dataset.k=gi+"."+ci+"."+oi;o.appendChild(b)});r.append(el("div","ax-rh",c.name),o);tb.appendChild(r)});
 sec.appendChild(tb);return sec}

/* সব ঘরের লেখা একই মাপে: পুরো চার্টের সবচেয়ে চাপা ঘরটা যে মাপে আঁটে, সব বাটনে সেই এক মাপ (দৃশ্যমান অবস্থায় মাপা যায়) */
function fit(R){const rows=[...R.querySelectorAll(".ax-g:not([hidden]) .ax-ro")].filter(o=>o.children[0]&&o.children[0].clientWidth);
 if(rows.length){const all=rows.flatMap(o=>[...o.children]);let s=17;all.forEach(b=>b.style.fontSize=s+"px");while(s>5&&all.some(b=>b.scrollWidth>b.clientWidth)){s-=.25;all.forEach(b=>b.style.fontSize=s+"px")}}
 const hs=[...R.querySelectorAll(".ax-g:not([hidden]) .ax-rh")].filter(h=>h.clientWidth);
 if(hs.length){let s=15;hs.forEach(h=>h.style.fontSize=s+"px");while(s>6&&hs.some(h=>h.scrollWidth>h.clientWidth)){s-=.25;hs.forEach(h=>h.style.fontSize=s+"px")}}}

/* ===== হেডিংয়ের পাশের অডিও: ওই বিষয়ের ঘরগুলো ক্রমানুসারে (ধরন → মুগ্ধতা, হিংসা → উৎস …) এই পাতাতেই বাজে; যে ঘর বাজছে সেখানে জ্বলজ্বলে ফোঁটা ===== */
function regCell(gi,ci,oi){const key=gi+"."+ci+"."+oi,C=DATA.cells[key],G=DATA.axes[gi];if(!C)return null;
 const seen=new Set(),ks=[];
 [...C.b.map(r=>[r[0],r[1]]),...C.m.map(v=>{const p=v.split(":").map(Number);return[p[0],p[1]]})].forEach(k=>{const id=k[0]+":"+k[1];if(!seen.has(id)){seen.add(id);ks.push(k)}});
 return ks.length?{ks}:null}
function stopPlay(R){const st=R&&R.__pl;if(!st)return;st.stop=true;R.__pl=null;try{if(st.a){st.a.pause();st.a.ontimeupdate=st.a.onended=st.a.onplay=null}}catch(e){}
 R.querySelectorAll(".ax-now").forEach(x=>x.classList.remove("ax-now"));R.querySelectorAll(".ax-live").forEach(x=>x.remove());
 R.querySelectorAll(".ax-ga.on").forEach(b=>{b.classList.remove("on");b.textContent="🔊"})}
/* একটি হেডিংয়ের সব ঘরের আয়াত একটাই অডিওতে জোড়া (একবার হলে মনে থাকে, দ্বিতীয়বার সাথে সাথে বাজে) */
function gMerge(R,gi,G,list){R.__gm=R.__gm||{};if(R.__gm[gi])return R.__gm[gi];
 const ent={out:el("div"),marks:null,note:()=>{}};
 ent.p=(async()=>{await window.__drGroupAudio(list,ent.out,t=>ent.note(t),G.name+" সব",m=>{ent.marks=m});if(!ent.out.querySelector("audio"))throw new Error("noaudio");return ent})().catch(e=>{delete R.__gm[gi];throw e});
 R.__gm[gi]=ent;return ent}
async function playGroup(R,sec,gi,btn){const same=R.__pl&&R.__pl.gi===gi;stopPlay(R);if(same)return;
 if(!window.__drGroupAudio)return;
 const G=DATA.axes[gi],list=[],cells=[];
 G.cols.forEach((c,ci)=>c.opts.forEach((n,oi)=>{if(n==="উভয়")return;const r=regCell(gi,ci,oi);if(!r)return;const from=list.length;r.ks.forEach(k=>list.push(k));cells.push({b:sec.querySelector('.ax-c[data-k="'+gi+"."+ci+"."+oi+'"]'),name:c.name+" › "+n,from,to:list.length})}));
 if(!list.length)return;
 const st={gi,stop:false,a:null};R.__pl=st;btn.classList.add("on");btn.textContent="⏹";
 const bar=el("div","ax-live"),tx=el("div","ax-lt"),nt=el("div","ax-ln"),hb=el("div");bar.append(tx,nt,hb);sec.querySelector("h3").after(bar);
 tx.textContent="▶ "+G.name+" — সব "+bn2(cells.length)+"টি ঘর একসাথে";nt.textContent="⏳ অডিও প্রস্তুত হচ্ছে…";
 const ent=gMerge(R,gi,G,list);ent.note=t=>{if(R.__pl===st)nt.textContent="⏳ "+t};
 try{await ent.p}catch(e){console.error(e);if(R.__pl===st){nt.textContent="অডিও তৈরি করা যায়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন";btn.classList.remove("on");btn.textContent="🔊";R.__pl=null}return}
 if(st.stop||R.__pl!==st)return;
 nt.remove();hb.appendChild(ent.out);
 const a=ent.out.querySelector("audio");let mk=ent.marks||[];st.a=a;
 const cellOf=i=>{for(let k=0;k<cells.length;k++)if(i>=cells[k].from&&i<cells[k].to)return k;return -1};
 let cur=-2;
 const upd=()=>{if(!mk.length&&a.duration)mk=list.map((_,i)=>({i,t:(i+1)/list.length*a.duration}));if(!mk.length)return;
  const t=a.currentTime+.03;let k=mk.findIndex(m=>m.t>t);if(k<0)k=mk.length-1;const c=cellOf(mk[k].i);if(c<0||c===cur)return;cur=c;
  R.querySelectorAll(".ax-now").forEach(x=>x.classList.remove("ax-now"));const C=cells[c];
  if(C.b){C.b.classList.add("ax-now");const r=C.b.getBoundingClientRect();if(r.top<60||r.bottom>innerHeight-60)C.b.scrollIntoView({behavior:"smooth",block:"center"})}
  tx.textContent="▶ "+G.name+" › "+C.name+"  ("+bn2(c+1)+"/"+bn2(cells.length)+")"};
 a.ontimeupdate=upd;a.onplay=upd;a.onended=()=>{if(R.__pl===st)stopPlay(R)};
 try{a.currentTime=0;await a.play()}catch(e){}
 upd()}

const SLUG={nazar:1,jadu:1,jin:1};
/* R = চার্ট বসানোর ঘর: #axBody (পুরো পাতা, শিরোনামসহ) অথবা হোমের ট্যাবের ভেতরের .ax-home (শুধু চার্ট) */
async function mount(R,slug,full,title){if(!R)return;
 if(!R.dataset.ready){if(R.__ld)return;R.__ld=1;R.textContent="";R.appendChild(el("div","ax-info","লোড হচ্ছে…"));
  try{await load()}catch(e){R.__ld=0;R.textContent="";const m=el("div","ax-info","চার্ট লোড করা যায়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন"),r=el("button","rs-more","আবার চেষ্টা");r.type="button";r.onclick=()=>mount(R,slug,full,title);R.append(m,r);return}
  R.textContent="";
  if(full){R.appendChild(el("h2","ax-t",title||"সাতটি অক্ষ"));}
  DATA.axes.forEach((g,gi)=>R.appendChild(buildGroup(gi,g)));
  R.addEventListener("click",e=>{const ga=e.target.closest&&e.target.closest(".ax-ga");if(ga){const sec=ga.closest(".ax-g");playGroup(R,sec,+DATA.axes.findIndex(g=>g.slug===sec.dataset.slug),ga);return}
   const b=e.target.closest&&e.target.closest(".ax-c");if(!b)return;if(b.classList.contains("on")){closePanel(R);return}
   openCell(b).then(()=>{const p=b.closest(".ax-g").querySelector(".ax-p");if(p&&p.getBoundingClientRect().top>innerHeight*.7)p.scrollIntoView({behavior:"smooth",block:"start"})}).catch(()=>{})});
  R.dataset.ready="1";R.__ld=0}
 stopPlay(R);closePanel(R);
 if(full){const tt=R.querySelector(".ax-t");if(tt)tt.textContent=title||"সাতটি অক্ষ"}
 const sl=SLUG[slug]?slug:"";R.querySelectorAll(".ax-g").forEach(g=>{g.hidden=!!sl&&g.dataset.slug!==sl});
 requestAnimationFrame(()=>requestAnimationFrame(()=>fit(R)))}
window.addEventListener("resize",()=>{const R=$("axBody");if(R&&R.dataset.ready&&R.offsetParent)fit(R)});
window.addEventListener("hashchange",()=>{if(!/^#(resp|treat|axes)/.test(location.hash))stopPlay($("axBody"))});
window.__drAxes=(slug,title)=>mount($("axBody"),slug,true,title);
window.__drAxesMount=(R,slug)=>mount(R,slug,false);
window.__drAxesFit=R=>fit(R);
})();
