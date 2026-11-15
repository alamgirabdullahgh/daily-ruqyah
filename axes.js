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
const AUL="🔊\nঅডিও",PDL="📄\nPDF";
const mkb=(cls,id,txt,lab)=>{const b=el("button",cls,txt==="🔊"?AUL:txt==="📄"?PDL:txt);b.type="button";b.dataset.s=id;b.setAttribute("aria-label",lab);return b};
function buildGroup(gi,g){const sec=el("section","ax-g zs");sec.dataset.slug=g.slug;
 {const h=el("h3","ax-h3");h.append(el("span",null,g.name),mkb("ax-pd ax-ga","g"+gi,"📄",g.name+" — PDF"),mkb("ax-au ax-ga","g"+gi,"🔊",g.name+" — অডিও"));sec.appendChild(h)}
 const tb=el("div","ax-tb");
 g.cols.forEach((c,ci)=>{const r=el("div","ax-r"),o=el("div","ax-ro");r.dataset.r=gi+"."+ci;
  c.opts.forEach((n,oi)=>{if(n==="উভয়")return;const k=gi+"."+ci+"."+oi,w=el("div","ax-cw"),b=el("button","ax-c",n);b.type="button";b.dataset.k=k;const cb=el("div","ax-cb");cb.append(mkb("ax-pd ax-mb","c"+k,"📄",n+" — PDF"),mkb("ax-au ax-mb","c"+k,"🔊",n+" — অডিও"));w.append(b,cb);o.appendChild(w)});
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
function regCell(gi,ci,oi){const key=gi+"."+ci+"."+oi,C=DATA.cells[key];if(!C)return null;
 const seen=new Set(),ks=[];
 [...C.b.map(r=>[r[0],r[1]]),...C.m.map(v=>{const p=v.split(":").map(Number);return[p[0],p[1]]})].forEach(k=>{const id=k[0]+":"+k[1];if(!seen.has(id)){seen.add(id);ks.push(k)}});
 return ks.length?{ks}:null}
/* স্কোপ: "g0" = পুরো হেডিং · "r0.1" = একটি সারি (যেমন ধরন) · "c0.1.0" = একটি ঘর (যেমন মুগ্ধতা)। আয়াত-তালিকা ক্রমানুসারে, "উভয়" বাদ */
function scope(id,sec){const t=id[0],p=id.slice(1).split(".").map(Number),gi=p[0],G=DATA.axes[gi],list=[],cells=[];
 G.cols.forEach((c,ci)=>c.opts.forEach((n,oi)=>{if(n==="উভয়")return;if(t==="r"&&ci!==p[1])return;if(t==="c"&&(ci!==p[1]||oi!==p[2]))return;
  const r=regCell(gi,ci,oi);if(!r)return;const from=list.length;r.ks.forEach(k=>list.push(k));
  cells.push({b:sec?sec.querySelector('.ax-c[data-k="'+gi+"."+ci+"."+oi+'"]'):null,name:c.name+" › "+n,from,to:list.length})}));
 const cat="অক্ষ "+G.name+(t!=="g"?" "+G.cols[p[1]].name:"")+(t==="c"?" "+G.cols[p[1]].opts[p[2]]:"");
 const seen=new Set(),ks=[];list.forEach(k=>{const i=k[0]+":"+k[1];if(!seen.has(i)){seen.add(i);ks.push(k)}});
 if(window.__drXKeys)window.__drXKeys(cat,ks);
 return{G,list,cells,cat,gi}}
function stopPlay(R){const st=R&&R.__pl;if(!st)return;st.stop=true;R.__pl=null;try{if(st.a){st.a.pause();st.a.ontimeupdate=st.a.onended=st.a.onplay=null}}catch(e){}
 R.querySelectorAll(".ax-now").forEach(x=>x.classList.remove("ax-now"));R.querySelectorAll(".ax-live").forEach(x=>x.remove());
 R.querySelectorAll(".ax-au.on").forEach(b=>{b.classList.remove("on");b.textContent=AUL})}
/* একবার জোড়া হলে মনে থাকে: দ্বিতীয়বার সাথে সাথে বাজে */
const GM={};
function gMerge(id,sc){if(GM[id])return GM[id];
 const ent={out:el("div"),marks:null,note:()=>{}};
 ent.p=(async()=>{await window.__drGroupAudio(sc.list,ent.out,t=>ent.note(t),sc.cat,m=>{ent.marks=m});if(!ent.out.querySelector("audio"))throw new Error("noaudio");return ent})().catch(e=>{delete GM[id];throw e});
 GM[id]=ent;return ent}
const rowEl=(sec,id)=>sec.querySelector('.ax-r[data-r="'+id.slice(1).split(".").slice(0,2).join(".")+'"]');
const anchorOf=(sec,id)=>id[0]==="g"?sec.querySelector("h3"):rowEl(sec,id);
/* অডিও: চাপলে পাতার সাজ বদলায় না; তৈরির অগ্রগতি ও ফল নিচের ভাসমান বক্সে, তৈরি হলে নিজে ডাউনলোড হয় */
const ABLOB={};
async function playSeq(R,id,sec,btn){
 if(!window.__drGroupAudio||!window.__drDockSave)return;
 const sc=scope(id,sec);if(!sc.list.length)return;
 const nm=sc.cat.replace(/^অক্ষ\s+/,"").replace(/\s+/g," ").trim(),title=nm.replace(/ /g," › ");
 window.__drDockSave("audio","|"+title,async note=>{
  if(ABLOB[id])return{blob:ABLOB[id],name:nm.replace(/\s+/g,"_")+".mp3"};
  const ent=gMerge(id,sc);ent.note=t=>note("⏳ "+t);note("⏳ অডিও প্রস্তুত হচ্ছে…");
  await ent.p;const a=ent.out.querySelector("audio");if(!a)throw new Error("noaudio");
  const blob=await(await fetch(a.src)).blob();ABLOB[id]=blob;return{blob,name:nm.replace(/\s+/g,"_")+".mp3"}})}
function openPdf(R,id,sec){const sc=scope(id,sec);window.__drHomePdf&&window.__drHomePdf("x",sc.cat,null)}
/* অ্যাপ চালু হলে ব্যাকগ্রাউন্ডে সবকিছুর অডিও ও PDF আগে থেকে তৈরি: আগে প্রতিটি ঘর, তারপর সারি, শেষে পুরো হেডিং (আয়াতের এনকোড ভাগ হয়, তাই পরের দুটো দ্রুত) */
window.__drAxPre=async()=>{await load();const sl=()=>new Promise(r=>setTimeout(r,300)),ids=[];
 DATA.axes.forEach((g,gi)=>{g.cols.forEach((c,ci)=>c.opts.forEach((n,oi)=>{if(n!=="উভয়")ids.push("c"+gi+"."+ci+"."+oi)}));g.cols.forEach((c,ci)=>ids.push("r"+gi+"."+ci));ids.push("g"+gi)});
 const all=ids.map(id=>({id,sc:scope(id,null)})).filter(x=>x.sc.list.length);
 if(window.__drGroupAudio)for(const x of all){try{await gMerge(x.id,x.sc).p}catch(e){console.error(e)}await sl()}
 if(window.__drHomePdfPre)for(const x of all){try{await window.__drHomePdfPre(x.sc.cat)}catch(e){console.error(e)}await sl()}};

const SLUG={nazar:1,jadu:1,jin:1};
/* R = চার্ট বসানোর ঘর: #axBody (পুরো পাতা, শিরোনামসহ) অথবা হোমের ট্যাবের ভেতরের .ax-home (শুধু চার্ট) */
async function mount(R,slug,full,title){if(!R)return;
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
window.__drAxes=(slug,title)=>mount($("axBody"),slug,true,title);
window.__drAxesMount=(R,slug)=>mount(R,slug,false);
window.__drAxesFit=R=>fit(R);
})();
