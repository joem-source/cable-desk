(() => {
"use strict";
// ---------- constants ----------
const STATUSES = ["Submitted","In build","Ready","Picked up","On hold","Cancelled"];
const OPEN = new Set(["Submitted","In build","Ready","On hold"]);
const stClass = s => "s-" + (s||"archived").toLowerCase().replace(/[^a-z]/g,"");
const FIELDS = ["id","sub","need","time","name","mas","phone","email","pay","qty","len","color","outDev","inDev","out","inp","notes","rep","status","quote","appr","apprDate"];
const LABELS = {sub:"Date submitted",need:"Date needed",time:"Time needed",name:"Customer",mas:"MAS ID",phone:"Phone",email:"Email",pay:"Payment / SO#",qty:"Quantity",len:"Length",color:"Cable color",outDev:"Output device",inDev:"Input device",out:"Output connectors",inp:"Input connectors",notes:"Notes",rep:"Sales rep",status:"Status",quote:"Quote",appr:"Approved by",apprDate:"Approved date"};

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

// ---------- helpers ----------
const $ = (s, el=document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad6 = n => String(n).padStart(6,"0");
const todayISO = () => { const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const addDays = (iso,n) => { const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const fmtDate = iso => { if(!iso) return ""; const [y,m,d]=iso.split("-"); return `${+m}/${+d}/${y}`; };
const fmtDay = iso => { if(!iso) return ""; const d=new Date(iso+"T12:00:00"); return d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}); };
const norm = s => String(s||"").toLowerCase().replace(/female/g,"f").replace(/male/g,"m").replace(/right angle/g,"ra").replace(/[^a-z0-9/".]+/g,"");
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function toast(msg){ document.querySelectorAll(".toast").forEach(x=>x.remove()); const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2600); }

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
let HIST = [], HIST_BY = new Map(), VOCAB = null, CUSTS = [];
const LIVE = new Map();           // id -> live doc (new orders + amended history)
let ALL = [], BY_ID = new Map();
let fs = null, me = null, canWrite = false, dbReady = false;
const S = { tab:"queue", sel:null, mode:"view", draft:null, q:"", cust:null, shown:150, errors:{} };

function rebuild(){
  BY_ID = new Map(HIST_BY);
  for(const [id,d] of LIVE) BY_ID.set(id, d);
  ALL = [...BY_ID.values()].sort((a,b)=> (b.sub||"").localeCompare(a.sub||"") || b.id.localeCompare(a.id));
  $("#ct-orders").textContent = ALL.length.toLocaleString();
  $("#ct-queue").textContent = queueItems().length || "";
}
function searchText(r){
  if(r._s) return r._s;
  r._s = [r.id,r.name,r.mas,r.phone,r.email,r.pay,r.outDev,r.inDev,(r.out||[]).join(" "),(r.inp||[]).join(" "),r.notes,r.rep,r.len,r.status,r.color].join(" ").toLowerCase();
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
  const conns=[], devs=[], lens=[], reps=[];
  for(const r of ALL){ (r.out||[]).forEach(x=>conns.push(x)); (r.inp||[]).forEach(x=>conns.push(x)); devs.push(r.outDev, r.inDev); lens.push(r.len); if((r.sub||"")>="2025-01-01") reps.push((r.rep||"").toUpperCase()); }
  VOCAB = { conn: group(conns,6).slice(0,600), dev: group(devs,6).slice(0,600), len: group(lens,10), rep: group(reps,3) };
  const cm = new Map();
  for(let i=ALL.length-1;i>=0;i--){ const r=ALL[i]; if(!r.name) continue; const k=custKey(r.name); let c=cm.get(k); if(!c){ c={name:r.name,mas:"",phone:"",email:"",n:0,last:"",k}; cm.set(k,c); } c.n++; c.last=r.sub||c.last; c.name=r.name; if(r.mas)c.mas=r.mas; if(r.phone)c.phone=r.phone; if(r.email)c.email=r.email; }
  CUSTS = [...cm.values()].sort((a,b)=>b.n-a.n);
}

// ---------- data load ----------
function setLoading(msg){ $("#list").innerHTML = `<div class="loading">${esc(msg)}</div>`; $("#main").innerHTML = `<div class="loading">${esc(msg)}</div>`; }
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
    $("#list").innerHTML = `<div class="empty">Couldn't load orders${e&&e.code==="permission-denied"?": this account doesn't have access":""}. Reload to try again.</div>`; $("#main").innerHTML="";
  }
}
function liveRec(id, data){ const o = Object.assign({}, data); o.id = id; o.out=o.out||[]; o.inp=o.inp||[]; return o; }

// ---------- routing ----------
function route(){
  const h = (location.hash||"").slice(1);
  if(h.startsWith("o-")){ S.sel = h.slice(2); S.mode="view"; if(S.tab==="new") S.tab="orders"; }
  else if(h==="new"){ startNew(); return; }
  else if(h==="orders"||h==="queue"){ S.tab=h; }
  renderAll();
}
window.addEventListener("hashchange", route);
function go(hash){ if(location.hash !== "#"+hash) location.hash = hash; else route(); }

// ---------- rail ----------
function queueItems(){ return ALL.filter(r => OPEN.has(r.status)).sort((a,b)=>(a.need||"9").localeCompare(b.need||"9") || (a.time||"").localeCompare(b.time||"")); }
function filtered(){
  let rows = ALL;
  if(S.cust) rows = rows.filter(r => custKey(r.name)===S.cust);
  const terms = S.q.toLowerCase().split(/\s+/).filter(Boolean);
  if(terms.length) rows = rows.filter(r => { const t=searchText(r); return terms.every(x=>t.includes(x)); });
  return rows;
}
function buildLine(r){
  const o=(r.out||[]).filter(Boolean), i=(r.inp||[]).filter(Boolean);
  const os = o.length>1 ? `${o[0]} +${o.length-1}` : (o[0]||"—");
  const is = i.length>1 ? `${i[0]} +${i.length-1}` : (i[0]||"—");
  return `<b>${esc(os)}</b> → <b>${esc(is)}</b>${r.len?` · ${esc(r.len)}`:""}${r.qty?` · ×${esc(r.qty)}`:""}`;
}
function rowHTML(r){
  const meta = S.tab==="queue" ? `${esc(r.time||"")}` : esc(fmtDate(r.sub));
  return `<button class="row" data-id="${esc(r.id)}" ${S.sel===r.id?'aria-current="true"':""}>
    <span class="cust">${esc(r.name||"(no name)")}</span>
    <span class="meta"><span class="mono">#${esc(r.id)}</span> · ${meta}${r.status&&OPEN.has(r.status)?` <span class="pill ${stClass(r.status)}">${esc(r.status)}</span>`:""}</span>
    <span class="build">${buildLine(r)}${r.outDev||r.inDev?` · ${esc(r.outDev||"?")} → ${esc(r.inDev||"?")}`:""}</span>
  </button>`;
}
function renderRail(){
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.tab===S.tab)));
  const chips = $("#chips");
  chips.innerHTML = S.cust ? `<span class="chip">Customer: ${esc(CUSTS.find(c=>c.k===S.cust)?.name || S.cust)} <button id="clr-cust" aria-label="Clear customer filter">×</button></span>` : "";
  const list = $("#list");
  if(S.tab==="queue" && !S.q && !S.cust){
    const items = queueItems(), today=todayISO(), tmr=addDays(today,1);
    $("#hint").textContent = items.length ? "Open orders, soonest due first." : "";
    if(!items.length){
      list.innerHTML = `<div class="empty">No open orders right now.<br>New orders from the sales team land here until they're picked up.</div>`; return;
    }
    const groups=[["Overdue",r=>r.need&&r.need<today,"overdue"],["Due today",r=>r.need===today],["Due tomorrow",r=>r.need===tmr],["Later",r=>!r.need||r.need>tmr]];
    list.innerHTML = groups.map(([name,fn,cls])=>{ const g=items.filter(fn); return g.length?`<div class="grp ${cls||""}"><span>${name}</span><span>${g.length}</span></div>`+g.map(rowHTML).join(""):""; }).join("");
    return;
  }
  const rows = filtered();
  $("#hint").textContent = (S.q||S.cust) ? `${rows.length.toLocaleString()} matching order${rows.length===1?"":"s"}` : `${rows.length.toLocaleString()} orders, newest first. Search any word: customer, connector, device, SO#, notes.`;
  if(!rows.length){ list.innerHTML = `<div class="empty">Nothing matches “${esc(S.q)}”. Try fewer words, or part of a name.</div>`; return; }
  list.innerHTML = rows.slice(0,S.shown).map(rowHTML).join("") + (rows.length>S.shown ? `<div class="more"><button class="btn" id="more">Show more (${(rows.length-S.shown).toLocaleString()} left)</button></div>` : "");
}

// ---------- sheet (view) ----------
function fv(label, val, cls=""){ return `<div class="f"><span class="lbl">${label}</span><span class="val ${cls}">${val||""}</span></div>`; }
function connsView(arr){ const a=(arr||[]).filter(Boolean); if(!a.length) return `<div class="conn"><span class="n">1</span><span class="val"></span></div>`; return a.map((c,i)=>`<div class="conn"><span class="n">${i+1}</span><span class="val">${esc(c)}</span></div>`).join(""); }

async function renderView(r){
  const main = $("#main");
  const can = canWrite && dbReady;
  const statusBtns = STATUSES.map(s=>`<button class="stbtn" data-status="${esc(s)}" aria-pressed="${r.status===s}" ${can?"":"disabled"}>${esc(s)}</button>`).join("");
  const others = CUSTS.find(c=>c.k===custKey(r.name));
  main.innerHTML = `
  <article class="sheet">
    <div class="sheet-head">
      <button class="btn ghost sm back" id="act-back">← List</button><div class="ordno"><small>Order</small><span class="mono">${esc(r.id)}</span></div>
      <span class="pill ${stClass(r.status)}">${esc(r.status||"Archived")}</span>
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
        ${fv("Name", r.name ? `<button class="linkish" id="cust-link" title="Show every order for this customer">${esc(r.name)}</button>${others&&others.n>1?`<span class="hint">${others.n} orders</span>`:""}` : "")}
        ${fv("MAS ID", esc(r.mas), "mono")}
        ${fv("Phone", esc(r.phone), "mono")}
        ${fv("Email", esc(r.email))}
        ${fv("Payment", esc(r.pay), "mono")}
      </div>
      <div class="fields">
        ${fv("Submitted", esc(fmtDate(r.sub)), "mono")}
        ${fv("Date needed", esc(fmtDate(r.need)), "mono")}
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
  </article>`;
}
function revsHTML(r){
  const rows = [];
  if(r._hist || r.imported) rows.push(`<div class="rev"><time>${esc(fmtDate(r.sub))}</time><span class="chg">Entered in FormDocs${r.rep?` by ${esc(r.rep)}`:""}</span></div>`);
  (r.rev||[]).forEach(v=>{
    const who = v.byName || v.by || "Someone";
    const when = new Date(v.at); const ws = isNaN(when) ? "" : when.toLocaleString(undefined,{month:"numeric",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});
    let what = v.kind==="created" ? `created this order${v.from?` (copied from #${esc(v.from)})`:""}` : v.kind==="status" ? `set status to <b>${esc(v.status)}</b>` : `amended ${esc((v.fields||[]).map(f=>LABELS[f]||f).join(", ")||"the order")}`;
    rows.push(`<div class="rev"><time>${esc(ws)}</time><span><span class="who">${esc(who)}</span> <span class="chg">${what}</span>${v.note?` — “${esc(v.note)}”`:""}</span></div>`);
  });
  return rows.join("") || `<div class="rev chg">No changes recorded.</div>`;
}

// ---------- sheet (edit / new) ----------
function blankDraft(){
  return {id:null, sub:todayISO(), need:"", time:"3:00 PM", name:"", mas:"", phone:"", email:"", pay:"", qty:"1", len:"18\"", color:"Black", outDev:"", inDev:"", out:[""], inp:[""], notes:"", rep:lsGet("cc-rep")||"", status:"Submitted", quote:""};
}
function startNew(from){
  S.tab = S.tab==="queue"?"queue":"orders";
  S.mode="new"; S.sel=null; S.errors={};
  const d = blankDraft();
  if(from){
    ["name","mas","phone","email","qty","len","color","outDev","inDev","notes","quote"].forEach(k=>{ if(from[k]) d[k]=from[k]; });
    d.out=[...(from.out||[])]; d.inp=[...(from.inp||[])]; d._from = from.id;
  }
  S.draft = d; renderAll();
  if(location.hash!=="#new") history.replaceState(null,"","#new");
  setTimeout(()=>{ const el = from ? $("#d-need") : $("#d-name"); el && el.focus(); }, 30);
}
function startEdit(r){
  S.mode="edit"; S.errors={};
  const d = JSON.parse(JSON.stringify(stripRec(r))); d.out = d.out&&d.out.length?d.out:[""]; d.inp=d.inp&&d.inp.length?d.inp:[""];
  S.draft = d; renderMain();
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
  const main = $("#main");
  const errs = Object.values(S.errors);
  main.innerHTML = `
  <article class="sheet" id="edit-sheet">
    <div class="sheet-head">
      <button class="btn ghost sm back" id="act-cancel2">← Back</button><div class="ordno"><small>${isNew?"New order":"Amending order"}</small><span class="mono">${isNew?"auto #":esc(d.id)}</span></div>
      ${d._from?`<span class="hint">Copied from #${esc(d._from)}</span>`:""}
      <div class="actions">
        <button class="btn ghost" id="act-cancel">Cancel</button>
        <label class="printafter"><input type="checkbox" id="d-printafter" ${lsGet("cc-print")!=="0"?"checked":""}> Print when ${isNew?"submitted":"saved"}</label>
        <button class="btn primary" id="act-save">${isNew?"Submit to service":"Save amendment"}</button>
      </div>
    </div>
    ${errs.length?`<div class="sec"><div class="errmsg">${esc(errs.join(" "))}</div></div>`:""}
    <div class="sec grid2">
      <div class="fields">
        ${fi("name","Name",{req:true,combo:"cust",ph:"Customer or company"})}
        ${fi("mas","MAS ID",{mono:true})}
        ${fi("phone","Phone",{mono:true})}
        ${fi("email","Email",{type:"email"})}
        ${fi("pay","Payment",{mono:true,ph:"SO# GS26-…"})}
      </div>
      <div class="fields">
        ${fi("sub","Submitted",{type:"date",mono:true})}
        ${fi("need","Date needed",{type:"date",req:true,mono:true})}
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
  </article>`;
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
      <div class="t">#${esc(r.id)} · ${esc(fmtDate(r.sub))} · ${esc(r.name||"")}<br>${esc(r.outDev||"?")} [${esc(r.out.filter(Boolean).join(", "))}] → ${esc(r.inDev||"?")} [${esc(r.inp.filter(Boolean).join(", "))}] · ${esc(r.len||"")}</div>
      <div class="d">${esc(r.notes||"No notes")}</div>
      <div class="act"><button class="btn sm" data-usenotes="${esc(r.id)}" ${r.notes?"":"disabled"}>Use notes</button><button class="btn sm ghost" data-open="${esc(r.id)}">Open</button></div>
    </div>`).join("")}</div>` : `<div class="hint">No past orders with this connector pair. This one's new.</div>`);
}
function renderCustHistory(){
  const sec = $("#cust-sec"); if(!sec) return;
  const k = custKey(S.draft.name);
  if(!k){ sec.innerHTML=""; sec.hidden=true; return; }
  const rows = ALL.filter(r=>custKey(r.name)===k).slice(0,6);
  if(!rows.length){ sec.hidden=true; return; }
  sec.hidden=false;
  sec.innerHTML = `<div class="sec-title">This customer's recent cables</div><div class="similar">${rows.map(r=>`<div class="sim"><div class="t">#${esc(r.id)} · ${esc(fmtDate(r.sub))}<br>${esc(r.outDev||"?")} [${esc(r.out.filter(Boolean).join(", "))}] → ${esc(r.inDev||"?")} [${esc(r.inp.filter(Boolean).join(", "))}] · ${esc(r.len||"")} ×${esc(r.qty||"")}</div><div class="d">${esc(r.notes||"")}</div><div class="act"><button class="btn sm" data-copyfrom="${esc(r.id)}">Use this build</button></div></div>`).join("")}</div>`;
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
      .map(c=>({v:c.name,note:`${c.n} order${c.n>1?"s":""}${c.mas?" · "+c.mas:""}`,cust:c}));
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
  if(it.cust){ const c=it.cust; ["mas","phone","email"].forEach(k=>{ if(c[k] && !S.draft[k]){ S.draft[k]=c[k]; const el=$("#d-"+k); if(el) el.value=c[k]; } }); renderCustHistory(); }
  closePop();
  // move to next field for speed
  const all=[...document.querySelectorAll("#edit-sheet input, #edit-sheet textarea")]; const nx=all[all.indexOf(input)+1]; nx&&nx.focus();
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
    if(input.dataset.k==="name"){ clearTimeout(setDraftFrom.c); setDraftFrom.c=setTimeout(renderCustHistory,300); }
    if(input.dataset.k==="outDev"||input.dataset.k==="inDev"){ clearTimeout(setDraftFrom.t); setDraftFrom.t=setTimeout(renderSimilar,300); }
  }
}

// ---------- save ----------
function validate(d){
  const e={};
  if(!d.name.trim()) e.name="Add the customer name.";
  if(!d.need) e.need="Pick the date needed.";
  if(!String(d.qty||"").trim()) e.qty="Add a quantity.";
  if(!String(d.rep||"").trim()) e.rep="Add your initials as sales rep.";
  if(!d.out.some(x=>x.trim()) || !d.inp.some(x=>x.trim())) e.conn="Add at least one output and one input connector.";
  return e;
}
function cleanDraft(d){
  const o={};
  for(const k of FIELDS){ let v=d[k]; if(k==="out"||k==="inp"){ v=(v||[]).map(x=>String(x).trim()); while(v.length&&!v[v.length-1]) v.pop(); o[k]=v; } else if(v!==undefined && v!==null){ o[k]=String(v).trim(); } }
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
  const d=S.draft; S.errors=validate(d);
  if(Object.keys(S.errors).length){ renderEdit(); return; }
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
      toast(`Order #${id} submitted to service`); renderAll();
      if(S.printAfter) setTimeout(()=>printOrder(BY_ID.get(id)), 300);
    } else {
      const cur = BY_ID.get(d.id); const next = cleanDraft(d);
      const changed = FIELDS.filter(k => k!=="id" && JSON.stringify(cur[k]??(k==="out"||k==="inp"?[]:"")) !== JSON.stringify(next[k]??(k==="out"||k==="inp"?[]:"")));
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
    if(btn){ btn.disabled=false; btn.textContent=S.mode==="new"?"Submit to service":"Save amendment"; }
  }
  saving=false;
}
async function setStatus(r, status){
  if(!fs||!canWrite||r.status===status) return;
  const now=new Date().toISOString();
  const body = Object.assign({}, stripRec(r), {status, updatedAt:now, rev:[...(r.rev||[]), {at:now,by:me.email,byName:me.name,kind:"status",status}]});
  if(r._hist) body.imported=true;
  try{ await fs.collection("orders").doc(r.id).set(body); LIVE.set(r.id, liveRec(r.id, body)); rebuild(); renderAll(); toast(`#${r.id} → ${status}`); }
  catch(e){ toast("Couldn't update the status. Try again."); }
}
function askNote(cb){
  const bg=document.createElement("div"); bg.className="modal-bg";
  bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh"><h3 id="mh">What changed?</h3><p class="hint" style="margin:0">Optional. Shows in the order history so the service team knows why.</p><textarea id="m-note" placeholder="e.g. Customer wants 24&quot; instead of 18&quot;"></textarea><div class="btns"><button class="btn ghost" id="m-x">Back</button><button class="btn primary" id="m-ok">Save amendment</button></div></div>`;
  document.body.appendChild(bg); $("#m-note").focus();
  $("#m-x").onclick=()=>bg.remove();
  $("#m-ok").onclick=()=>{ const v=$("#m-note").value.trim(); bg.remove(); cb(v); };
}
function summary(r){
  const L=[`Custom cable order #${r.id}`,`Customer: ${r.name||""}${r.mas?` (${r.mas})`:""}`,`Needed: ${fmtDate(r.need)} ${r.time||""}`,`Qty ${r.qty||""} · Length ${r.len||""} · ${r.color||""}`,
    `FROM ${r.outDev||"?"}: ${(r.out||[]).filter(Boolean).join(", ")}`,`TO ${r.inDev||"?"}: ${(r.inp||[]).filter(Boolean).join(", ")}`];
  if(r.notes) L.push(`Notes: ${r.notes}`); if(r.pay) L.push(`Payment: ${r.pay}`); if(r.rep) L.push(`Rep: ${r.rep}`);
  return L.join("\n");
}

// ---------- main render ----------
function renderMain(){
  const main=$("#main");
  document.body.classList.toggle("has-sel", !!(S.sel||S.mode!=="view"));
  if(S.mode==="new"||S.mode==="edit"){ renderEdit(); return; }
  const r = S.sel && BY_ID.get(S.sel);
  if(r){ renderView(r); return; }
  const open=queueItems().length, today=todayISO();
  const due=queueItems().filter(x=>x.need===today).length;
  const yr=String(new Date().getFullYear()); const thisYear=ALL.filter(x=>(x.sub||"").startsWith(yr)).length;
  main.innerHTML = `<div class="placeholder">
    <h2>${S.sel?`Order #${esc(S.sel)} isn't in the system`:"Pick an order, or start a new one"}</h2>
    <p>Search any past cable by customer, connector or device, then duplicate it for a repeat order. New orders go straight to the service queue.</p>
    <div class="stats"><div><b class="mono">${open}</b><span>open</span></div><div><b class="mono">${due}</b><span>due today</span></div><div><b class="mono">${thisYear.toLocaleString()}</b><span>orders in ${yr}</span></div><div><b class="mono">${ALL.length.toLocaleString()}</b><span>on file</span></div></div>
    <button class="btn primary" id="btn-new2">+ New cable order</button>
  </div>`;
}
function renderAll(keepMain){
  renderRail();
  if(keepMain && (S.mode==="new"||S.mode==="edit")) return;
  renderMain();
}

// ---------- print ----------
// One letter page laid out like the FormDocs Custom Cable sheet.
function printOrder(r){
  if(!r) return;
  let el = document.getElementById("print-sheet");
  if(!el){ el=document.createElement("div"); el.id="print-sheet"; document.body.appendChild(el); }
  const box = (l,v,cls="") => `<div class="p-box ${cls}"><span class="p-l">${l}</span><span class="p-v">${esc(v||"")}</span></div>`;
  const conns = arr => { let h=""; for(let i=0;i<8;i++) h+=`<div class="p-conn"><span class="p-n">${i+1}</span><span class="p-v">${esc((arr||[])[i]||"")}</span></div>`; return h; };
  el.innerHTML = `
  <div class="p-head">
    <div class="p-col">${box("MAS ID",r.mas)}${box("Name",r.name)}${box("Phone",r.phone)}${box("Email",r.email)}${box("Payment",r.pay)}</div>
    <div class="p-mid"><div class="p-logo">GOTHAM</div><div class="p-sub">SOUND &amp; COMMUNICATIONS, INC.</div><div class="p-title">Custom Cable</div></div>
    <div class="p-col"><div class="p-order">Order <b>${esc(r.id)}</b></div>${box("Date Submitted",fmtDate(r.sub))}${box("Date Needed",fmtDate(r.need))}${box("Time Needed",r.time)}${box("Status",r.status)}${box("Sales Rep",r.rep)}</div>
  </div>
  <div class="p-rule"></div>
  <div class="p-row3">${box("Quantity",r.qty)}<div>${box("Length",r.len)}<div class="p-tiny">(cable only)</div></div>${box("Cable Color",r.color)}</div>
  <div class="p-ft">
    <div><div class="p-side">Output / From</div>${box("Output Device",r.outDev)}<div class="p-ch">Output Connectors</div>${conns(r.out)}</div>
    <div><div class="p-side">Input / To</div>${box("Input Device",r.inDev)}<div class="p-ch">Input Connectors</div>${conns(r.inp)}</div>
  </div>
  <div class="p-notes"><span class="p-l">Notes</span><div class="p-nv">${esc(r.notes||"")}</div></div>
  <div class="p-row3">${box("Quote",r.quote)}${box("Approved",r.appr)}${box("Date",fmtDate(r.apprDate))}</div>
  <div class="p-row3 p-shop">${box("Built by","")}${box("Date built","")}${box("Checked by","")}</div>
  <div class="p-foot">330 West 38th Street, Ground Floor #105, New York, NY 10018 &nbsp;·&nbsp; Hours: Monday–Friday, 9AM–6PM<br>P: (212) 629-9430 &nbsp; F: (212) 629-9436 &nbsp; service@gothamsound.com &nbsp; www.gothamsound.com</div>
  <div class="p-printed">Printed ${esc(new Date().toLocaleString())}${me?` by ${esc(me.name)}`:""}</div>`;
  window.print();
}

// ---------- events ----------
document.addEventListener("click", e=>{
  const t=e.target;
  const tab=t.closest(".tab"); if(tab){ S.tab=tab.dataset.tab; S.shown=150; if(S.mode!=="view"){ S.mode="view"; S.draft=null; } go(S.tab); return; }
  if(t.closest("#btn-new")||t.closest("#btn-new2")){ startNew(); return; }
  const row=t.closest(".row"); if(row){ S.mode="view"; S.draft=null; go("o-"+row.dataset.id); window.scrollTo(0,0); return; }
  if(t.closest("#more")){ S.shown+=200; renderRail(); return; }
  if(t.closest("#clr-cust")){ S.cust=null; renderRail(); return; }
  const r = S.sel && BY_ID.get(S.sel);
  if(t.closest("#act-dup") && r){ startNew(r); return; }
  if(t.closest("#act-print") && r){ printOrder(r); return; }
  if(t.closest("#act-edit") && r){ startEdit(r); return; }
  if(t.closest("#act-copy") && r){ const txt=summary(r); (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast("Summary copied"),()=>toast("Copy isn't available here")); return; }
  if(t.closest("#cust-link") && r){ S.cust=custKey(r.name); S.q=""; $("#q").value=""; S.tab="orders"; S.shown=150; renderRail(); document.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected",String(x.dataset.tab==="orders"))); return; }
  const sb=t.closest(".stbtn"); if(sb && r && !sb.disabled){ setStatus(r, sb.dataset.status); return; }
  if(t.closest("#act-back")){ S.sel=null; history.replaceState(null,"","#"+S.tab); renderAll(); return; }
  if(t.closest("#act-cancel")||t.closest("#act-cancel2")){ const wasNew=S.mode==="new"; S.mode="view"; S.draft=null; S.errors={}; if(wasNew){ history.replaceState(null,"","#"+S.tab); } renderAll(); return; }
  if(t.closest("#act-save")){ save(); return; }
  const qn=t.closest("[data-note]"); if(qn){ const ta=$("#d-notes"); ta.value = ta.value ? ta.value.replace(/\s*$/,"")+"\n"+qn.dataset.note : qn.dataset.note; S.draft.notes=ta.value; ta.focus(); return; }
  const un=t.closest("[data-usenotes]"); if(un){ const src=BY_ID.get(un.dataset.usenotes); if(src&&src.notes){ const ta=$("#d-notes"); ta.value = ta.value ? ta.value.replace(/\s*$/,"")+"\n"+src.notes : src.notes; S.draft.notes=ta.value; toast(`Notes copied from #${src.id}`);} return; }
  const op=t.closest("[data-open]"); if(op){ S.mode="view"; S.draft=null; go("o-"+op.dataset.open); return; }
  const cf=t.closest("[data-copyfrom]"); if(cf){ const src=BY_ID.get(cf.dataset.copyfrom); if(src){ const keep={name:S.draft.name,mas:S.draft.mas,phone:S.draft.phone,email:S.draft.email,pay:S.draft.pay,need:S.draft.need,time:S.draft.time,rep:S.draft.rep}; startNew(src); Object.assign(S.draft, Object.fromEntries(Object.entries(keep).filter(([k,v])=>v))); renderEdit(); toast(`Build copied from #${src.id}`);} return; }
});
document.addEventListener("input", e=>{
  const t=e.target;
  if(t.id==="q"){ S.q=t.value; S.shown=150; if(S.tab==="queue" && S.q){ S.tab="orders"; } clearTimeout(S.qt); S.qt=setTimeout(renderRail, 120); return; }
  if(t.closest("#edit-sheet")){ setDraftFrom(t); const live = t.isConnected ? t : document.activeElement; if(live && live.dataset && live.dataset.combo) openPop(live); if(S.errors[t.dataset.k]){ delete S.errors[t.dataset.k]; t.closest(".f")?.classList.remove("err"); } }
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
  if(e.key==="Enter" && (e.metaKey||e.ctrlKey) && (S.mode==="new"||S.mode==="edit")){ e.preventDefault(); save(); }
  if(e.key==="/" && document.activeElement.tagName!=="INPUT" && document.activeElement.tagName!=="TEXTAREA"){ e.preventDefault(); $("#q").focus(); }
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
