/* গবেষণার মৌলিক নীতিমালা — অ্যাপের একমাত্র উৎস। সার্চের ওপরের বক্স এখান থেকেই আঁকা হয়।
   দুটি নীতিই সম্পূর্ণ অ্যাপে প্রযোজ্য। নীতি বদলাতে হলে আগে এই ফাইল, তারপর কোড। */
window.__drPrinData=[
 {n:"১",t:"আয়াত নির্বাচনের তিন ধাপ",steps:[
  "সমস্যা সম্পর্কিত সবগুলো আয়াত বের করা",
  "সেখান থেকে মৌলিক আয়াত বের করা",
  "সেটা থেকে মৌলিক অংশ বের করা"
 ]},
 {n:"২",t:"সাতটি অক্ষে ভাগ",b:"আয়াতগুলো সাতটি অক্ষে ভাগ করা থাকবে।",btn:{label:"সাতটি অক্ষ",hash:"#diag"}}
];
(function(){
 var box=document.getElementById("drPrin"),D=window.__drPrinData;if(!box||!D)return;
 var mk=function(tag,css,txt){var e=document.createElement(tag);if(css)e.style.cssText=css;if(txt!=null)e.textContent=txt;return e};
 box.textContent="";
 box.appendChild(mk("div","font-weight:800;font-size:17px;color:var(--accent);margin-bottom:8px","গবেষণার মৌলিক নীতিমালা"));
 D.forEach(function(P,i){
  var d=mk("div","text-align:left;margin:0 0 6px;padding-top:6px"+(i?";border-top:1px solid var(--border-light,#cfdcd3)":""));
  d.appendChild(mk("div","font-weight:800;font-size:15.5px;color:var(--primary);padding:2px 0","মৌলিক নীতি "+P.n+": "+P.t));
  if(P.steps)P.steps.forEach(function(s,k){d.appendChild(mk("div","font-size:15px;line-height:1.8;color:var(--text-main);margin:4px 0 0","ধাপ "+["১","২","৩"][k]+": "+s))});
  if(P.b)d.appendChild(mk("div","font-size:15px;line-height:1.8;color:var(--text-main);margin:4px 0 0",P.b));
  if(P.btn){var b=mk("button","margin:6px 0 2px;padding:8px 16px;border:1.5px solid var(--primary);border-radius:12px;background:var(--card-bg,#fff);color:var(--primary);font:inherit;font-weight:800;font-size:15.5px;cursor:pointer",P.btn.label+" ›");b.type="button";b.onclick=function(){location.hash=P.btn.hash;setTimeout(function(){var z=document.getElementById("za");if(z)z.scrollIntoView()},400)};d.appendChild(b)}
  box.appendChild(d)});
})();
