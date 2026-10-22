
(() => {
"use strict";
// ---------- constants ----------
const STATUSES = ["Submitted","Waiting on parts","In build","Ready","On hold","Cancelled"];
// Every submitted order is in the queue. Ready is the last step: the cable is built and leaves the queue.
const OPEN = new Set(["Submitted","Waiting on parts","In build","On hold"]);
const WORK = OPEN;
const KNOWN_STATUS = new Set([...STATUSES, "Picked up"]);
const stClass = s => "s-" + (s||"archived").toLowerCase().replace(/[^a-z]/g,"");
const stLabel = s => s||"Archived";
const FIELDS = ["id","sub","need","flex","time","name","company","mas","phone","email","pay","qty","len","color","outDev","inDev","out","inp","notes","rep","status","quote","appr","apprDate"];
const LABELS = {sub:"Date submitted",need:"Date needed",flex:"No hard deadline",time:"Time needed",name:"Contact",company:"Company / show",mas:"CUST-ID",phone:"Phone",email:"Email",pay:"Payment / SO#",qty:"Quantity",len:"Length",color:"Cable color",outDev:"Output device",inDev:"Input device",out:"Output connectors",inp:"Input connectors",notes:"Notes",rep:"Sales rep",status:"Status",quote:"Quote",appr:"Approved by",apprDate:"Approved date"};

// Standard connector names in the house style. Shown first in every connector dropdown.
const STD_CONN = {
 "XLR":["XLR3M","XLR3F","XLR3M Low Profile","XLR3F Low Profile","XLR3M Low Profile RA","XLR3F Low Profile RA","XLR3M RA","XLR3F RA","XLR3M Straight","XLR3F Straight","XLR3F EMC","XLR4M","XLR4F","XLR5M","XLR5F","XLR7F"],
 "TA (mini XLR)":["TA3F","TA3M","TA4F","TA4M","TA5F","TA5M","TA6F","TA3F Low Profile","TA5F Low Profile","TA3F Low Profile RA","TA5F Low Profile RA","TA3F-RA-CT","TA5F-RA-CT","TA3F Straight","TA5F Straight"],
 "Hirose / Lemo":["Hirose 4M","Hirose 4F","Lemo 3M","Lemo 3F","Lemo 3M Push Pull","Lemo 4M","Lemo 5M","Lemo 5F","Lemo 6M","Lemo 9M"],
 "BNC / RF":["BNC M 50ohm","BNC M 50ohm RA","BNC M 75ohm","BNC M 75ohm RA","BNC F 50ohm","DIN 1.0/2.3","SMA M RA","SMA M Straight"],
 "1/8\" & 1/4\"":["1/8\" TRS M","1/8\" TRS M RA","1/8\" TRS M Locking","1/8\" TRS M RA Neutrik","1/8\" TRS M RA Molded","1/8\" TRS F","1/8\" TRS F Locking","1/8\" TS M","Tentacle 3.5mm RA","1/4\" TRS M","1/4\" TS M","1/4\" TRS F"],
 "Power / data":["2.1mm Locking RA Molded","2.1mm Short Locking RA","2.1mm Non Locking RA Molded","2.5mm Long Locking RA Molded","2.5mm Short Locking RA Molded","2.5mm BDS Locking RA","P-Tap M","D-Tap M","USB-C","USB-A","RJ45","DB25 M","DB25 F"]
};
const COLORS = ["Black","Grey","White","Red","Blue","Green","Yellow","Orange","Purple","Different color caps"];
const TIMES = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","6:00 PM"];
const QUICK_NOTES = ["Pin to pin","4 wire pin to pin","Balanced","Unbalanced","Summed (tip + ring tied)","-20 dB pad on each channel","-10 line level","Label \"TC >>>\"","Label \"Line level\"","Label \"Mic level\"","Different color caps","RG-174","RG-8X","4\" fan out"];
const ADDRESS = "330 West 38th Street, Ground Floor #105, New York, NY 10018";
const CONTACT = "(212) 629-9430 · service@gothamsound.com · gothamsound.com";

const LOGO_SVG = (cls="") => `<svg class="${cls}" viewBox="0 0 310 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gotham Sound & Communications, Inc."><path fill="currentColor" d="M38.60 142h2.8v6h-2.8zM44.00 142h2v10h-2zM46.00 142h2v10h-2zM50.00 146h2v4h-2zM56.00 144h2v6h-2zM62.00 136h2v18h-2zM66.00 138h2v16h-2zM68.00 138h2v16h-2zM72.00 118h2v36h-2zM74.00 118h2v36h-2zM78.00 122h2v30h-2zM82.00 140h2v14h-2zM84.00 126h2v32h-2zM88.00 132h2v24h-2zM90.00 132h2v24h-2zM94.00 120h2v34h-2zM96.00 134h2v17h-2zM102.00 134h2v22h-2zM106.00 110h2v46h-2zM110.00 108h2v44h-2zM112.00 116h2v35h-2zM116.00 110h2v52h-2zM118.00 114h2v41h-2zM122.00 138h2v14h-2zM128.00 126h2v30h-2zM132.00 120h2v48h-2zM134.00 116h2v43h-2zM138.00 86h2v78h-2zM140.00 116h2v39h-2zM144.00 36h2v126h-2zM148.00 16h2v150h-2zM150.00 0h2v157h-2zM154.00 12h2v154h-2zM156.00 24h2v133h-2zM160.00 40h2v126h-2zM162.00 102h2v55h-2zM166.00 118h2v40h-2zM170.00 116h2v46h-2zM172.00 138h2v17h-2zM176.00 120h2v44h-2zM178.00 128h2v27h-2zM182.00 86h2v76h-2zM186.00 86h2v74h-2zM188.00 94h2v61h-2zM192.00 90h2v72h-2zM194.00 130h2v25h-2zM198.50 136h2v24h-2zM200.50 140h2v14h-2zM206.00 116h2v34h-2zM210.00 120h2v36h-2zM216.00 130h2v28h-2zM218.00 140h2v13h-2zM222.00 140h2v14h-2zM224.00 114h2v37h-2zM230.00 112h2v38h-2zM232.00 142h2v8h-2zM234.00 122h2v27h-2zM238.00 140h2v14h-2zM240.00 140h2v14h-2zM244.50 130h2v20h-2zM247.50 130h2v20h-2zM252.00 134h2v18h-2zM258.60 144h2.8v8h-2.8zM264.00 142h2v10h-2zM266.00 142h2v10h-2zM273.40 144h3.2v6h-3.2z"/><text x="155" y="219" text-anchor="middle" textLength="304" lengthAdjust="spacing" font-family="Jost, Futura, 'Avenir Next', sans-serif" font-weight="600" font-size="57" fill="currentColor">GOTHAM</text><text x="155.5" y="245.5" text-anchor="middle" textLength="303" lengthAdjust="spacingAndGlyphs" font-family="Jost, Futura, 'Avenir Next', sans-serif" font-weight="700" font-size="16.5" fill="currentColor">SOUND &amp; COMMUNICATIONS, INC.</text></svg>`;

// ---------- helpers ----------
const $ = (s, el=document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad6 = n => String(n).padStart(6,"0");
const todayISO = () => { const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const addDays = (iso,n) => { const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const dow = iso => new Date(iso+"T12:00:00").getDay();
const fmtDate = iso => { if(!iso) return ""; const [y,m,d]=iso.split("-"); return `${+m}/${+d}/${y}`; };
const fmtDay = iso => { if(!iso) return ""; const d=new Date(iso+"T12:00:00"); return d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}); };
const fmtLong = iso => new Date(iso+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
const norm = s => String(s||"").toLowerCase().replace(/female/g,"f").replace(/male/g,"m").replace(/right angle/g,"ra").replace(/[^a-z0-9/".]+/g,"");
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function toast(msg){ document.querySelectorAll(".toast").forEach(x=>x.remove()); const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2600); }
function who(r){ return [r.name, r.company].filter(Boolean).join(" · ") || "(no name)"; }

// Connector "family key" so different spellings of the same part match (XLRM = 3p-XLRM = XLR3 Male).
const FAM = [["xlr",/xlr/],["ta",/\bta\s?-?\d|\btini|\bta\s?[mf]\b|^ta/],["hirose",/hirose|hriose|hirsoe/],["lemo",/lemo/],["bnc",/bnc/],["sma",/\bsma\b|sma[\s-]?[mr]/],["din",/din\s?1\.0/],["ptap",/p[\s-]?tap|powertap/],["dtap",/d[\s-]?tap/],["usbc",/usb[\s-]?c/],["usb",/usb/],["dc21",/2\.1\s?mm/],["dc25",/2\.5\s?mm|bds/],["mini",/1\/8|3\.5\s?mm|tentacle|\bmini\b/],["qtr",/1\/4/],["rj45",/rj[\s-]?45|ethercon/],["db25",/db[\s-]?25/]];
const keyCache = new Map();
function connKey(s){
  if(!s) return "";
  let k = keyCache.get(s); if(k!==undefined) return k;
  let t = s.toLowerCase().replace(/female/g," f ").replace(/male/g," m ");
  t = t.replace(/(xlr|bnc|ta|sma|trs|ts|tap|lemo|hirose)\s?(\d?)\s?([mf])(?![a-z])/g,"$1$2 $3 ");
  let fam=""; for(const [n,re] of FAM){ if(re.test(t)){ fam=n; break; } }
  if(!fam){ k=norm(s); keyCache.set(s,k); return k; }
  let m = t.match(/(\d+)\s?(?:p\b|p-|pin|-pin)/) || t.match(/(?:xlr|ta|lemo|hirose)\s?-?(\d)/);
  let pins = m ? m[1] : (fam==="xlr"?"3":fam==="hirose"?"4":"");
  let g = ""; const gm = t.match(/(?:^|[^a-z])([mf])(?![a-z])/); if(gm) g=gm[1];
  k = fam+pins+(g?":"+g:""); keyCache.set(s,k); return k;
}
function keyMatch(a,b){ if(!a||!b) return false; if(a===b) return true; const [fa,ga]=a.split(":"), [fb,gb]=b.split(":"); return fa===fb && (!ga||!gb); }

// ---------- state ----------
let HIST = [], HIST_BY = new Map(), VOCAB = null, CUSTS = [], COMPANIES = [];
const LIVE = new Map();           // id -> live doc (new orders + amended history)
let ALL = [], BY_ID = new Map();
let fs = null, me = null, canWrite = false, dbReady = false;
const S = { tab:"home", sel:null, mode:"view", draft:null, q:"", cust:null, shown:100, errors:{}, asOf:null, day:null };
const PARTS = { range:"all", sort:"type" };
const viewDay = () => S.asOf || todayISO();

// FormDocs orders have no status. Treat one as an open order when it was entered recently
// and its date needed is today or later; older ones count as done.
function autoOpen(r, today, minSub, maxNeed){
  if(KNOWN_STATUS.has(r.status)) return;
  if(r.need && r.need>=today && r.need<=maxNeed && (r.sub||"")>=minSub){ r._legacyStatus = r._legacyStatus ?? (r.status||""); r.status="Submitted"; r._auto=true; }
}
function rebuild(){
  BY_ID = new Map(HIST_BY);
  for(const [id,d] of LIVE) BY_ID.set(id, d);
  const today=todayISO(), minSub=addDays(today,-120), maxNeed=addDays(today,120);
  for(const r of BY_ID.values()) autoOpen(r, today, minSub, maxNeed);
  ALL = [...BY_ID.values()].sort((a,b)=> (b.sub||"").localeCompare(a.sub||"") || b.id.localeCompare(a.id));
}
function searchText(r){
  if(r._s) return r._s;
  r._s = [r.id,r.name,r.company,r.mas,r.phone,r.email,r.pay,r.outDev,r.inDev,(r.out||[]).join(" "),(r.inp||[]).join(" "),r.notes,r.rep,r.len,r.status,r.color].join(" ").toLowerCase();
  return r._s;
}
function custKey(n){ return String(n||"").toLowerCase().replace(/\s+/g," ").trim(); }

// ---------- local cache (IndexedDB, this computer only) ----------
const idb = (() => {
  let p = null;
  const open = () => p || (p = new Promise((res, rej) => { const r = indexedDB.open("gotham-cable-desk", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = (mode, fn) => open().then(d => new Promise((res, rej) => { const t = d.transaction("kv", mode); const st = t.objectStore("kv"); const out = fn(st); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }));
  return { get: k => tx("readonly", st => st.get(k)).catch(() => undefined), set: (k, v) => tx("readwrite", st => st.put(v, k)).catch(() => {}), clear: () => tx("readwrite", st => st.clear()).catch(() => {}) };
})();

// ---------- vocab, built from the history ----------
function buildVocab(){
  const group = (vals, minc) => { const g = new Map(); for(const raw of vals){ const v=(raw||"").trim(); if(!v) continue; const k=norm(v); if(!k) continue; let e=g.get(k); if(!e){ e={n:0,c:new Map()}; g.set(k,e); } e.n++; e.c.set(v,(e.c.get(v)||0)+1); }
    const out=[]; for(const e of g.values()){ if(e.n<minc) continue; let best="",bn=0; for(const [v,n] of e.c) if(n>bn){best=v;bn=n;} out.push([best,e.n]); } return out.sort((a,b)=>b[1]-a[1]); };
  const conns=[], devs=[], lens=[], reps=[], cos=[];
  for(const r of ALL){ (r.out||[]).forEach(x=>conns.push(x)); (r.inp||[]).forEach(x=>conns.push(x)); devs.push(r.outDev, r.inDev); lens.push(r.len); if(r.company) cos.push(r.company); if((r.sub||"")>="2025-01-01") reps.push((r.rep||"").toUpperCase()); }
  VOCAB = { conn: group(conns,6).slice(0,600), dev: group(devs,6).slice(0,600), len: group(lens,10), rep: group(reps,3) };
  COMPANIES = group(cos,1);
  const cm = new Map();
  for(let i=ALL.length-1;i>=0;i--){ const r=ALL[i]; if(!r.name) continue; const k=custKey(r.name); let c=cm.get(k); if(!c){ c={name:r.name,company:"",mas:"",phone:"",email:"",n:0,last:"",k}; cm.set(k,c); } c.n++; c.last=r.sub||c.last; c.name=r.name; if(r.company)c.company=r.company; if(r.mas)c.mas=r.mas; if(r.phone)c.phone=r.phone; if(r.email)c.email=r.email; }
  CUSTS = [...cm.values()].sort((a,b)=>b.n-a.n);
}

// ---------- data load ----------
function setLoading(msg){ $("#main").innerHTML = `<div class="loading">${esc(msg)}</div>`; }
async function loadHistory(){
  const meta = await fs.collection("meta").doc("history").get();
  if(!meta.exists) return false;
  const m = meta.data();
  let rows = null;
  const cached = await idb.get("history");
  if(cached && cached.version === m.version) rows = cached.rows;
  else {
    setLoading(`Downloading ${Number(m.count||0).toLocaleString()} past orders (first time on this computer)…`);
    const snap = await fs.collection("history_chunks").get();
    const chunks = snap.docs.map(d=>d.data()).sort((a,b)=>a.i-b.i);
    rows = []; for(const c of chunks) rows.push(...JSON.parse(c.rows));
    idb.set("history", {version:m.version, rows});
  }
  const F = m.fields;
  HIST = rows.map(a => { const o={}; F.forEach((f,i)=>{ const v=a[i]; if(v!==undefined && v!=="" && !(Array.isArray(v)&&!v.length)) o[f]=v; }); o.out=o.out||[]; o.inp=o.inp||[]; o._hist=true; return o; });
  HIST_BY = new Map(HIST.map(r=>[r.id,r]));
  return true;
}
async function start(){
  setLoading("Loading past orders…");
  try{
    const hasHist = await loadHistory();
    if(!hasHist) $("#import-note").hidden = false;
    // orders saved in this app: start from this computer's copy, then fetch only what changed since
    const cache = (await idb.get("live")) || {sync:"", docs:{}};
    for(const [id,d] of Object.entries(cache.docs)) LIVE.set(id, liveRec(id,d));
    const since = cache.sync ? new Date(new Date(cache.sync).getTime()-10*60000).toISOString() : "";
    let q = fs.collection("orders"); if(since) q = q.where("updatedAt",">",since);
    let first = true;
    q.onSnapshot(snap => {
      let changed=false;
      snap.docChanges().forEach(ch => { if(ch.type==="removed") return; const d=ch.doc.data(); if(!d.name) return; LIVE.set(ch.doc.id, liveRec(ch.doc.id,d)); cache.docs[ch.doc.id]=d; if((d.updatedAt||"")>cache.sync) cache.sync=d.updatedAt; changed=true; });
      if(changed){ idb.set("live", cache); }
      if(first){ first=false; dbReady=true; rebuild(); buildVocab(); route(); return; }
      if(changed){ rebuild(); renderAll(true); }
    }, err => { toast("Lost the connection to the order database. Reload the page."); });
  }catch(e){
    console.error(e);
    $("#main").innerHTML = `<div class="empty">Couldn't load orders${e&&e.code==="permission-denied"?": this account doesn't have access":""}. Reload to try again.</div>`;
  }
}
function liveRec(id, data){ const o = Object.assign({}, data); o.id = id; o.out=o.out||[]; o.inp=o.inp||[]; if(o.status==="Accepted") o.status="Submitted"; return o; }

// ---------- routing ----------
const TABS = ["home","queue","parts","orders"];
function route(){
  const h = (location.hash||"").slice(1);
  if(h.startsWith("o-")){ S.sel = h.slice(2); S.mode="view"; S.draft=null; }
  else if(h==="new"){ if(S.mode!=="new") startNew(); return; }
  else if(TABS.includes(h)){ S.tab=h; S.sel=null; S.mode="view"; S.draft=null; }
  else { S.tab="home"; S.sel=null; S.mode="view"; S.draft=null; }
  renderAll();
}
window.addEventListener("hashchange", route);
function go(hash){ if(location.hash !== "#"+hash) location.hash = hash; else route(); }

// ---------- order lists ----------
const byDue = (a,b)=>(a.need||"9").localeCompare(b.need||"9") || (a.time||"").localeCompare(b.time||"") || a.id.localeCompare(b.id);
const openItems = () => ALL.filter(r => OPEN.has(r.status)).sort(byDue);
const workItems = () => ALL.filter(r => WORK.has(r.status)).sort(byDue);


// Search: plain words must all appear; "quoted phrases" must appear exactly, as whole words.
function parseQuery(q){
  const phrases=[], terms=[]; const re=/"([^"]+)"|(\S+)/g; let m;
  while((m=re.exec(q))){ if(m[1]) phrases.push(m[1].trim().toLowerCase()); else if(m[2]&&m[2]!=='"') terms.push(m[2].replace(/"/g,"").toLowerCase()); }
  return { terms: terms.filter(Boolean), phrases: phrases.filter(Boolean).map(p=>new RegExp("(^|[^a-z0-9])"+escRe(p)+"($|[^a-z0-9])")) };
}
function filtered(){
  let rows = ALL;
  if(S.cust) rows = rows.filter(r => custKey(r.name)===S.cust || custKey(r.company)===S.cust);
  const {terms, phrases} = parseQuery(S.q);
  if(terms.length||phrases.length) rows = rows.filter(r => { const t=searchText(r); return terms.every(x=>t.includes(x)) && phrases.every(p=>p.test(t)); });
  return rows;
}
function buildLine(r){
  const o=(r.out||[]).filter(Boolean), i=(r.inp||[]).filter(Boolean);
  const os = o.length>1 ? `${o[0]} +${o.length-1}` : (o[0]||"—");
  const is = i.length>1 ? `${i[0]} +${i.length-1}` : (i[0]||"—");
  return `<b>${esc(os)}</b> → <b>${esc(is)}</b>`;
}
const devLine = r => (r.outDev||r.inDev) ? `${esc(r.outDev||"?")} → ${esc(r.inDev||"?")}` : "";
const flexBadge = r => r.flex ? `<span class="badge flex" title="No hard deadline: this date can slip">Flexible</span>` : "";
function statusSelect(r){
  if(!canWrite) return `<span class="pill ${stClass(r.status)}">${esc(stLabel(r.status))}</span>`;
  return `<select class="st-sel ${stClass(r.status)}" data-id="${esc(r.id)}" aria-label="Status for order ${esc(r.id)}">${STATUSES.map(s=>`<option value="${esc(s)}" ${r.status===s?"selected":""}>${esc(stLabel(s))}</option>`).join("")}</select>`;
}
// One order as a wide row: due, number, who, build, devices, quantity, status.
function qrow(r, opts={}){
  const day=viewDay(), late = r.need && r.need<day;
  return `<div class="qrow" data-id="${esc(r.id)}" role="button" tabindex="0">
    <span class="q-due mono ${late?"late":""}">${opts.date?esc(fmtDay(r.need)):""}${opts.date&&r.time?"<br>":""}${esc(r.time||"")}</span>
    <span class="q-id mono">#${esc(r.id)}</span>
    <span class="q-who"><b>${esc(r.name||"(no name)")}</b>${r.company?`<span>${esc(r.company)}</span>`:""}</span>
    <span class="q-build mono"><span>${buildLine(r)}</span><span>${esc([r.len, r.qty?"×"+r.qty:""].filter(Boolean).join(" · "))}</span></span>
    <span class="q-dev">${devLine(r)}</span>
    <span class="q-st">${flexBadge(r)}${statusSelect(r)}</span>
  </div>`;
}

// ---------- look-ahead ----------
function aheadHTML(){
  const d=viewDay(), t=todayISO(), b=(n,l)=>{ const v=addDays(t,n); return `<button class="stbtn" data-asof="${v}" aria-pressed="${d===v}">${l}</button>`; };
  return `<div class="ahead"><span class="hint">View as of</span>${b(0,"Today")}${b(1,"Tomorrow")}${b(2,"+2 days")}${b(7,"+1 week")}<input type="date" id="asof-date" class="mono" value="${d}" aria-label="Pick a date to view"></div>`;
}
function asOfBanner(){
  const el=$("#asof-bar"); if(!el) return;
  if(!S.asOf || S.asOf===todayISO() || S.sel || S.mode!=="view"){ el.hidden=true; return; }
  el.hidden=false;
  el.innerHTML = `<span>Looking ahead to <b>${esc(fmtLong(S.asOf))}</b>. Anything due before then shows as overdue.</span><button class="btn sm" data-asof="">Back to today</button>`;
}

// ---------- dashboard ----------
function renderHome(){
  const day=viewDay(), nxt=addDays(day,1);
  const work=workItems();
  const overdue=work.filter(r=>r.need&&r.need<day), dueDay=work.filter(r=>r.need===day), dueNext=work.filter(r=>r.need===nxt);
  const waiting=work.filter(r=>r.status==="Waiting on parts"), toBuild=work.filter(r=>r.status==="Submitted"||r.status==="In build");
  const parts=partsData().list.reduce((a,p)=>a+p.total,0);
  const isToday = day===todayISO();
  const tile=(n,l,goTo,cls="")=>`<button class="tile ${cls}" data-go="${goTo}"><b class="mono">${n}</b><span>${l}</span></button>`;
  // 2-week calendar from the view day
  const cells=[];
  for(let i=0;i<14;i++){
    const d=addDays(day,i), w=work.filter(r=>r.need===d), fl=w.filter(r=>r.flex).length, wk=dow(d)===0||dow(d)===6;
    cells.push(`<button class="cal-d ${wk?"wkend":""} ${i===0?"first":""} ${w.length?"":"zero"}" data-day="${d}" title="${esc(fmtLong(d))}">
      <span class="cal-h"><span>${new Date(d+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"})}</span><span class="mono">${new Date(d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></span>
      <b class="mono">${w.length}</b>
      <span class="cal-s">${w.length?`order${w.length===1?"":"s"}`:"&nbsp;"}${fl?` · ${fl} flexible`:""}</span>
    </button>`);
  }
  const list = (rows, empty) => rows.length ? rows.map(r=>qrow(r,{date:r.need&&r.need<day})).join("") : `<div class="hint pad">${empty}</div>`;
  $("#main").innerHTML = `
  <div class="page">
    <div class="page-head">
      <div><h1>${isToday?esc(fmtLong(day)):`Looking ahead: ${esc(fmtLong(day))}`}</h1><p class="hint">Hi ${esc((me&&me.name||"").split(" ")[0]||"there")}. Here's where the cable bench stands.</p></div>
      ${aheadHTML()}
    </div>
    <div class="tiles">
      ${tile(overdue.length,"overdue","queue",overdue.length?"bad":"")}
      ${tile(dueDay.length,isToday?"due today":"due "+fmtDay(day),"queue",dueDay.length?"warn":"")}
      ${tile(toBuild.length,"to build","queue")}
      ${tile(waiting.length,"waiting on parts","queue",waiting.length?"bad":"")}
      ${tile(parts,"connectors needed","parts")}
    </div>
    <section class="panel">
      <div class="panel-h"><h2>Next two weeks</h2><span class="hint">Open orders by date needed. Click a day to see its orders.</span></div>
      <div class="cal">${cells.join("")}</div>
    </section>
    <div class="cols2">
      <section class="panel"><div class="panel-h"><h2>${overdue.length?"Overdue and due ":"Due "}${isToday?"today":esc(fmtDay(day))}</h2><span class="mono hint">${overdue.length+dueDay.length}</span></div>${list([...overdue,...dueDay],"Nothing due.")}</section>
      <section class="panel"><div class="panel-h"><h2>Due ${isToday?"tomorrow":esc(fmtDay(nxt))}</h2><span class="mono hint">${dueNext.length}</span></div>${list(dueNext,"Nothing due.")}</section>
    </div>
    <p class="hint center">${ALL.length.toLocaleString()} orders on file. Search any past cable from the box at the top.</p>
  </div>`;
}

// ---------- open queue ----------
function renderQueue(){
  const day=viewDay(), work=workItems();
  let rows = S.day ? work.filter(r=>r.need===S.day) : work;
  const groups = new Map();
  for(const r of rows){
    const k = !r.need ? "none" : (r.need<day ? "overdue" : r.need);
    if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(r);
  }
  const label = k => k==="overdue" ? "Overdue" : k==="none" ? "No date" : k===day ? (day===todayISO()?"Today":fmtLong(k)) : k===addDays(day,1) ? (day===todayISO()?"Tomorrow · ":"")+fmtDay(k) : fmtLong(k);
  const keys=[...groups.keys()].sort((a,b)=> a==="overdue"?-1 : b==="overdue"?1 : a==="none"?1 : b==="none"?-1 : a.localeCompare(b));
  $("#main").innerHTML = `
  <div class="page">
    <div class="page-head">
      <div><h1>Open queue</h1><p class="hint">${work.length} open order${work.length===1?"":"s"}, soonest due first. Change a status right from the list.</p></div>
      ${aheadHTML()}
    </div>
    ${S.day?`<div class="chips"><span class="chip">Showing ${esc(fmtLong(S.day))} only <button data-clearday aria-label="Show all days">×</button></span></div>`:""}
    <section class="panel">
      ${rows.length ? keys.map(k=>`<div class="grp ${k==="overdue"?"overdue":""}"><span>${esc(label(k))}</span><span class="mono">${groups.get(k).length}</span></div>${groups.get(k).map(r=>qrow(r,{date:k==="overdue"||k==="none"})).join("")}`).join("") : `<div class="empty">${S.day?"No open orders due that day.":"No open orders right now."}</div>`}
    </section>
  </div>`;
}

// ---------- all orders ----------
function renderOrders(){
  const rows = filtered(), q = S.q.trim();
  const custName = S.cust ? (CUSTS.find(c=>c.k===S.cust)?.name || S.cust) : "";
  $("#main").innerHTML = `
  <div class="page">
    <div class="page-head">
      <div><h1>All orders</h1><p class="hint">${(q||S.cust)?`${rows.length.toLocaleString()} matching`:`${rows.length.toLocaleString()} orders, newest first`}. Type in the search box at the top. Put words in quotes for an exact match, like <span class="mono">"fox network"</span>.</p></div>
    </div>
    ${S.cust?`<div class="chips"><span class="chip">Customer: ${esc(custName)} <button id="clr-cust" aria-label="Clear customer filter">×</button></span></div>`:""}
    <section class="panel">
      <div class="orow ohead"><span>Order</span><span>Submitted</span><span>Customer</span><span>Build</span><span>Devices</span><span>Rep</span><span>Status</span></div>
      ${rows.length ? rows.slice(0,S.shown).map(r=>`<div class="orow" data-id="${esc(r.id)}" role="button" tabindex="0">
        <span class="mono">#${esc(r.id)}</span>
        <span class="mono muted">${esc(fmtDate(r.sub))}</span>
        <span class="o-who"><b>${esc(r.name||"(no name)")}</b>${r.company?`<span>${esc(r.company)}</span>`:""}</span>
        <span class="mono o-build"><span>${buildLine(r)}</span><span>${esc([r.len, r.qty?"×"+r.qty:""].filter(Boolean).join(" · "))}</span></span>
        <span class="muted o-dev">${devLine(r)}</span>
        <span class="muted">${esc(r.rep||"")}</span>
        <span>${r.status&&KNOWN_STATUS.has(r.status)?`<span class="pill ${stClass(r.status)}">${esc(stLabel(r.status))}</span>`:""}</span>
      </div>`).join("") : `<div class="empty">Nothing matches ${q?`“${esc(q)}”`:"that filter"}. Try fewer words, or part of a name.</div>`}
      ${rows.length>S.shown ? `<div class="more"><button class="btn" id="more">Show more (${(rows.length-S.shown).toLocaleString()} left)</button></div>` : ""}
    </section>
  </div>`;
}

// ---------- order (view) ----------
function fv(label, val, cls=""){ return `<div class="f"><span class="lbl">${label}</span><span class="val ${cls}">${val||""}</span></div>`; }
function connsView(arr){ const a=(arr||[]).filter(Boolean); if(!a.length) return `<div class="conn"><span class="n">1</span><span class="val"></span></div>`; return a.map((c,i)=>`<div class="conn"><span class="n">${i+1}</span><span class="val">${esc(c)}</span></div>`).join(""); }
const backLabel = () => ({home:"Dashboard",queue:"Open queue",parts:"Parts needed",orders:"All orders"}[S.tab]||"Back");

function renderView(r){
  const can = canWrite && dbReady;
  const statusBtns = STATUSES.map(s=>`<button class="stbtn" data-status="${esc(s)}" aria-pressed="${r.status===s}" ${can?"":"disabled"}>${esc(stLabel(s))}</button>`).join("");
  const others = CUSTS.find(c=>c.k===custKey(r.name));
  $("#main").innerHTML = `
  <div class="page narrow">
  <button class="btn ghost sm backlink" id="act-back">← ${esc(backLabel())}</button>
  <article class="sheet">
    <div class="sheet-head">
      <div class="ordno"><small>Order</small><span class="mono">${esc(r.id)}</span></div>
      <span class="pill ${stClass(r.status)}">${esc(stLabel(r.status))}</span>${flexBadge(r)}
      <div class="actions">
        <button class="btn" id="act-dup">Duplicate</button>
        <button class="btn" id="act-edit" ${can?"":"disabled"}>Amend</button>
        <button class="btn" id="act-print">Print</button>
        <button class="btn ghost" id="act-copy" title="Copy a text summary for email or the SO">Copy summary</button>
      </div>
    </div>
    <div class="sec"><div class="sec-title">Status</div><div class="statusbar">${statusBtns}</div></div>
    <div class="sec grid2">
      <div class="fields">
        ${fv("Contact", r.name ? `<button class="linkish" id="cust-link" title="Show every order for this customer">${esc(r.name)}</button>${others&&others.n>1?`<span class="hint">${others.n} orders</span>`:""}` : "")}
        ${fv("Company / show", r.company ? `<button class="linkish" id="co-link" title="Show every order for this company">${esc(r.company)}</button>` : "")}
        ${fv("CUST-ID", esc(r.mas), "mono")}
        ${fv("Phone", esc(r.phone), "mono")}
        ${fv("Email", esc(r.email))}
        ${fv("Payment", esc(r.pay), "mono")}
      </div>
      <div class="fields">
        ${fv("Submitted", esc(fmtDate(r.sub)), "mono")}
        ${fv("Date needed", esc(fmtDate(r.need)) + (r.flex?' <span class="hint">no hard deadline</span>':""), "mono")}
        ${fv("Time needed", esc(r.time), "mono")}
        ${fv("Sales rep", esc(r.rep))}
        ${fv("Quote", esc(r.quote), "mono")}
      </div>
    </div>
    <div class="sec grid3">
      ${fv("Quantity", esc(r.qty), "mono")}
      ${fv("Length", esc(r.len) + ' <span class="hint">cable only</span>', "mono")}
      ${fv("Cable color", esc(r.color))}
    </div>
    <div class="sec">
      <div class="ft">
        <div class="side from"><div class="side-title"><i></i>Output <span>/ from</span></div>${fv("Device", esc(r.outDev))}${connsView(r.out)}</div>
        <div class="arrow" aria-hidden="true"><svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 8h24M19 2l6 6-6 6"/></svg></div>
        <div class="side to"><div class="side-title"><i></i>Input <span>/ to</span></div>${fv("Device", esc(r.inDev))}${connsView(r.inp)}</div>
      </div>
    </div>
    <div class="sec"><div class="sec-title">Notes</div><div class="notes-view">${esc(r.notes||"")}</div></div>
    ${(r.appr||r.apprDate)?`<div class="sec grid2">${fv("Approved by",esc(r.appr))}${fv("Approved date",esc(fmtDate(r.apprDate)),"mono")}</div>`:""}
    <div class="sec"><div class="sec-title">History</div><div class="revs" id="revs">${revsHTML(r)}</div></div>
  </article>
  </div>`;
}
function revsHTML(r){
  const rows = [];
  if(r._hist || r.imported) rows.push(`<div class="rev"><time>${esc(fmtDate(r.sub))}</time><span class="chg">Entered in FormDocs${r.rep?` by ${esc(r.rep)}`:""}</span></div>`);
  (r.rev||[]).forEach(v=>{
    const who_ = v.byName || v.by || "Someone";
    const when = new Date(v.at); const ws = isNaN(when) ? "" : when.toLocaleString(undefined,{month:"numeric",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});
    let what = v.kind==="created" ? `created this order${v.from?` (copied from #${esc(v.from)})`:""}` : v.kind==="status" ? `set status to <b>${esc(stLabel(v.status))}</b>` : `amended ${esc((v.fields||[]).map(f=>LABELS[f]||f).join(", ")||"the order")}`;
    rows.push(`<div class="rev"><time>${esc(ws)}</time><span><span class="who">${esc(who_)}</span> <span class="chg">${what}</span>${v.note?` — “${esc(v.note)}”`:""}</span></div>`);
  });
  return rows.join("") || `<div class="rev chg">No changes recorded.</div>`;
}

// ---------- order (new / amend) ----------
function blankDraft(){
  return {id:null, sub:todayISO(), need:"", flex:false, time:"3:00 PM", name:"", company:"", mas:"", phone:"", email:"", pay:"", qty:"1", len:"18\"", color:"Black", outDev:"", inDev:"", out:[""], inp:[""], notes:"", rep:lsGet("cc-rep")||"", status:"Submitted", quote:""};
}
function startNew(from){
  S.mode="new"; S.sel=null; S.errors={};
  const d = blankDraft();
  if(from){
    ["name","company","mas","phone","email","qty","len","color","outDev","inDev","notes","quote"].forEach(k=>{ if(from[k]) d[k]=from[k]; });
    d.out=[...(from.out||[])]; d.inp=[...(from.inp||[])]; d._from = from.id;
  }
  S.draft = d; renderAll();
  if(location.hash!=="#new") history.replaceState(null,"","#new");
  window.scrollTo(0,0);
  setTimeout(()=>{ const el = from ? $("#d-need") : $("#d-name"); el && el.focus(); }, 30);
}
function startEdit(r){
  S.mode="edit"; S.errors={};
  const d = JSON.parse(JSON.stringify(stripRec(r))); d.out = d.out&&d.out.length?d.out:[""]; d.inp=d.inp&&d.inp.length?d.inp:[""]; d.flex=!!d.flex;
  S.draft = d; renderAll(); window.scrollTo(0,0);
}
function stripRec(r){ const o={}; for(const k of FIELDS){ if(r[k]!==undefined) o[k]=r[k]; } ["rev","createdAt","createdBy","updatedAt","imported"].forEach(k=>{ if(r[k]!==undefined) o[k]=r[k]; }); return o; }

function fi(key,label,{type="text",req=false,mono=false,combo=null,ph=""}={}){
  const v = S.draft[key] ?? "";
  return `<div class="f ${req?"req":""} ${S.errors[key]?"err":""}"><label for="d-${key}">${label}</label><input id="d-${key}" data-k="${key}" type="${type}" value="${esc(v)}" ${combo?`data-combo="${combo}"`:""} ${mono?'class="mono"':""} placeholder="${esc(ph)}" autocomplete="off"></div>`;
}
function connInputs(side){
  const arr = S.draft[side];
  const rows = [];
  const n = Math.min(8, Math.max(1, arr.filter(Boolean).length + 1, arr.length));
  for(let i=0;i<n;i++) rows.push(`<div class="conn"><span class="n">${i+1}</span><input id="d-${side}-${i}" data-side="${side}" data-i="${i}" data-combo="conn" value="${esc(arr[i]||"")}" autocomplete="off" placeholder="${i===0?"Start typing, e.g. TA5F":""}"></div>`);
  return rows.join("");
}
function renderEdit(){
  const d = S.draft, isNew = S.mode==="new";
  const errs = Object.values(S.errors);
  $("#main").innerHTML = `
  <div class="page narrow">
  <button class="btn ghost sm backlink" id="act-cancel2">← Cancel</button>
  <article class="sheet" id="edit-sheet">
    <div class="sheet-head">
      <div class="ordno"><small>${isNew?"New order":"Amending order"}</small><span class="mono">${isNew?"auto #":esc(d.id)}</span></div>
      ${d._from?`<span class="hint">Copied from #${esc(d._from)}</span>`:""}
      <div class="actions">
        <label class="printafter"><input type="checkbox" id="d-printafter" ${lsGet("cc-print")!=="0"?"checked":""}> Print when ${isNew?"submitted":"saved"}</label>
        <button class="btn primary" id="act-save">${isNew?"Submit order":"Save amendment"}</button>
      </div>
    </div>
    ${errs.length?`<div class="sec"><div class="errmsg">${esc(errs.join(" "))}</div></div>`:""}
    <div class="sec grid2">
      <div class="fields">
        ${fi("name","Contact",{req:true,combo:"cust",ph:"Person who placed the order"})}
        ${fi("company","Company / show",{combo:"co",ph:"Company or production, if any"})}
        ${fi("mas","CUST-ID",{mono:true,ph:"CUST-"})}
        ${fi("phone","Phone",{mono:true})}
        ${fi("email","Email",{type:"email"})}
        ${fi("pay","Payment",{mono:true,ph:"SO# GS26-…"})}
      </div>
      <div class="fields">
        ${fi("sub","Submitted",{type:"date",mono:true})}
        ${fi("need","Date needed",{type:"date",req:true,mono:true})}
        <label class="check"><input type="checkbox" id="d-flex" ${d.flex?"checked":""}> No hard deadline. This date can slip if the bench is busy.</label>
        ${fi("time","Time needed",{combo:"time",mono:true})}
        ${fi("rep","Sales rep",{combo:"rep",req:true,ph:"Your initials"})}
        ${fi("quote","Quote",{mono:true,ph:"$"})}
      </div>
    </div>
    <div class="sec grid3">
      ${fi("qty","Quantity",{req:true,mono:true})}
      ${fi("len","Length",{combo:"len",mono:true,ph:"cable only"})}
      ${fi("color","Cable color",{combo:"color"})}
    </div>
    <div class="sec">
      <div class="ft">
        <div class="side from"><div class="side-title"><i></i>Output <span>/ from</span></div>${fi("outDev","Device",{combo:"dev",ph:"e.g. Mixpre10"})}<div id="conns-out" class="side">${connInputs("out")}</div></div>
        <div class="arrow" aria-hidden="true"><svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 8h24M19 2l6 6-6 6"/></svg></div>
        <div class="side to"><div class="side-title"><i></i>Input <span>/ to</span></div>${fi("inDev","Device",{combo:"dev",ph:"e.g. 2 × DJI Wireless TX"})}<div id="conns-inp" class="side">${connInputs("inp")}</div></div>
      </div>
      ${S.errors.conn?`<div class="errmsg">${esc(S.errors.conn)}</div>`:""}
    </div>
    <div class="sec">
      <div class="sec-title">Notes for the service team</div>
      <textarea class="notes" id="d-notes" data-k="notes" placeholder="Wiring, pads, labels, channel colors, anything the builder needs to know">${esc(d.notes||"")}</textarea>
      <div class="quick" id="quick">${QUICK_NOTES.map(n=>`<button type="button" data-note="${esc(n)}">+ ${esc(n)}</button>`).join("")}</div>
    </div>
    <div class="sec" id="sim-sec"></div>
    <div class="sec" id="cust-sec"></div>
  </article>
  </div>`;
  renderSimilar(); renderCustHistory();
}

// Past orders with the same connector pair: a head start on wiring notes and naming.
function renderSimilar(){
  const sec = $("#sim-sec"); if(!sec) return;
  const d = S.draft;
  const o = d.out.filter(Boolean), i = d.inp.filter(Boolean);
  if(!o.length || !i.length){ sec.innerHTML = `<div class="sec-title">Similar past builds</div><div class="hint">Fill in one output and one input connector to see how this cable was built before.</div>`; return; }
  const ok=o.map(connKey), ik=i.map(connKey);
  const od=norm(d.outDev), id_=norm(d.inDev);
  const hits=[];
  for(const r of ALL){
    if(!r.out||!r.inp||!r.out.length||!r.inp.length) continue;
    const ro=r.out.filter(Boolean).map(connKey), ri=r.inp.filter(Boolean).map(connKey);
    const fwd = ok.every(k=>ro.some(x=>keyMatch(k,x))) && ik.every(k=>ri.some(x=>keyMatch(k,x)));
    const rev = !fwd && ok.every(k=>ri.some(x=>keyMatch(k,x))) && ik.every(k=>ro.some(x=>keyMatch(k,x)));
    if(!fwd && !rev) continue;
    let score = fwd?10:8;
    if(ro.length===ok.length && ri.length===ik.length) score+=3;
    if(od && norm(r.outDev)===od) score+=3; if(id_ && norm(r.inDev)===id_) score+=3;
    if(r.notes) score+=1;
    hits.push([score,r]);
    if(hits.length>4000) break;
  }
  hits.sort((a,b)=>b[0]-a[0] || (b[1].sub||"").localeCompare(a[1].sub||""));
  const top = hits.slice(0,6).map(h=>h[1]);
  sec.innerHTML = `<div class="sec-title">Similar past builds <span style="text-transform:none;letter-spacing:0;font-weight:400">· ${hits.length.toLocaleString()} found</span></div>` +
    (top.length ? `<div class="similar">${top.map(r=>`<div class="sim">
      <div class="t">#${esc(r.id)} · ${esc(fmtDate(r.sub))} · ${esc(who(r))}<br>${esc(r.outDev||"?")} [${esc(r.out.filter(Boolean).join(", "))}] → ${esc(r.inDev||"?")} [${esc(r.inp.filter(Boolean).join(", "))}] · ${esc(r.len||"")}</div>
      <div class="d">${esc(r.notes||"No notes")}</div>
      <div class="act"><button class="btn sm" data-usenotes="${esc(r.id)}" ${r.notes?"":"disabled"}>Use notes</button><button class="btn sm ghost" data-open="${esc(r.id)}">Open</button></div>
    </div>`).join("")}</div>` : `<div class="hint">No past orders with this connector pair. This one's new.</div>`);
}
function renderCustHistory(){
  const sec = $("#cust-sec"); if(!sec) return;
  const k = custKey(S.draft.name), kc = custKey(S.draft.company);
  if(!k && !kc){ sec.innerHTML=""; sec.hidden=true; return; }
  const rows = ALL.filter(r=>(k && custKey(r.name)===k) || (kc && (custKey(r.company)===kc || custKey(r.name)===kc))).slice(0,6);
  if(!rows.length){ sec.hidden=true; return; }
  sec.hidden=false;
  sec.innerHTML = `<div class="sec-title">This customer's recent cables</div><div class="similar">${rows.map(r=>`<div class="sim"><div class="t">#${esc(r.id)} · ${esc(fmtDate(r.sub))} · ${esc(who(r))}<br>${esc(r.outDev||"?")} [${esc(r.out.filter(Boolean).join(", "))}] → ${esc(r.inDev||"?")} [${esc(r.inp.filter(Boolean).join(", "))}] · ${esc(r.len||"")} ×${esc(r.qty||"")}</div><div class="d">${esc(r.notes||"")}</div><div class="act"><button class="btn sm" data-copyfrom="${esc(r.id)}">Use this build</button></div></div>`).join("")}</div>`;
}

// ---------- combobox ----------
let pop=null, popFor=null, popItems=[], popIdx=0;
function comboSource(kind, q){
  const qn = norm(q), terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const m = s => { if(!q) return true; const l=s.toLowerCase(), n=norm(s); return terms.every(t=>l.includes(t)) || (qn && n.includes(qn)); };
  if(kind==="conn"){
    const out=[]; const seen=new Set();
    for(const [grp,list] of Object.entries(STD_CONN)) for(const c of list) if(m(c)){ out.push({v:c,note:grp,hd:"Standard"}); seen.add(norm(c)); }
    if(q) for(const [c,n] of VOCAB.conn){ if(out.length>40) break; if(!seen.has(norm(c)) && m(c)){ out.push({v:c,note:`used ${n.toLocaleString()}×`,hd:"Used before"}); seen.add(norm(c)); } }
    return out.slice(0, q?40:60);
  }
  if(kind==="dev"){ return VOCAB.dev.filter(([d])=>m(d)).slice(0,25).map(([d,n])=>({v:d,note:`${n.toLocaleString()}×`})); }
  if(kind==="len"){ const base=['6"','8"','12"','16"','18"','24"','36"',"3'","6'","10'","25'","50'","100'","Coiled"]; const l=base.filter(m).map(v=>({v})); return l.length?l:VOCAB.len.filter(([v])=>m(v)).slice(0,12).map(([v])=>({v})); }
  if(kind==="color") return COLORS.filter(m).map(v=>({v}));
  if(kind==="time") return TIMES.filter(m).map(v=>({v}));
  if(kind==="rep") return VOCAB.rep.filter(([r])=>/^[A-Z]{2,4}$/.test(r)).filter(([r])=>m(r)).map(([r,n])=>({v:r,note:`${n} orders since 2025`}));
  if(kind==="cust"){
    if(!q || q.length<2) return [];
    const ql=q.toLowerCase();
    return CUSTS.filter(c=>c.k.includes(ql) || (c.mas&&c.mas.toLowerCase().includes(ql)) || (c.email&&c.email.toLowerCase().includes(ql))).slice(0,15)
      .map(c=>({v:c.name,note:`${c.n} order${c.n>1?"s":""}${c.company?" · "+c.company:""}${c.mas?" · "+c.mas:""}`,cust:c}));
  }
  if(kind==="co"){
    if(!q || q.length<2) return COMPANIES.slice(0,10).map(([v,n])=>({v,note:`${n}×`}));
    const ql=q.toLowerCase(), out=[], seen=new Set();
    for(const [v,n] of COMPANIES){ if(v.toLowerCase().includes(ql)){ out.push({v,note:`${n}×`}); seen.add(v.toLowerCase()); } if(out.length>=10) break; }
    for(const c of CUSTS){ if(out.length>=15) break; if(c.k.includes(ql) && !seen.has(c.k)){ out.push({v:c.name,note:"from past orders"}); seen.add(c.k); } }
    return out;
  }
  return [];
}
function openPop(input){
  const kind = input.dataset.combo; const items = comboSource(kind, input.value.trim());
  popFor = input; popItems = items; popIdx = 0;
  if(!items.length){ closePop(); return; }
  if(!pop){ pop=document.createElement("div"); pop.className="pop"; pop.setAttribute("role","listbox"); document.body.appendChild(pop);
    pop.addEventListener("mousedown",e=>{ const o=e.target.closest(".opt"); if(o){ e.preventDefault(); choose(+o.dataset.i); } }); }
  let lastHd=null;
  pop.innerHTML = items.map((it,i)=>{ let h=""; if(it.hd && it.hd!==lastHd){ h=`<div class="hd">${esc(it.hd)}</div>`; lastHd=it.hd; } return h+`<div class="opt" role="option" data-i="${i}" aria-selected="${i===0}"><span class="${kind==="conn"?"mono":""}">${esc(it.v)}</span>${it.note?`<small>${esc(it.note)}</small>`:""}</div>`; }).join("");
  const r = input.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - Math.max(r.width,240) - 8)) + "px";
  pop.style.top = (window.scrollY + r.bottom + 2) + "px";
  pop.style.width = Math.max(r.width, 240) + "px";
  pop.hidden = false;
}
function closePop(){ if(pop) pop.hidden=true; popFor=null; }
function movePop(dir){ if(!pop||pop.hidden) return; popIdx=(popIdx+dir+popItems.length)%popItems.length; pop.querySelectorAll(".opt").forEach(o=>o.setAttribute("aria-selected", String(+o.dataset.i===popIdx))); const el=pop.querySelector(`.opt[data-i="${popIdx}"]`); el&&el.scrollIntoView({block:"nearest"}); }
function choose(i){
  const it = popItems[i]; const input = popFor; if(!it||!input) return;
  input.value = it.v; setDraftFrom(input);
  if(it.cust){ const c=it.cust; ["company","mas","phone","email"].forEach(k=>{ if(c[k] && !S.draft[k]){ S.draft[k]=c[k]; const el=$("#d-"+k); if(el) el.value=c[k]; } }); renderCustHistory(); }
  closePop();
  const all=[...document.querySelectorAll("#edit-sheet input:not([type=checkbox]), #edit-sheet textarea")]; const nx=all[all.indexOf(input)+1]; nx&&nx.focus();
}
function setDraftFrom(input){
  if(input.dataset.side){
    const side=input.dataset.side, i=+input.dataset.i; const arr=S.draft[side];
    while(arr.length<=i) arr.push(""); arr[i]=input.value;
    const box=$("#conns-"+side); const filled=arr.filter(Boolean).length;
    if(box && box.children.length < Math.min(8, filled+1)){ const f=document.activeElement?.id; box.innerHTML=connInputs(side); const el=f&&document.getElementById(f); if(el){ el.focus(); const L=el.value.length; try{el.setSelectionRange(L,L);}catch(e){} } }
    clearTimeout(setDraftFrom.t); setDraftFrom.t=setTimeout(renderSimilar,250);
  } else if(input.dataset.k){
    S.draft[input.dataset.k] = input.value;
    if(input.dataset.k==="name"||input.dataset.k==="company"){ clearTimeout(setDraftFrom.c); setDraftFrom.c=setTimeout(renderCustHistory,300); }
    if(input.dataset.k==="outDev"||input.dataset.k==="inDev"){ clearTimeout(setDraftFrom.t); setDraftFrom.t=setTimeout(renderSimilar,300); }
  }
}

// ---------- save ----------
function validate(d){
  const e={};
  if(!d.name.trim()) e.name="Add the name of the person who placed the order.";
  if(!d.need) e.need="Pick the date needed. If there's no deadline, pick a planned date and tick No hard deadline.";
  if(!String(d.qty||"").trim()) e.qty="Add a quantity.";
  if(!String(d.rep||"").trim()) e.rep="Add your initials as sales rep.";
  if(!d.out.some(x=>x.trim()) || !d.inp.some(x=>x.trim())) e.conn="Add at least one output and one input connector.";
  return e;
}
function cleanDraft(d){
  const o={};
  for(const k of FIELDS){ let v=d[k];
    if(k==="out"||k==="inp"){ v=(v||[]).map(x=>String(x).trim()); while(v.length&&!v[v.length-1]) v.pop(); o[k]=v; }
    else if(k==="flex"){ o[k]=!!v; }
    else if(v!==undefined && v!==null){ o[k]=String(v).trim(); } }
  return o;
}
function nextNumber(){ let max=0; for(const id of BY_ID.keys()){ if(/^\d{6}$/.test(id)){ const n=+id; if(n>max) max=n; } } return max+1; }
async function claimId(){
  let n = nextNumber();
  for(let tries=0; tries<20; tries++, n++){
    const id = pad6(n); if(BY_ID.has(id)) continue;
    const ref = fs.collection("orders").doc(id);
    const ok = await fs.runTransaction(async t => { const s = await t.get(ref); if(s.exists) return false; t.set(ref, {id, claimedBy: me.email, updatedAt: "0"}); return true; });
    if(ok) return id;
  }
  throw new Error("no id");
}
let saving=false;
async function save(){
  if(saving) return;
  const d=S.draft;
  const fl=$("#d-flex"); if(fl) d.flex=fl.checked;
  S.errors=validate(d);
  if(Object.keys(S.errors).length){ renderEdit(); window.scrollTo(0,0); return; }
  if(!fs || !canWrite){ toast("Saving isn't available right now."); return; }
  if(S.mode==="edit"){ askNote(note=>doSave(note)); return; }
  doSave("");
}
async function doSave(note){
  const pa=$("#d-printafter"); S.printAfter = pa ? pa.checked : false; lsSet("cc-print", S.printAfter?"1":"0");
  saving=true; const btn=$("#act-save"); if(btn){ btn.disabled=true; btn.textContent="Saving…"; }
  const d=S.draft, now=new Date().toISOString();
  try{
    lsSet("cc-rep", d.rep.trim());
    if(S.mode==="new"){
      const id = await claimId();
      const body = Object.assign(cleanDraft(d), {id, createdAt:now, createdBy:me.email, updatedAt:now, rev:[{at:now,by:me.email,byName:me.name,kind:"created",from:d._from||null}]});
      await fs.collection("orders").doc(id).set(body);
      LIVE.set(id, liveRec(id, body));
      rebuild(); S.mode="view"; S.sel=id; S.draft=null; history.replaceState(null,"","#o-"+id);
      toast(`Order #${id} submitted to the queue`); renderAll();
      if(S.printAfter) setTimeout(()=>printOrder(BY_ID.get(id)), 300);
    } else {
      const cur = BY_ID.get(d.id); const next = cleanDraft(d);
      const blank = k => k==="out"||k==="inp" ? [] : k==="flex" ? false : "";
      const changed = FIELDS.filter(k => k!=="id" && JSON.stringify(cur[k]??blank(k)) !== JSON.stringify(next[k]??blank(k)));
      if(!changed.length){ S.mode="view"; S.draft=null; renderAll(); toast("No changes to save"); saving=false; return; }
      const body = Object.assign({}, stripRec(cur), next, {updatedAt:now, rev:[...(cur.rev||[]), {at:now,by:me.email,byName:me.name,kind:"amended",fields:changed,note:note||""}]});
      if(cur._hist){ body.imported=true; }
      delete body._hist; delete body._s;
      await fs.collection("orders").doc(d.id).set(body);
      LIVE.set(d.id, liveRec(d.id, body));
      rebuild(); S.mode="view"; S.draft=null; toast(`Order #${d.id} amended`); renderAll();
      if(S.printAfter) setTimeout(()=>printOrder(BY_ID.get(d.id)), 300);
    }
  }catch(e){
    const code = e && e.code;
    toast(code==="resource-exhausted" ? "The database hit today's free limit. Try again tomorrow, or ask Joe to upgrade the Firebase plan." : code==="permission-denied" ? "This account doesn't have permission to save." : "Couldn't save. Check your connection and try again.");
    if(btn){ btn.disabled=false; btn.textContent=S.mode==="new"?"Submit order":"Save amendment"; }
  }
  saving=false;
}
async function setStatus(r, status){
  if(!fs||!canWrite||r.status===status) return;
  const now=new Date().toISOString();
  const body = Object.assign({}, stripRec(r), {status, updatedAt:now, rev:[...(r.rev||[]), {at:now,by:me.email,byName:me.name,kind:"status",status}]});
  if(r._hist) body.imported=true;
  try{ await fs.collection("orders").doc(r.id).set(body); LIVE.set(r.id, liveRec(r.id, body)); rebuild(); renderAll(); toast(`#${r.id} → ${stLabel(status)}`); }
  catch(e){ toast("Couldn't update the status. Try again."); renderAll(); }
}
function askNote(cb){
  const bg=document.createElement("div"); bg.className="modal-bg";
  bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"><h3 id="mh">What changed?</h3><p class="hint" style="margin:0">Optional. Shows in the order history so the service team knows why.</p><textarea id="m-note" placeholder="e.g. Customer wants 24&quot; instead of 18&quot;"></textarea><div class="btns"><button class="btn ghost" id="m-x">Back</button><button class="btn primary" id="m-ok">Save amendment</button></div></div>`;
  document.body.appendChild(bg); $("#m-note").focus();
  $("#m-x").onclick=()=>bg.remove();
  $("#m-ok").onclick=()=>{ const v=$("#m-note").value.trim(); bg.remove(); cb(v); };
}
function summary(r){
  const L=[`Gotham Sound custom cable order #${r.id}`,`Contact: ${r.name||""}${r.company?`, ${r.company}`:""}${r.mas?` (${r.mas})`:""}`,`Needed: ${fmtDate(r.need)} ${r.time||""}${r.flex?" (no hard deadline)":""}`,`Quantity ${r.qty||""} · Length ${r.len||""} · ${r.color||""}`,
    `From ${r.outDev||"?"}: ${(r.out||[]).filter(Boolean).join(", ")}`,`To ${r.inDev||"?"}: ${(r.inp||[]).filter(Boolean).join(", ")}`];
  if(r.notes) L.push(`Notes: ${r.notes}`); if(r.pay) L.push(`Payment: ${r.pay}`); if(r.rep) L.push(`Sales rep: ${r.rep}`);
  return L.join("\n");
}

// ---------- render ----------
function renderAll(keepMain){
  const tabSel = S.sel||S.mode!=="view" ? null : S.tab;
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.tab===tabSel)));
  $("#ct-queue").textContent = dbReady ? (workItems().length || "") : "";
  $("#ct-orders").textContent = dbReady ? ALL.length.toLocaleString() : "";
  asOfBanner();
  if(!dbReady) return;
  if(keepMain && (S.mode==="new"||S.mode==="edit")) return;
  closePop();
  if(S.mode==="new"||S.mode==="edit"){ renderEdit(); return; }
  if(S.sel){ const r=BY_ID.get(S.sel); if(r) renderView(r); else $("#main").innerHTML = `<div class="page"><div class="empty"><h2>Order #${esc(S.sel)} isn't in the system</h2><p>Check the number, or search for the customer.</p></div></div>`; return; }
  ({home:renderHome, queue:renderQueue, parts:renderParts, orders:renderOrders}[S.tab]||renderHome)();
}

// ---------- parts needed ----------
const FAM_LABEL = {xlr:"XLR",ta:"TA (mini XLR)",hirose:"Hirose",lemo:"Lemo",bnc:"BNC",sma:"SMA",din:"DIN 1.0/2.3",ptap:"P-Tap",dtap:"D-Tap",usbc:"USB-C",usb:"USB",dc21:"2.1mm DC",dc25:"2.5mm DC / BDS",mini:"1/8\" (3.5mm)",qtr:"1/4\"",rj45:"RJ45",db25:"DB25"};
function parseQty(q){ const s=String(q||"").trim(); const m=s.match(/\d+/); if(!m) return {n:1, unsure:true}; const extra=(s.match(/\d+/g)||[]).length>1 || /see|multiple|stock/i.test(s); return {n:+m[0], unsure:extra}; }
// Channel labels like "Left / Blue" are markings, not different parts.
const partName = c => String(c||"").replace(/\(?\s*\b(left|right|l|r)\s*\/\s*(blue|red)\s*\)?/ig,"").replace(/\(?\s*\b(blue|red)\s*\/\s*(left|right)\s*\)?/ig,"").replace(/\s{2,}/g," ").replace(/[\s\-,/]+$/,"").trim();
// One standard name per physical part, so XLRM, XLR3M, 3p-XLRM and "XLR 3 Male" all count together.
function canonPart(c){
  const raw = partName(c); if(!raw) return null;
  const key = connKey(raw), [fp, g0] = key.split(":");
  const fam = (fp.match(/^[a-z]+(?:21|25|45)?/)||[""])[0], pins = fp.slice(fam.length);
  if(!FAM_LABEL[fam]) return {k:"x:"+norm(raw), name:raw, fam:"Other"};
  const t = raw.toLowerCase(), G = g0 ? g0.toUpperCase() : "";
  const ra = /\bra\b|right[\s-]?angle|-ra\b|\bra-|\(ra\)/.test(t), lp = /low[\s-]?pro|\blp\b/.test(t), lock = /lock/.test(t) && !/non[\s-]?lock/.test(t);
  let name;
  switch(fam){
    case "xlr": name=`XLR${pins||3}${G}`; break;
    case "ta": name=`TA${pins}${G}`; break;
    case "hirose": name=`Hirose ${pins||4}${G}`; break;
    case "lemo": name=`Lemo ${pins}${G}`.trim(); break;
    case "bnc": name=`BNC${G?" "+G:""}${/75/.test(t)?" 75ohm":/50/.test(t)?" 50ohm":""}`; break;
    case "sma": name=`SMA${G?" "+G:""}`; break;
    case "mini": name=`1/8" ${/trrs/.test(t)?"TRRS":/\bts\b/.test(t)&&!/trs/.test(t)?"TS":"TRS"}${G?" "+G:""}`; break;
    case "qtr": name=`1/4" ${/\bts\b/.test(t)&&!/trs/.test(t)?"TS":"TRS"}${G?" "+G:""}`; break;
    case "ptap": name=`P-Tap${G?" "+G:""}`; break;
    case "dtap": name=`D-Tap${G?" "+G:""}`; break;
    case "dc21": name="2.1mm DC"; break;
    case "dc25": name=/bds/.test(t)?"2.5mm DC (BDS)":"2.5mm DC"; break;
    case "usbc": name="USB-C"; break;
    case "usb": name="USB"; break;
    case "rj45": name="RJ45"; break;
    case "db25": name=`DB25${G?" "+G:""}`; break;
    case "din": name="DIN 1.0/2.3"; break;
    default: name=raw;
  }
  if(/\bemc\b/.test(t)) name+=" EMC";
  if(/nickel/.test(t)) name+=" Nickel";
  if(lp) name+=" Low Profile";
  if(lock && !["xlr","ta","hirose","lemo","bnc"].includes(fam)) name+=" Locking";
  if(ra) name+=" RA";
  return {k:name.toLowerCase(), name, fam:FAM_LABEL[fam]};
}
// Last due date included for the chosen range (overdue orders are always included).
function rangeEnd(){
  const d=viewDay();
  switch(PARTS.range){
    case "day": return d;
    case "week": return addDays(d, (7-dow(d))%7);
    case "d7": return addDays(d,6);
    case "month": { const x=new Date(d+"T12:00:00"); return new Date(x.getFullYear(), x.getMonth()+1, 0, 12).toISOString().slice(0,10); }
    case "d30": return addDays(d,29);
    default: return null;
  }
}
const RANGES = [["all","Any time"],["day","Through today"],["week","This week"],["d7","Next 7 days"],["month","This month"],["d30","Next 30 days"]];
function partsData(){
  const statuses = new Set(["Submitted","Waiting on parts"]);
  const end = rangeEnd();
  const orders = openItems().filter(r => statuses.has(r.status) && (!end || !r.need || r.need<=end));
  const parts = new Map();
  for(const r of orders){
    const q = parseQty(r.qty);
    for(const c of [...(r.out||[]), ...(r.inp||[])]){
      const cp = canonPart(c); if(!cp) continue;
      let p = parts.get(cp.k);
      if(!p){ p={k:cp.k, name:cp.name, fam:cp.fam, total:0, orders:new Map(), spellings:new Set(), due:"", unsure:false}; parts.set(cp.k,p); }
      p.total += q.n; p.unsure = p.unsure || q.unsure; p.spellings.add(partName(c));
      p.orders.set(r.id, (p.orders.get(r.id)||0) + q.n);
      if(r.need && (!p.due || r.need<p.due)) p.due=r.need;
    }
  }
  const list=[...parts.values()];
  const famOrder = Object.values(FAM_LABEL).concat("Other");
  if(PARTS.sort==="due") list.sort((a,b)=> (a.due||"9").localeCompare(b.due||"9") || famOrder.indexOf(a.fam)-famOrder.indexOf(b.fam) || b.total-a.total);
  else list.sort((a,b)=> famOrder.indexOf(a.fam)-famOrder.indexOf(b.fam) || b.total-a.total || a.name.localeCompare(b.name));
  // groups: by type, or by first-due day
  const day=viewDay(), groups=new Map();
  for(const p of list){ const g = PARTS.sort==="due" ? (!p.due?"No date":p.due<day?"Overdue":fmtLong(p.due)) : p.fam; if(!groups.has(g)) groups.set(g,[]); groups.get(g).push(p); }
  return {orders, list, groups, end};
}
function partsDesc(orders,end){
  return `${orders.length} order${orders.length===1?"":"s"} · submitted and waiting on parts · ${end?`due by ${fmtDay(end)}`:"any due date"}`;
}
function renderParts(){
  const {orders, list, groups, end} = partsData(), day=viewDay();
  const total = list.reduce((a,p)=>a+p.total,0);
  const opt = (attr,v,l,cur) => `<button class="stbtn" data-${attr}="${v}" aria-pressed="${cur===v}">${l}</button>`;
  $("#main").innerHTML = `
  <div class="page">
    <div class="page-head">
      <div><h1>Parts needed</h1><p class="hint">Connectors for orders that are submitted or waiting on parts. Each one is multiplied by the order quantity. Orders drop off once they're marked In build.</p></div>
      <div class="actions"><button class="btn" id="parts-print" ${list.length?"":"disabled"}>Print pull sheet</button><button class="btn ghost" id="parts-copy" ${list.length?"":"disabled"}>Copy list</button></div>
    </div>
    <section class="panel opts">
      <div class="statusbar"><span class="hint optl">Due</span>${RANGES.map(([v,l])=>opt("prange",v,v==="day"?(day===todayISO()?"Through today":"Through "+fmtDay(day)):l,PARTS.range)).join("")}</div>
      <div class="statusbar"><span class="hint optl">Group by</span>${opt("psort","type","Connector type",PARTS.sort)}${opt("psort","due","Earliest due date",PARTS.sort)}</div>
      ${aheadHTML()}
    </section>
    <div class="tiles three">
      <div class="tile static"><b class="mono">${total}</b><span>connectors total</span></div>
      <div class="tile static"><b class="mono">${list.length}</b><span>different parts</span></div>
      <div class="tile static"><b class="mono">${orders.length}</b><span>orders${end?` due by ${esc(fmtDay(end))}`:""}</span></div>
    </div>
    ${list.length ? [...groups].map(([g,ps])=>`<section>
      <div class="sec-title fam-h ${g==="Overdue"?"late":""}"><span>${esc(g)}</span><span class="mono">${ps.reduce((a,p)=>a+p.total,0)}</span></div>
      <div class="pcards">${ps.map(p=>`<div class="pcard">
        <div class="pc-top"><b class="mono">${p.total}</b>${p.unsure?'<span class="pw" title="One of these orders has an unclear quantity (like 1 / 1). It was counted as the first number. Check the order.">?</span>':""}</div>
        <div class="pc-name mono">${esc(p.name)}</div>
        <div class="pc-meta">${PARTS.sort==="due"?esc(p.fam)+" · ":""}${p.orders.size} order${p.orders.size===1?"":"s"}${p.due&&PARTS.sort!=="due"?` · first due <span class="${p.due<day?"late":""}">${esc(fmtDay(p.due))}</span>`:""}</div>
        <details class="pc-more"><summary>Orders</summary><div>${[...p.orders].map(([id,n])=>`<button class="linkish mono" data-open="${esc(id)}">#${esc(id)}</button> ×${n}${BY_ID.get(id)?.need?` <span class="hint">${esc(fmtDay(BY_ID.get(id).need))}</span>`:""}`).join("<br>")}${p.spellings.size>1||![...p.spellings].includes(p.name)?`<div class="hint" style="margin-top:4px">Written as: ${esc([...p.spellings].join(", "))}</div>`:""}</div></details>
      </div>`).join("")}</div></section>`).join("") : `<section class="panel"><div class="empty">No parts needed for orders ${end?`due by ${esc(fmtDay(end))}`:"right now"}. Orders show up here as soon as they're submitted.</div></section>`}
  </div>`;
}
function partsText(){
  const {orders,list,end}=partsData();
  return [`Connectors needed: ${partsDesc(orders,end)} (${new Date().toLocaleDateString()})`, ...list.map(p=>`${p.total}${p.unsure?"?":""} x ${p.name}   [${[...p.orders.keys()].map(i=>"#"+i).join(", ")}]${p.due?"  first due "+fmtDate(p.due):""}`)].join("\n");
}
function printSheet(){ let el = document.getElementById("print-sheet"); if(!el){ el=document.createElement("div"); el.id="print-sheet"; document.body.appendChild(el); } return el; }
function printParts(){
  const {orders,groups,end}=partsData();
  printSheet().innerHTML = `<div class="pr pr-pull">
  <header class="pr-head"><div class="pr-logo">${LOGO_SVG()}</div><div class="pr-title"><div class="pr-kicker">Parts pull sheet</div><div class="pr-big">Connectors needed</div><div class="pr-sub">${esc(partsDesc(orders,end))}</div></div></header>
  <table class="pp-t"><thead><tr><th>Qty</th><th>Connector</th><th>Orders</th><th>First due</th><th>Pulled</th></tr></thead><tbody>
  ${[...groups].map(([g,ps])=>`<tr class="pp-f"><td colspan="5">${esc(g)}</td></tr>`+ps.map(p=>`<tr><td class="pp-q">${p.total}${p.unsure?"?":""}</td><td>${esc(p.name)}</td><td>${[...p.orders].map(([id,n])=>`#${esc(id)}${n>1?" ×"+n:""}`).join(", ")}</td><td>${esc(fmtDate(p.due))}</td><td class="pp-box"></td></tr>`).join("")).join("")}
  </tbody></table>
  <div class="pr-printed">Printed ${esc(new Date().toLocaleString())}${me?` by ${esc(me.name)}`:""}</div></div>`;
  window.print();
}

// ---------- print: one order ----------
// Clean, customer-presentable order sheet on one letter page.
function printOrder(r){
  if(!r) return;
  const row = (l,v,cls="") => `<div class="pr-row ${cls}"><span class="pr-l">${l}</span><span class="pr-v">${v||"&nbsp;"}</span></div>`;
  const conns = arr => { const a=(arr||[]).filter(Boolean); const n=Math.max(4,a.length); let h=""; for(let i=0;i<n;i++) h+=`<li><span class="pr-n">${i+1}</span><span>${esc(a[i]||"")}</span></li>`; return h; };
  printSheet().innerHTML = `<div class="pr">
  <header class="pr-head">
    <div class="pr-logo">${LOGO_SVG()}</div>
    <div class="pr-title">
      <div class="pr-kicker">Custom Cable Order</div>
      <div class="pr-big">No. ${esc(r.id)}</div>
      <div class="pr-sub">Submitted ${esc(fmtDate(r.sub))}${r.rep?` · Sales rep ${esc(r.rep)}`:""}</div>
    </div>
  </header>
  <div class="pr-cols">
    <section class="pr-box"><h3>Customer</h3>
      ${row("Contact",esc(r.name))}${row("Company / Show",esc(r.company))}${row("Customer ID",esc(r.mas))}${row("Phone",esc(r.phone))}${row("Email",esc(r.email))}${row("Payment",esc(r.pay))}
    </section>
    <section class="pr-box"><h3>Order</h3>
      ${row("Needed by",`${r.need?esc(fmtDay(r.need)+", "+r.need.slice(0,4)):""}${r.time?` · ${esc(r.time)}`:""}`)}
      ${r.flex?row("Deadline","Flexible. Can move if needed."):""}
      ${row("Quantity",esc(r.qty))}${row("Length",r.len?`${esc(r.len)} <small>cable only</small>`:"")}${row("Cable Color",esc(r.color))}
      ${row("Quote",esc(r.quote))}
    </section>
  </div>
  <section class="pr-build">
    <div class="pr-side"><h3>Output <span>/ From</span></h3>${row("Device",esc(r.outDev))}<ol>${conns(r.out)}</ol></div>
    <div class="pr-arrow">→</div>
    <div class="pr-side"><h3>Input <span>/ To</span></h3>${row("Device",esc(r.inDev))}<ol>${conns(r.inp)}</ol></div>
  </section>
  <section class="pr-box pr-notes"><h3>Notes</h3><div>${esc(r.notes||"")}</div></section>
  <div class="pr-cols three">
    <section class="pr-box">${row("Approved by",esc(r.appr))}</section>
    <section class="pr-box">${row("Approved date",esc(fmtDate(r.apprDate)))}</section>
    <section class="pr-box">${row("Status",esc(stLabel(r.status)))}</section>
  </div>
  <section class="pr-shop"><span>Gotham use</span><span>Built by ____________</span><span>Date ________</span><span>Checked by ____________</span></section>
  <footer class="pr-foot"><b>Gotham Sound &amp; Communications, Inc.</b> · ${ADDRESS}<br>${CONTACT} · Monday to Friday, 9 AM to 6 PM</footer>
  </div>`;
  window.print();
}

// ---------- events ----------
document.addEventListener("click", e=>{
  const t=e.target;
  if(t.closest("select") || t.closest("label.check")) return;
  if(t.closest("#brand")){ S.q=""; S.cust=null; const qi=$("#q"); if(qi) qi.value=""; S.day=null; go("home"); return; }
  const dl=t.closest("[data-go]"); if(dl){ S.day=null; go(dl.dataset.go); return; }
  const tab=t.closest(".tab"); if(tab){ S.shown=100; S.day=null; go(tab.dataset.tab); return; }
  const as=t.closest("[data-asof]"); if(as){ const v=as.dataset.asof; S.asOf = (!v||v===todayISO()) ? null : v; renderAll(); return; }
  const dd=t.closest("[data-day]"); if(dd){ S.day=dd.dataset.day; go("queue"); return; }
  if(t.closest("[data-clearday]")){ S.day=null; renderAll(); return; }
  if(t.closest("#btn-new")){ startNew(); return; }
  const row=t.closest(".qrow, .orow:not(.ohead)"); if(row){ go("o-"+row.dataset.id); window.scrollTo(0,0); return; }
  if(t.closest("#more")){ S.shown+=200; renderOrders(); return; }
  if(t.closest("#clr-cust")){ S.cust=null; renderOrders(); return; }
  const pr=t.closest("[data-prange]"); if(pr){ PARTS.range=pr.dataset.prange; renderParts(); return; }
  const ps=t.closest("[data-psort]"); if(ps){ PARTS.sort=ps.dataset.psort; renderParts(); return; }
  const r = S.sel && BY_ID.get(S.sel);
  if(t.closest("#act-dup") && r){ startNew(r); return; }
  if(t.closest("#act-print") && r){ printOrder(r); return; }
  if(t.closest("#parts-print")){ printParts(); return; }
  if(t.closest("#parts-copy")){ const txt=partsText(); (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast("Parts list copied"),()=>toast("Copy isn't available here")); return; }
  if(t.closest("#act-edit") && r){ startEdit(r); return; }
  if(t.closest("#act-copy") && r){ const txt=summary(r); (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast("Summary copied"),()=>toast("Copy isn't available here")); return; }
  if(t.closest("#cust-link") && r){ S.cust=custKey(r.name); S.q=""; $("#q").value=""; S.shown=100; go("orders"); return; }
  if(t.closest("#co-link") && r){ S.cust=null; S.q=`"${r.company}"`; $("#q").value=S.q; S.shown=100; go("orders"); return; }
  const sb=t.closest(".stbtn[data-status]"); if(sb && r && !sb.disabled){ setStatus(r, sb.dataset.status); return; }
  if(t.closest("#act-back")){ go(S.tab); return; }
  if(t.closest("#act-cancel2")){ const wasNew=S.mode==="new"; const back=S.draft&&S.draft.id; S.mode="view"; S.draft=null; S.errors={}; if(wasNew) go(S.tab); else { S.sel=back; renderAll(); } return; }
  if(t.closest("#act-save")){ save(); return; }
  const qn=t.closest("[data-note]"); if(qn){ const ta=$("#d-notes"); ta.value = ta.value ? ta.value.replace(/\s*$/,"")+"\n"+qn.dataset.note : qn.dataset.note; S.draft.notes=ta.value; ta.focus(); return; }
  const un=t.closest("[data-usenotes]"); if(un){ const src=BY_ID.get(un.dataset.usenotes); if(src&&src.notes){ const ta=$("#d-notes"); ta.value = ta.value ? ta.value.replace(/\s*$/,"")+"\n"+src.notes : src.notes; S.draft.notes=ta.value; toast(`Notes copied from #${src.id}`);} return; }
  const op=t.closest("[data-open]"); if(op){ go("o-"+op.dataset.open); return; }
  const cf=t.closest("[data-copyfrom]"); if(cf){ const src=BY_ID.get(cf.dataset.copyfrom); if(src){ const keep={name:S.draft.name,company:S.draft.company,mas:S.draft.mas,phone:S.draft.phone,email:S.draft.email,pay:S.draft.pay,need:S.draft.need,time:S.draft.time,rep:S.draft.rep}; startNew(src); Object.assign(S.draft, Object.fromEntries(Object.entries(keep).filter(([k,v])=>v))); renderEdit(); toast(`Build copied from #${src.id}`);} return; }
});
document.addEventListener("change", e=>{
  const t=e.target;
  if(t.classList.contains("st-sel")){ const r=BY_ID.get(t.dataset.id); if(r) setStatus(r, t.value); return; }
  if(t.id==="asof-date"){ S.asOf = (!t.value||t.value===todayISO()) ? null : t.value; renderAll(); return; }
  if(t.id==="d-flex" && S.draft){ S.draft.flex=t.checked; return; }
});
document.addEventListener("input", e=>{
  const t=e.target;
  if(t.id==="q"){ S.q=t.value; S.shown=100; clearTimeout(S.qt); S.qt=setTimeout(()=>{ if(S.tab!=="orders"||S.sel||S.mode!=="view"){ S.sel=null; S.mode="view"; S.draft=null; S.tab="orders"; history.replaceState(null,"","#orders"); renderAll(); } else renderOrders(); }, 150); return; }
  if(t.closest("#edit-sheet") && t.type!=="checkbox"){ setDraftFrom(t); const live = t.isConnected ? t : document.activeElement; if(live && live.dataset && live.dataset.combo) openPop(live); if(S.errors[t.dataset.k]){ delete S.errors[t.dataset.k]; t.closest(".f")?.classList.remove("err"); } }
});
document.addEventListener("focusin", e=>{ const t=e.target; if(t.dataset && t.dataset.combo && t.closest("#edit-sheet")) openPop(t); });
document.addEventListener("focusout", e=>{ if(e.target===popFor) setTimeout(()=>{ if(document.activeElement!==popFor) closePop(); },120); });
document.addEventListener("keydown", e=>{
  if(popFor && pop && !pop.hidden && e.target===popFor){
    if(e.key==="ArrowDown"){ e.preventDefault(); movePop(1); return; }
    if(e.key==="ArrowUp"){ e.preventDefault(); movePop(-1); return; }
    if(e.key==="Enter"){ e.preventDefault(); choose(popIdx); return; }
    if(e.key==="Escape"){ closePop(); return; }
    if(e.key==="Tab"){ closePop(); }
  }
  if(e.key==="Enter" && e.target.matches && e.target.matches(".qrow, .orow")){ e.target.click(); return; }
  if(e.key==="Enter" && (e.metaKey||e.ctrlKey) && (S.mode==="new"||S.mode==="edit")){ e.preventDefault(); save(); }
  if(e.key==="/" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){ e.preventDefault(); $("#q").focus(); }
});
window.addEventListener("resize", ()=>{ if(popFor) openPop(popFor); });

// ---------- sign in ----------
firebase.initializeApp(window.FIREBASE_CONFIG);
fs = firebase.firestore();
const DOMAIN = (window.ALLOWED_DOMAIN||"gothamsound.com").toLowerCase();
document.addEventListener("click", e=>{
  if(e.target.closest("#btn-signin")){ const p=new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({hd:DOMAIN, prompt:"select_account"}); firebase.auth().signInWithPopup(p).catch(err=>{ if(err.code!=="auth/popup-closed-by-user") $("#signin-err").textContent="Sign-in didn't finish. Try again."; }); }
  if(e.target.closest("#btn-signout")){ idb.clear(); firebase.auth().signOut().then(()=>location.reload()); }
});
let started=false;
firebase.auth().onAuthStateChanged(async u => {
  if(!u){ document.body.classList.add("signed-out"); return; }
  if(!u.email || !u.email.toLowerCase().endsWith("@"+DOMAIN)){
    $("#signin-err").textContent = `${u.email||"That account"} isn't a @${DOMAIN} account. Sign in with your work Google account.`;
    await firebase.auth().signOut(); return;
  }
  document.body.classList.remove("signed-out");
  me = {email:u.email, name:u.displayName||u.email};
  $("#who").textContent = me.email; canWrite = true;
  if(!started){ started=true; start(); }
});
})();
