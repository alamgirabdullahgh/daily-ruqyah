const V="dr-shell-v436";
// ডেইলি রুকিয়া — অফলাইনে অ্যাপ খোলার জন্য। আয়াতের বড় ডেটা অ্যাপ নিজেই (Cache API "rs-…") জমা রাখে, তাই এখানে শুধু অ্যাপের কাঠামো।

const SHELL=["./","index.html","style.css?v=159","data/search-resolve.js?v=1","app.js?v=161","home.js?v=42","alarm.js?v=22","note.js?v=5","note.css?v=5","badha.enc.js?v=4","badha.js?v=27","data/sunnah.json?v=1","data/sunnah.js?v=1","data/principles.js?v=7","data/response-signs.js?v=1","symptom.js?v=17","axes.js?v=56","data/axis-ayat.json?v=20","data/organ-axis.json?v=2","data/audio-cuts.json?v=12","data/organ-ranges.json?v=3","widget.js?v=33","boot.js?v=10","reveal.js?v=1","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","fonts/indopak-waqf-lazim.woff2","fonts/noto-sans-bengali-bengali-wght.woff2","fonts/noto-sans-bengali-latin-wght.woff2","data/lame.min.js?v=1","data/hadith-norm.js?v=2","data/hadith.js?v=17"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("dr-shell-")&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||u.origin!==location.origin)return;
 if(/[?&]_c=/.test(u.search))return;                                        // সংস্করণ-যাচাইয়ের অনুরোধ: সরাসরি নেট থেকে, ক্যাশে নকল নয়
 if(u.pathname.indexOf("/_capacitor_file_/")===0)return;                  // ফোনের ভেতরের অডিও ফাইল: সরাসরি, ক্যাশে নকল নয়
 if(/\/data\/(quran-|hadith-chunks)/.test(u.pathname))return;                 // বড় ডেটা: অ্যাপের নিজস্ব ক্যাশ
 /* ওয়েবসাইট (ব্লগের iframe) ও অ্যাপ সবসময় সর্বশেষ সংস্করণ দেখাবে: পাতা ও যেসব ফাইলের ঠিকানায় ?v= নেই সেগুলো আগে নেট থেকে (ব্রাউজারের HTTP ক্যাশ এড়িয়ে) আনে; নেট না থাকলে বা ৪ সেকেন্ডে সাড়া না এলে ক্যাশ থেকে (অফলাইন কাজ করে) */
 const fresh=r.mode==="navigate"||(!/[?&]v=/.test(u.search)&&/\.(html|js|css|json|webmanifest)$/.test(u.pathname));
 e.respondWith(caches.open(V).then(async c=>{
  if(fresh){
   const key=r.mode==="navigate"?r:r;
   try{
    const res=await Promise.race([fetch(r,{cache:"no-cache"}),new Promise((_,j)=>setTimeout(()=>j(0),4000))]);
    if(res&&res.ok){c.put(r,res.clone());return res}
   }catch(_){}
   return (await c.match(key,{ignoreSearch:r.mode==="navigate"}))||(r.mode==="navigate"?await c.match("index.html"):Response.error());
  }
  const hit=await c.match(r);
  const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>null);
  return hit||await net||Response.error()}))});
