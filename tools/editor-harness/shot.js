const {chromium,devices}=require('playwright');const {spawn}=require('child_process');
(async()=>{
const srv=spawn('python3',['-m','http.server','8123'],{cwd:process.cwd(),stdio:'ignore'});await new Promise(r=>setTimeout(r,1500));
const b=await chromium.launch();const c=await b.newContext({...devices['Pixel 5'],locale:'bn'});const p=await c.newPage();
p.on('console',m=>console.log('console:',m.text()));p.on('pageerror',e=>console.log('pageerror:',e.message));
const U='http://localhost:8123/tools/editor-harness/harness.html';
await p.goto(U);await p.evaluate(()=>{try{localStorage.setItem('drEd',JSON.stringify({cuts:{'2:109:2-5':[2.0,6.5]}}))}catch(e){}});await p.reload();
await p.waitForSelector('.ed-wv canvas',{timeout:15000});await p.waitForTimeout(1500);
await p.screenshot({path:'out/1-open.png',fullPage:true});
const box=await p.locator('.ed-wv').boundingBox();console.log('box',JSON.stringify(box));
const cdp=await c.newCDPSession(p);
const touch=async(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((x,i)=>({x,y:box.y+box.height*0.55,id:i}))});
// drag left handle: it should be near left; try x=box.x+60
await touch('touchStart',[box.x+55]);for(let i=1;i<=8;i++)await touch('touchMove',[box.x+55+i*8]);await p.screenshot({path:'out/2-dragging-handle.png',fullPage:true});await touch('touchEnd',[]);
await p.waitForTimeout(300);await p.screenshot({path:'out/3-after-drag.png',fullPage:true});
// scrub from empty area
await touch('touchStart',[box.x+box.width/2]);for(let i=1;i<=8;i++)await touch('touchMove',[box.x+box.width/2-i*15]);await touch('touchEnd',[]);
await p.screenshot({path:'out/4-after-scrub.png',fullPage:true});
await b.close();srv.kill();})().catch(e=>{console.error(e);process.exit(1)});
