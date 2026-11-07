#!/usr/bin/env node
// ব্যবহার: node tools/treat-marking/show.js [সংখ্যা=15] [শুরুর আইডি যেমন 2:102]
// এখনো মার্ক-না-হওয়া আয়াত (worklist.json অনুযায়ী) নম্বর-সহ দেখায়: আরবি শব্দ, শব্দার্থ, বাংলা অনুবাদ, কোন বিষয়ে এসেছে।
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..','..');
const WL=JSON.parse(fs.readFileSync(path.join(__dirname,'worklist.json'),'utf8'));
const done=new Set();
const mdir=path.join(__dirname,'marks');
for(const f of fs.readdirSync(mdir).filter(x=>x.endsWith('.json')))for(const m of JSON.parse(fs.readFileSync(path.join(mdir,f),'utf8')).marks||[])for(const w of m.w)done.add(m.id+':'+w);
const n=+process.argv[2]||15,from=process.argv[3];
const ch={};const get=(k,s)=>ch[k+s]||(ch[k+s]=JSON.parse(fs.readFileSync(path.join(R,'data','quran-chunks',k,s+'.json'),'utf8')));
const TRK=new Set([6,11,15,17,21,24,29,31,44,48,114]);
let cnt=0,started=!from;
for(const v of WL){
  if(!started){if(v.id===from)started=true;else continue}
  const pend=v.ws.filter(x=>!done.has(v.id+':'+x.w)&&!x.curated);
  if(!pend.length)continue;
  const ar=get('a',v.s)[v.a-1].split(' '),gl=(get('w',v.s)[v.a-1]||'').split('|');
  const tr=(TRK.has(v.s)?get('c',v.s):get('b',v.s))[v.a-1];
  console.log('════ '+v.id+'  (শব্দ '+v.N+')  মিলেছে: '+pend.map(x=>x.w+(x.auto?'[auto '+x.auto.join('-')+']':'')).join(', '));
  console.log(ar.map((x,i)=>(i+1)+'.'+x).join(' '));
  console.log(gl.map((x,i)=>(i+1)+'.'+x).join(' | '));
  console.log('অনুবাদ: '+tr.split(' ').map((x,i)=>(i+1)+'.'+x).join(' '));
  console.log('বিষয়: '+v.terms.slice(0,4).join(' ; ')+(v.terms.length>4?' …':''));
  if(++cnt>=n)break;
}
const total=WL.reduce((a,v)=>a+v.ws.filter(x=>!x.curated).length,0);
console.log('\n[বাকি জোড়া (আয়াত+শব্দ): '+(total-[...done].filter(k=>true).length)+' / '+total+']');
