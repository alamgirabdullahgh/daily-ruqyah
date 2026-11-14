const V="dr-shell-v217";
// ডেইলি রুকিয়া — অফলাইনে অ্যাপ খোলার জন্য। আয়াতের বড় ডেটা অ্যাপ নিজেই (Cache API "rs-…") জমা রাখে, তাই এখানে শুধু অ্যাপের কাঠামো।

const SHELL=["./","index.html","style.css?v=74","app.js?v=55","home.js?v=19","alarm.js?v=12","amol.js?v=15","data/amol-guide.json?v=8","data/amol-struct.json?v=2","data/sunnah.json?v=1","data/sunnah.js?v=1","symptom.js?v=4","widget.js?v=30","boot.js?v=6","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","fonts/indopak-waqf-lazim.woff2","fonts/noto-sans-bengali-bengali-wght.woff2","fonts/noto-sans-bengali-latin-wght.woff2","data/lame.min.js?v=1","data/hadith-norm.js?v=2","data/hadith.js?v=15"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("dr-shell-")&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||u.origin!==location.origin)return;
 if(u.pathname.indexOf("/_capacitor_file_/")===0)return;                  // ফোনের ভেতরের অডিও ফাইল: সরাসরি, ক্যাশে নকল নয়
 if(/\/data\/(quran-|hadith-chunks)/.test(u.pathname))return;                 // বড় ডেটা: অ্যাপের নিজস্ব ক্যাশ
 e.respondWith(caches.open(V).then(async c=>{
  const hit=await c.match(r,{ignoreSearch:r.mode==="navigate"});
  const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>null);
  return hit||await net||(r.mode==="navigate"?c.match("index.html"):Response.error())}))});
