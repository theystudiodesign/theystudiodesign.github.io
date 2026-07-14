/* E3-peer en boucle avec DUMP complet au premier échec */
const http=require('http'),fs=require('fs'),path=require('path');
const { chromium } = require('playwright-core');
const { createMockSupabase } = require('./mock-supabase');
const ROOT=path.join(__dirname,'..'),APP_PORT=9071,MOCK_PORT=9072;
const APP=`http://localhost:${APP_PORT}/gestion/`,MOCK=`http://localhost:${MOCK_PORT}`;
const VENDOR=path.join(__dirname,'vendor','supabase-esm.js');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const srv=http.createServer((req,res)=>{let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.writeHead(200,{'Content-Type':'text/html'});res.end(fs.readFileSync(f))}).listen(APP_PORT);
(async()=>{
  const {server:mock,state}=createMockSupabase();mock.listen(MOCK_PORT);
  const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'});
  const ctx=await browser.newContext();
  await ctx.addInitScript(()=>sessionStorage.setItem('they_unlocked','1'));
  await ctx.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await ctx.route('**/supabase-config.js*',r=>r.fulfill({status:200,contentType:'text/javascript',body:`window.SUPABASE_CONFIG={url:"${MOCK}",anonKey:"mock-anon-key-0123456789abcdef"};`}));
  await ctx.route('**/cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',r=>r.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(VENDOR,'utf8')}));
  const A=await ctx.newPage();A.on('dialog',d=>d.accept());
  await A.goto(APP,{waitUntil:'networkidle'});await sleep(400);
  await A.evaluate(()=>{DB.clients[0].notes='réel';save()});
  await A.waitForSelector('#authGate');await A.fill('#ag_email','race@t.ma');await A.fill('#ag_pass','secret123');
  await A.click('text=Créer le compte');await A.waitForSelector('#authGate',{state:'detached'});await sleep(700);
  const B=await ctx.newPage();await B.goto(APP,{waitUntil:'networkidle'});await sleep(1000);
  const cloudNames=()=>{const u=state.users.get('race@t.ma');return [...state.rows.get(u.id).clients.values()].map(r=>r.name)};
  const dump=async(who,tag)=>{
    console.log('  ── DUMP '+tag+' ──');
    console.log('   cloud:',JSON.stringify(cloudNames()));
    console.log('   A.mem:',JSON.stringify(await A.evaluate(()=>DB.clients.map(c=>c.name))));
    console.log('   B.mem:',JSON.stringify(await B.evaluate(()=>DB.clients.map(c=>c.name))));
    console.log('   LS   :',JSON.stringify(await A.evaluate(()=>JSON.parse(localStorage.getItem('crm_gestion_clients_v1')).clients.map(c=>c.name))));
    console.log('   sync :',await A.evaluate(()=>localStorage.getItem('they_sync_v1')));
    console.log('   wlog (12 dernières):');
    (await A.evaluate(()=>JSON.parse(localStorage.getItem('they_wlog')||'[]').slice(-12))).forEach(e=>console.log('     '+e.t.slice(11,23),e.tab,e.type,(e.info||'').slice(0,70),'→',(e.after||[]).join('|')));
  };
  for(let i=1;i<=6;i++){
    const NAME='R'+i;
    await A.evaluate(n=>{openClientModal();c_name.value=n;saveClient()},NAME);
    await B.evaluate(()=>{try{DB.clients[0].notes='z'+Date.now();save()}catch(e){}});
    await sleep(2400);
    await A.reload({waitUntil:'networkidle'});await sleep(1600);
    const okC=await A.evaluate(n=>DB.clients.some(c=>c.name===n),NAME);
    console.log(`it${i} create:`,okC?'✓':'✗');
    if(!okC){await dump(A,'ÉCHEC CREATE it'+i);break}
    await A.evaluate(n=>{const c=DB.clients.find(x=>x.name===n);delClient(c.id)},NAME);
    await B.evaluate(()=>{try{DB.clients[0].notes='z'+Date.now();save()}catch(e){}});
    await sleep(2400);
    await A.reload({waitUntil:'networkidle'});await sleep(1600);
    const okD=await A.evaluate(n=>!DB.clients.some(c=>c.name===n),NAME);
    console.log(`it${i} delete:`,okD?'✓':'✗');
    if(!okD){await dump(A,'ÉCHEC DELETE it'+i);break}
  }
  await browser.close();srv.close();mock.close();
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
