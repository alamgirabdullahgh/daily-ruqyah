#!/usr/bin/env node
/* লুকানো অংশের এনক্রিপ্ট/ডিক্রিপ্ট টুল। ইমেইল-পাসওয়ার্ড কোডে নেই; env থেকে পড়ে।
   এনক্রিপ্ট:  BADHA_EMAIL=.. BADHA_PASS=.. node tools/badha-lock.js enc data.json   → badha.enc.js
   ডিক্রিপ্ট:  BADHA_EMAIL=.. BADHA_PASS=.. node tools/badha-lock.js dec             → badha.dec.json (গোপন, কমিট করবেন না)
   অ্যাপের lock.js-এর সঙ্গে একই: PBKDF2-SHA256 (600000) + AES-256-GCM */
const c=require("crypto"),fs=require("fs"),path=require("path");
const ITER=600000,OUT=path.join(__dirname,"..","badha.enc.js");
const email=(process.env.BADHA_EMAIL||"").trim().toLowerCase(),pass=process.env.BADHA_PASS||"";
if(!email||!pass){console.error("BADHA_EMAIL ও BADHA_PASS দিন");process.exit(1)}
const key=salt=>c.pbkdf2Sync(Buffer.from(email+"\n"+pass,"utf8"),salt,ITER,32,"sha256");
const mode=process.argv[2];
if(mode==="enc"){
 const pt=fs.readFileSync(process.argv[3]);
 const salt=c.randomBytes(16),iv=c.randomBytes(12),ci=c.createCipheriv("aes-256-gcm",key(salt),iv);
 const ct=Buffer.concat([ci.update(pt),ci.final(),ci.getAuthTag()]);
 fs.writeFileSync(OUT,"window.__drBadhaEnc="+JSON.stringify({v:1,i:ITER,s:salt.toString("base64"),n:iv.toString("base64"),c:ct.toString("base64")})+";\n");
 console.log("লেখা হয়েছে:",OUT,ct.length,"বাইট");
}else if(mode==="dec"){
 const m=fs.readFileSync(OUT,"utf8").match(/=(\{.*\});/s),o=JSON.parse(m[1]);
 const ct=Buffer.from(o.c,"base64"),d=c.createDecipheriv("aes-256-gcm",key(Buffer.from(o.s,"base64")),Buffer.from(o.n,"base64"));
 d.setAuthTag(ct.subarray(ct.length-16));
 fs.writeFileSync(path.join(__dirname,"..","badha.dec.json"),Buffer.concat([d.update(ct.subarray(0,ct.length-16)),d.final()]));
 console.log("ঠিক আছে: badha.dec.json");
}else{console.error("enc <json> বা dec");process.exit(1)}
