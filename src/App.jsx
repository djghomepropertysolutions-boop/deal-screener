import { useState, useEffect, useRef, useMemo, useCallback, Component } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// DEAL SCREENER — The Real Estate Doc
// Sprint 1 V3 — Professional Edition
// ═══════════════════════════════════════════════════════════════════════════════

// ── Design System ─────────────────────────────────────────────────────────────
const C = {
  ink: "#0F172A", inkSoft: "#334155", inkMuted: "#94A3B8",
  bg: "#FAFBFC", white: "#FFFFFF", offWhite: "#F8FAFC",
  border: "#E2E8F0", borderLight: "#F1F5F9",
  accent: "#1E3A5F", accentLight: "#2B4C73",
  gold: "#B8860B", goldLight: "#D4A843",
  green: "#047857", greenSoft: "#ECFDF5",
  amber: "#B45309", amberSoft: "#FFFBEB",
  red: "#B91C1C", redSoft: "#FEF2F2",
  blue: "#1D4ED8", purple: "#6D28D9",
};
const FONT = "'Georgia','Times New Roman',serif";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const MONO = "'SF Mono','Fira Code','Consolas',monospace";

// ── Professional Styles ───────────────────────────────────────────────────────
const S = {
  app: { fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.ink },
  card: { background: C.white, borderRadius: 4, padding: "20px 24px", marginBottom: 12, border: `1px solid ${C.border}` },
  cardHover: { background: C.white, borderRadius: 4, padding: "20px 24px", marginBottom: 12, border: `1px solid ${C.border}`, transition: "box-shadow .15s", cursor: "pointer" },
  label: { display: "block", fontSize: 11, fontWeight: 600, fontFamily: SANS, color: C.inkSoft, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 },
  input: { width: "100%", padding: "8px 12px", borderRadius: 3, border: `1px solid ${C.border}`, fontSize: 14, fontFamily: FONT, color: C.ink, boxSizing: "border-box", outline: "none", transition: "border-color .15s" },
  btnPrimary: { background: C.accent, color: C.white, border: "none", borderRadius: 3, padding: "9px 20px", fontSize: 13, fontWeight: 600, fontFamily: SANS, cursor: "pointer", letterSpacing: "0.02em" },
  btnSecondary: { background: "transparent", color: C.inkSoft, border: `1px solid ${C.border}`, borderRadius: 3, padding: "8px 18px", fontSize: 13, fontWeight: 500, fontFamily: SANS, cursor: "pointer" },
  btnDanger: { background: "transparent", color: C.red, border: `1px solid ${C.red}44`, borderRadius: 3, padding: "8px 14px", fontSize: 12, fontWeight: 500, fontFamily: SANS, cursor: "pointer" },
  price: { fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.accent, letterSpacing: "-0.02em" },
  stat: { fontFamily: SANS, fontSize: 13, color: C.inkSoft },
  divider: { width: 1, height: 14, background: C.border, margin: "0 10px", flexShrink: 0 },
  pill: (bg, fg) => ({ display: "inline-flex", alignItems: "center", gap: 4, background: bg, color: fg, borderRadius: 2, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: SANS, letterSpacing: "0.03em" }),
  dot: (c) => ({ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }),
  sectionLabel: { fontSize: 10, fontWeight: 700, fontFamily: SANS, color: C.inkMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 },
};

// ── Status System ─────────────────────────────────────────────────────────────
const STATUSES = ["Active", "Warm", "Cold", "Closed"];
const STATUS_DEF = {
  Active: { color: C.green, desc: "Currently buying — has responded to deals" },
  Warm: { color: C.amber, desc: "Profile on file — ready to receive deals" },
  Cold: { color: C.inkMuted, desc: "Sent 3+ deals with no response" },
  Closed: { color: C.purple, desc: "You've closed a deal with them" },
};
const STRATEGIES = ["Flip","BRRRR","Buy & Hold","Section 8","House Hack","Long-Term Rental","Multifamily","Group Home","Any"];
const CONTACT_TYPES = ["Investor","Buyer","Seller","Wholesaler"];

// ── FMR Rent Reference (NE Ohio) ─────────────────────────────────────────────
const FMR_DATA = {"44102":[700,850,1100,1280],"44103":[650,800,1000,1180],"44104":[620,770,950,1100],"44105":[650,800,1000,1180],"44106":[750,920,1180,1350],"44107":[780,950,1220,1400],"44108":[620,770,950,1100],"44109":[700,850,1100,1280],"44110":[650,800,1000,1180],"44111":[700,850,1100,1280],"44112":[620,770,950,1100],"44113":[750,920,1180,1350],"44114":[780,950,1200,1380],"44115":[700,850,1100,1280],"44116":[800,980,1250,1420],"44117":[650,800,1000,1180],"44118":[750,920,1180,1350],"44119":[680,840,1080,1250],"44120":[700,860,1100,1280],"44121":[720,880,1130,1300],"44122":[800,980,1250,1420],"44124":[780,950,1220,1400],"44125":[700,860,1100,1280],"44126":[750,920,1180,1350],"44127":[600,750,950,1100],"44128":[680,840,1080,1250],"44129":[720,880,1130,1300],"44130":[750,920,1180,1350],"44131":[700,860,1100,1280],"44132":[680,840,1080,1250],"44133":[750,920,1180,1350],"44134":[720,880,1130,1300],"44135":[680,840,1060,1230],"44136":[750,920,1180,1350],"44137":[680,840,1080,1250],"44138":[750,920,1180,1350],"44139":[800,980,1250,1420],"44140":[780,950,1220,1400],"44141":[750,920,1180,1350],"44142":[680,840,1060,1230],"44143":[720,880,1130,1300],"44144":[680,840,1060,1230],"44145":[780,950,1220,1400],"44146":[720,880,1130,1300],"44147":[750,920,1180,1350],"44301":[650,800,1050,1200],"44302":[600,750,950,1100],"44303":[650,800,1050,1200],"44304":[600,750,950,1100],"44305":[600,750,950,1100],"44306":[580,720,900,1050],"44307":[600,750,950,1100],"44310":[620,770,980,1130],"44311":[600,750,950,1100],"44312":[700,870,1100,1280],"44313":[750,920,1180,1350],"44314":[620,770,980,1130],"44319":[700,870,1100,1280],"44320":[650,800,1050,1200],"44321":[750,920,1180,1350],"44333":[800,980,1250,1420],"44701":[550,700,880,1020],"44702":[530,680,850,980],"44703":[530,680,850,980],"44704":[550,700,880,1020],"44705":[530,680,850,980],"44706":[550,700,880,1020],"44707":[530,680,850,980],"44708":[580,730,920,1060],"44709":[600,750,950,1100],"44710":[530,680,850,980],"44714":[550,700,880,1020],"44718":[650,800,1020,1180],"44720":[680,840,1060,1230],"44646":[650,800,1020,1180],"44685":[680,840,1060,1230]};
const DEF_FMR = [650,800,1000,1180];
function getFMR(zip, beds) { const b = Math.min(Math.max(beds, 1), 4) - 1; return (FMR_DATA[zip] || DEF_FMR)[b]; }

// ── All 24 Contacts (from Investor Master List) ──────────────────────────────
const ALL_CONTACTS = [
  { id:"INV-001",name:"Irwin Buhain",email:"irwin@homebuyerplus.com",phone:"",role:"Investor",strategy:"Buy & Hold",priceMax:1200000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:[],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"1-4 units; Cleveland, Akron, Canton" },
  { id:"INV-002",name:"Andres",email:"andres@tauroacquisition.com",phone:"",role:"Investor",strategy:"Flip",priceMax:800000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING"],hardRules:["SFH only"],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Cleveland, Akron, Canton" },
  { id:"INV-003",name:"Taden Hatch",email:"taden@hauerhouses.com",phone:"",role:"Investor",strategy:"Flip",priceMax:4000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:[],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Prefers extremely distressed properties; Cleveland, Akron, Canton" },
  { id:"INV-004",name:"Nick Campo",email:"deals.flashflipllc@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:600000,bedsMin:2,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["SFH<$600K","MF 8-20 units<$1.2M","MHP<$850K"],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also Buy & Hold; SFH/MF/MHP" },
  { id:"INV-005",name:"Isaiah Collier",email:"sweethomepropgroup@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:250000,bedsMin:3,bathsMin:2,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING"],hardRules:["Stay within $250K or less","No foundation issues"],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also long-term rentals; Max $1M but prefers ≤$250K" },
  { id:"BUY-001",name:"Brook",email:"bharville123@gmail.com",phone:"",role:"Buyer",strategy:"House Hack",priceMax:190000,bedsMin:1,bathsMin:1,sqftMin:0,geoRequired:["Warrensville Heights","Maple Heights","Bedford","Bedford Heights","Garfield Heights","Northfield","Sagamore Hills"],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["1-2 units only","No 6+ bed properties","No DODD/group home"],rehab:"Light",braStatus:"No",braExpires:"",status:"Active",notes:"Proof of funds verified; Ready to receive deals",preApproval:"Yes",lender:"" },
  { id:"INV-007",name:"Larry Cox",email:"new2uinvestmentsllc@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:80000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:["Cleveland","Garfield Heights","Cleveland Heights","Parma","Berea","Euclid","Lakewood","Brooklyn"],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["Max $80K HARD ceiling"],rehab:"Light to Moderate",braStatus:"No",braExpires:"",status:"Warm",notes:"1-4 units; Cleveland area and surrounding suburbs" },
  { id:"INV-008",name:"Christopher Shambley",email:"chrisshambley01@gmail.com",phone:"",role:"Investor",strategy:"Buy & Hold",priceMax:100000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:["Warrensville Heights","Maple Heights","Bedford","Bedford Heights","Garfield Heights"],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["ONLY these 5 cities — hard geo fail otherwise"],rehab:"Light to Moderate",braStatus:"Yes",braExpires:"",status:"Warm",notes:"1-4 units; Proof of funds verified" },
  { id:"INV-009",name:"Colton Tolleson",email:"ctolly27@gmail.com",phone:"",role:"Investor",strategy:"BRRRR",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["All-in ≤ 60% ARV","Hard money financing"],rehab:"Light to Moderate",braStatus:"No",braExpires:"",status:"Warm",notes:"Also Buy & Hold; Cleveland, Akron, Canton" },
  { id:"INV-010",name:"Scott Jenkins",email:"scott@dogwoodhomesolutions.com",phone:"",role:"Investor",strategy:"Flip",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:[],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also BRRRR and Buy & Hold; Cleveland, Akron, Canton" },
  { id:"INV-011",name:"Noah Daniels-Wilder",email:"noah@drivejdwlogistics.com",phone:"",role:"Investor",strategy:"BRRRR",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:["East Cleveland"],subTypes:["SING","MULTI"],hardRules:["All-in ≤ 60% ARV — verify EVERY send","Hard money financing"],rehab:"Light to Moderate",braStatus:"No",braExpires:"",status:"Warm",notes:"Also Section 8; No East Cleveland" },
  { id:"INV-012",name:"Cheryl James",email:"ctherejames@gmail.com",phone:"",role:"Investor",strategy:"Multifamily",priceMax:150000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["MULTI"],hardRules:["≤$150K all-in (purchase + rehab)"],rehab:"Light to Moderate",braStatus:"No",braExpires:"",status:"Warm",notes:"Cleveland area and surrounding suburbs" },
  { id:"INV-013",name:"Ivan Torres",email:"ivantorresarchila@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:300000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["7-day inspection","EMD after inspection","30-day close"],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also BRRRR and Buy & Hold" },
  { id:"INV-014",name:"Lourdes Elias Sanchez",email:"lerealtylv@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:500000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["Cash buyer","Allows assignment","15-day close"],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"$300K-$500K range; Also BRRRR and Buy & Hold; Two buy boxes" },
  { id:"WHO-001",name:"Ahmed Khaled",email:"ahmedabdelatif110@gmail.com",phone:"",role:"Wholesaler",strategy:"Any",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["Source/referral ONLY — do NOT send retail deals"],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Wholesaler — referral source only" },
  { id:"WHO-002",name:"Travis Antienowicz",email:"travis.antienowicz0527@gmail.com",phone:"",role:"Wholesaler",strategy:"Any",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["Source/referral ONLY — do NOT send retail deals"],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Wholesaler — referral source only" },
  { id:"INV-017",name:"Victor Blandon",email:"mctvconstruction25@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:[],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also BRRRR/Hold/Multifamily; Prefers distressed; Cleveland, Akron, Canton" },
  { id:"INV-018",name:"Luis Espinal",email:"luiscash4doors@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:[],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also BRRRR/Hold/Multifamily; Prefers distressed; Cleveland, Akron, Canton" },
  { id:"INV-019",name:"Victor",email:"blueroseheights@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:[],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Blue Rose Heights; Also BRRRR/Hold/Multifamily; Prefers distressed" },
  { id:"INV-020",name:"Kelvin Marwane",email:"homesfastrack@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["$1K refundable EMD","14-day inspection","14-30 day flexible close","As-is purchase, no repairs/concessions"],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also BRRRR/Hold/Multifamily; Prefers distressed; Specific offer terms on file" },
  { id:"INV-021",name:"Martin Sands",email:"martinsandcoaching@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:[],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also BRRRR/Hold/Multifamily; Prefers distressed; Cleveland, Akron, Canton" },
  { id:"INV-022",name:"Obed Panda",email:"obed.mavana@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:[],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also BRRRR/Hold/Multifamily; Prefers distressed; Cleveland, Akron, Canton" },
  { id:"INV-023",name:"G Smith",email:"246parrish@gmail.com",phone:"",role:"Investor",strategy:"Flip",priceMax:1000000,bedsMin:0,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:[],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Also BRRRR/Hold/Multifamily; Prefers distressed; Cleveland, Akron, Canton" },
  { id:"INV-024",name:"Matt Beard",email:"mattbeard@mainplacehomes.com",phone:"",role:"Investor",strategy:"Flip",priceMax:150000,bedsMin:2,bathsMin:0,sqftMin:0,geoRequired:[],geoExclude:[],subTypes:["SING","MULTI"],hardRules:["Under $150K","2-4 bed single family or duplex"],rehab:"Full to Cosmetic",braStatus:"No",braExpires:"",status:"Warm",notes:"Prefers distressed; Cleveland, Akron, Canton" },
];

// ── CSV Parser (exact Matrix Agent Single Line) ──────────────────────────────
function parseCSV(text) {
  const lines = []; let cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === "\n" && !inQ) { lines.push(cur); cur = ""; continue; }
    if (ch === "\r" && !inQ) continue;
    cur += ch;
  }
  if (cur.trim()) lines.push(cur);
  if (lines.length < 2) return [];
  // Parse headers with same quote-aware logic as data rows
  const hdrRaw = [];
  { let c = "", q = false;
    for (let i = 0; i < lines[0].length; i++) { const ch = lines[0][i]; if (ch === '"') { q = !q; continue; } if (ch === "," && !q) { hdrRaw.push(c.trim()); c = ""; continue; } c += ch; }
    hdrRaw.push(c.trim());
  }
  const hdr = hdrRaw;
  const fi = (n) => hdr.findIndex(h => h.toLowerCase() === n.toLowerCase());
  const ci = { mls: fi("MLS #"), type: fi("Type"), sub: fi("Sub Type"), status: fi("Status"), date: fi("Status Change Timestamp"), price: fi("Price"), dom: fi("DOM/CDOM"), addr: fi("Address"), city: fi("City"), zip: fi("Postal Code"), beds: fi("Bedrooms Total"), ba: fi("BA"), sqft: fi("Above Grade Finished Area"), acres: fi("Lot Size Acres"), yr: fi("Year Built"), garage: fi("Garage Spaces"), tax: fi("Annual Taxes") };

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const v = []; let c = "", q = false;
    for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { q = !q; continue; } if (ch === "," && !q) { v.push(c.trim()); c = ""; continue; } c += ch; }
    v.push(c.trim());
    const g = (k) => ci[k] >= 0 ? (v[ci[k]] || "").trim() : "";
    const $ = (k) => { const r = g(k).replace(/[$,]/g, ""); return r ? parseFloat(r) : 0; };
    const n = (k) => { const r = g(k).replace(/,/g, ""); return r ? parseFloat(r) : 0; };
    const domRaw = g("dom").split("/"); const dom = parseInt(domRaw[0]) || 0; const cdom = parseInt(domRaw[1]) || dom;
    const baRaw = g("ba"); let bT = 0, bF = 0, bH = 0;
    const baM = baRaw.match(/(\d+)\s*\((\d+)\/(\d+)\)/);
    if (baM) { bT = +baM[1]; bF = +baM[2]; bH = +baM[3]; } else { bT = parseInt(baRaw) || 0; bF = bT; }
    const price = $("price"); const sqft = n("sqft");
    return { mls: g("mls"), type: g("type"), subType: g("sub"), status: g("status"), statusDate: g("date"), price, dom, cdom, address: g("addr"), city: g("city"), zip: g("zip"), beds: n("beds"), baths: bT, fullBaths: bF, halfBaths: bH, sqft, acres: n("acres"), yearBuilt: n("yr"), garage: n("garage"), taxes: $("tax"), ppsf: sqft > 0 ? Math.round(price / sqft) : 0 };
  }).filter(r => r.mls && r.price > 0);
}

// ── Matching Engine ──────────────────────────────────────────────────────────
function matchAll(listings, contacts, sent) {
  const out = {};
  contacts.forEach(ct => {
    if (ct.status === "Cold" || ct.status === "Closed") return;
    if (ct.role === "Wholesaler") return; // Wholesalers excluded from auto-matching
    const mx = [];
    listings.forEach(li => {
      const sigs = []; let fail = false;
      if (li.price > (ct.priceMax || 9999999)) fail = true;
      if (!fail) sigs.push({ l: "Price within range", w: 1 });
      if ((ct.bedsMin || 0) > 0 && li.beds < ct.bedsMin) fail = true;
      if ((ct.bathsMin || 0) > 0 && li.baths < ct.bathsMin) fail = true;
      if ((ct.sqftMin || 0) > 0 && li.sqft > 0 && li.sqft < ct.sqftMin) fail = true;
      if (ct.geoRequired?.length > 0 && !ct.geoRequired.some(g => li.city.toLowerCase() === g.toLowerCase())) fail = true;
      else if (ct.geoRequired?.length > 0) sigs.push({ l: "In target area", w: 2 });
      if (ct.geoExclude?.length > 0 && ct.geoExclude.some(g => li.city.toLowerCase() === g.toLowerCase())) fail = true;
      if (ct.subTypes?.length > 0 && !ct.subTypes.includes("Any") && !ct.subTypes.includes(li.subType)) fail = true;
      if (fail) return;
      const fmr = getFMR(li.zip, li.beds);
      if (li.price > 0 && fmr > 0) { const rr = (fmr / li.price) * 100; if (rr >= 1) sigs.push({ l: `${rr.toFixed(1)}% rent ratio (meets 1% rule)`, w: 2 }); else if (rr >= 0.8) sigs.push({ l: `${rr.toFixed(1)}% rent ratio`, w: 1 }); }
      if (li.dom >= 90) sigs.push({ l: `${li.dom} days — highly motivated`, w: 2 }); else if (li.dom >= 60) sigs.push({ l: `${li.dom} days — motivated`, w: 1.5 }); else if (li.dom >= 30) sigs.push({ l: `${li.dom} days on market`, w: 1 });
      if (li.ppsf > 0 && li.ppsf < 45) sigs.push({ l: `$${li.ppsf}/sqft — below market`, w: 1.5 });
      if (li.taxes > 0 && fmr > 0) { const tr = (li.taxes / (fmr * 12)) * 100; if (tr < 15) sigs.push({ l: `Low tax burden (${tr.toFixed(0)}%)`, w: 1 }); }
      const tw = sigs.reduce((s, x) => s + x.w, 0);
      const conf = tw >= 5 ? "strong" : tw >= 3 ? "good" : "possible";
      const sTo = sent[li.mls] || [];
      mx.push({ ...li, signals: sigs, confidence: conf, alreadySent: sTo.includes(ct.name), sentTo: sTo, fmr });
    });
    mx.sort((a, b) => ({ strong: 0, good: 1, possible: 2 }[a.confidence] || 9) - ({ strong: 0, good: 1, possible: 2 }[b.confidence] || 9));
    if (mx.length > 0) out[ct.id] = { contact: ct, matches: mx };
  });
  return out;
}

// ── Format helpers ────────────────────────────────────────────────────────────
const fmtP = (n) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toasts({ items, set }) {
  useEffect(() => { if (items.length > 0) { const t = setTimeout(() => set(p => p.slice(1)), 3500); return () => clearTimeout(t); } }, [items, set]);
  if (!items.length) return null;
  return (<div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}>
    {items.map(t => <div key={t.id} style={{ background: C.accent, color: C.white, padding: "10px 16px", borderRadius: 3, fontSize: 13, fontFamily: SANS, fontWeight: 500, marginBottom: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>{t.msg}</div>)}
  </div>);
}

// ── Contact Form ──────────────────────────────────────────────────────────────
function ContactForm({ initial, onSave, onCancel }) {
  const blank = { name:"",email:"",phone:"",role:"Investor",strategy:"Any",priceMax:"",bedsMin:"",bathsMin:"",sqftMin:"",geoRequired:"",geoExclude:"",subTypes:"SING,MULTI",hardRules:"",rehab:"",braStatus:"No",braExpires:"",status:"Warm",notes:"",preApproval:"",lender:"" };
  const [f, setF] = useState(() => {
    if (!initial) return blank;
    return { ...initial, geoRequired: (initial.geoRequired || []).join(", "), geoExclude: (initial.geoExclude || []).join(", "), hardRules: (initial.hardRules || []).join("; "), subTypes: (initial.subTypes || []).join(","), priceMax: initial.priceMax || "", bedsMin: initial.bedsMin || "", bathsMin: initial.bathsMin || "", sqftMin: initial.sqftMin || "" };
  });
  const up = (k, v) => setF(p => ({ ...p, [k]: v }));
  const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" };
  return (
    <div style={{ ...S.card, borderLeft: `3px solid ${C.accent}` }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.accent, marginBottom: 16 }}>{initial ? "Edit Contact" : "New Contact"}</div>
      <div style={grid}>
        <div><label style={S.label}>Name</label><input style={S.input} value={f.name} onChange={e => up("name",e.target.value)} /></div>
        <div><label style={S.label}>Email</label><input style={S.input} value={f.email} onChange={e => up("email",e.target.value)} /></div>
        <div><label style={S.label}>Phone</label><input style={S.input} value={f.phone} onChange={e => up("phone",e.target.value)} /></div>
        <div><label style={S.label}>Role</label><select style={S.input} value={f.role} onChange={e => up("role",e.target.value)}>{CONTACT_TYPES.map(r => <option key={r}>{r}</option>)}</select></div>
        <div><label style={S.label}>Strategy</label><select style={S.input} value={f.strategy} onChange={e => up("strategy",e.target.value)}>{STRATEGIES.map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={S.label}>Max Budget</label><input style={S.input} type="number" value={f.priceMax} onChange={e => up("priceMax",e.target.value)} /></div>
        <div><label style={S.label}>Min Beds</label><input style={S.input} type="number" value={f.bedsMin} onChange={e => up("bedsMin",e.target.value)} /></div>
        <div><label style={S.label}>Min Baths</label><input style={S.input} type="number" value={f.bathsMin} onChange={e => up("bathsMin",e.target.value)} /></div>
        <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Target Cities (comma-separated)</label><input style={S.input} value={f.geoRequired} onChange={e => up("geoRequired",e.target.value)} /></div>
        <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Excluded Cities</label><input style={S.input} value={f.geoExclude} onChange={e => up("geoExclude",e.target.value)} /></div>
        <div><label style={S.label}>Buyer Rep Agreement</label><select style={S.input} value={f.braStatus} onChange={e => up("braStatus",e.target.value)}><option>No</option><option>Yes</option><option>Expired</option></select></div>
        <div><label style={S.label}>Agreement Expires</label><input style={S.input} type="date" value={f.braExpires} onChange={e => up("braExpires",e.target.value)} /></div>
        <div><label style={S.label}>Status</label><select style={S.input} value={f.status} onChange={e => up("status",e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={S.label}>Rehab Tolerance</label><input style={S.input} value={f.rehab} onChange={e => up("rehab",e.target.value)} /></div>
        <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Hard Rules (semicolon-separated)</label><input style={S.input} value={f.hardRules} onChange={e => up("hardRules",e.target.value)} /></div>
        <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Notes</label><textarea style={{ ...S.input, minHeight: 48 }} value={f.notes} onChange={e => up("notes",e.target.value)} /></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={() => { if (!f.name) return; onSave({ ...f, id: f.id || "C-" + Date.now(), priceMax: parseInt(f.priceMax) || 9999999, bedsMin: parseInt(f.bedsMin) || 0, bathsMin: parseInt(f.bathsMin) || 0, sqftMin: parseInt(f.sqftMin) || 0, geoRequired: f.geoRequired ? f.geoRequired.split(",").map(s => s.trim()).filter(Boolean) : [], geoExclude: f.geoExclude ? f.geoExclude.split(",").map(s => s.trim()).filter(Boolean) : [], hardRules: f.hardRules ? f.hardRules.split(";").map(s => s.trim()).filter(Boolean) : [], subTypes: f.subTypes ? f.subTypes.split(",").map(s => s.trim()).filter(Boolean) : ["SING","MULTI"] }); }} style={S.btnPrimary}>Save</button>
        <button onClick={onCancel} style={S.btnSecondary}>Cancel</button>
      </div>
    </div>
  );
}

// ── Error Boundary ────────────────────────────────────────────────────────────
class EB extends Component { constructor(p){super(p);this.state={e:false}} static getDerivedStateFromError(){return{e:true}} render(){if(this.state.e)return<div style={{fontFamily:FONT,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><div style={{background:C.white,padding:40,textAlign:"center",borderRadius:4}}><div style={{fontSize:18,fontWeight:700,color:C.accent,marginBottom:16}}>Something went wrong</div><button onClick={()=>{this.setState({e:false});window.location.reload()}} style={S.btnPrimary}>Reload</button></div></div>;return this.props.children} }

// ═══════════════════ MAIN APP ═════════════════════════════════════════════════
function DealScreener() {
  const [tab, setTab] = useState("matches");
  const [listings, setListings] = useState([]);
  const [results, setResults] = useState({});
  const [sent, setSent] = useState({});
  const [contacts, setContacts] = useState(() => JSON.parse(localStorage.getItem("ds_contacts") || "null") || ALL_CONTACTS);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listingCount, setListingCount] = useState(0);
  const [filterContact, setFilterContact] = useState("all");
  const [filterConf, setFilterConf] = useState("good"); // Default: hide "possible" matches
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [thresholds, setThresholds] = useState(() => JSON.parse(localStorage.getItem("ds_thresholds") || "null") || {
    investorMaxPrice: 200000, fhaMinPrice: 60000, fhaMaxPrice: 250000, fhaMinBeds: 3,
    moveupMinPrice: 175000, moveupMaxPrice: 400000, moveupMinBeds: 4, moveupMinSqft: 2000,
    listingMinDOM: 60, minBaths: 0, minSqft: 0
  });
  const [expandedGroups, setExpandedGroups] = useState({});
  const fileRef = useRef(null);
  const toast = useCallback((msg) => setToasts(p => [...p, { id: Date.now(), msg }]), []);

  useEffect(() => {
    (async () => { try { const r = await fetch("/.netlify/functions/data?action=sent_mls_list",{signal:AbortSignal.timeout(8000)}); if(r.ok){setSent(await r.json());return;} }catch(e){} setSent(JSON.parse(localStorage.getItem("ds_sent_log")||"{}")); })();
  }, []);

  useEffect(() => { if (listings.length) { setResults(matchAll(listings, contacts, sent)); } }, [contacts, sent, listings]);
  const saveContacts = (c) => { setContacts(c); localStorage.setItem("ds_contacts", JSON.stringify(c)); };

  const handleUpload = (e) => {
    const file = e.target.files[0]; if (!file) return; setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (!parsed.length) { toast("No valid listings found"); setLoading(false); return; }
      setListings(parsed); setListingCount(parsed.length);
      const r = matchAll(parsed, contacts, sent); setResults(r);
      const total = Object.values(r).reduce((s, x) => s + x.matches.length, 0);
      toast(`${parsed.length} listings screened — ${total} matches found`);
      setLoading(false); setTab("matches");
    };
    reader.readAsText(file); e.target.value = "";
  };

  const stats = useMemo(() => {
    let t = 0, s = 0, g = 0, c = 0;
    Object.values(results).forEach(r => { c++; r.matches.forEach(m => { t++; if (m.confidence==="strong") s++; if (m.confidence==="good") g++; }); });
    return { total: t, strong: s, good: g, possible: t - s - g, contacts: c };
  }, [results]);

  const contactsWithMatches = useMemo(() => Object.values(results).map(r => r.contact).sort((a, b) => a.name.localeCompare(b.name)), [results]);

  const investors = contacts.filter(c => c.role === "Investor");
  const buyers = contacts.filter(c => c.role === "Buyer");
  const sellers = contacts.filter(c => c.role === "Seller");
  const wholesalers = contacts.filter(c => c.role === "Wholesaler");

  const toggleGroup = (id) => setExpandedGroups(p => ({ ...p, [id]: !p[id] }));

  const handleSaveContact = (c) => {
    const updated = editId ? contacts.map(x => x.id === editId ? c : x) : [...contacts, c];
    saveContacts(updated); setShowForm(false); setEditId(null);
    toast(editId ? `${c.name} updated` : `${c.name} added`);
  };

  const handleDeleteContact = (id) => {
    if (!window.confirm("Remove this contact?")) return;
    saveContacts(contacts.filter(c => c.id !== id)); toast("Contact removed");
  };

  const TABS = [
    { id: "matches", label: "Matches", count: stats.total },
    { id: "contacts", label: "Contacts", count: contacts.length },
    { id: "settings", label: "Settings", count: 0 },
  ];

  return (
    <div style={S.app}>
      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${C.accent}, #0F2440)`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/headshot.png" alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)" }} onError={e => { e.target.style.display = "none"; }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.white, letterSpacing: "0.02em" }}>Deal Screener</div>
            <div style={{ fontSize: 10, fontFamily: SANS, color: "rgba(255,255,255,0.45)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Dr. Gina N. Eaton · Howard Hanna</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {listingCount > 0 && <span style={{ fontSize: 12, fontFamily: SANS, color: "rgba(255,255,255,0.5)" }}>{listingCount} listings loaded</span>}
          <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={{ ...S.btnPrimary, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", fontSize: 13, padding: "8px 18px" }}>
            {loading ? "Screening..." : "Upload CSV"}
          </button>
        </div>
      </div>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, transparent)` }} />

      {/* ── Tab Bar ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 28px", gap: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent", padding: "14px 20px 12px", fontSize: 14, fontWeight: tab === t.id ? 700 : 400, fontFamily: SANS, color: tab === t.id ? C.accent : C.inkMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {t.label}
            {t.count > 0 && <span style={{ fontFamily: MONO, fontSize: 11, color: tab === t.id ? C.accent : C.inkMuted, fontWeight: 600 }}>{t.count}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowLegend(!showLegend)} style={{ ...S.btnSecondary, border: "none", fontSize: 12, color: C.inkMuted, padding: "8px 12px" }}>
          {showLegend ? "Hide Guide" : "Status Guide"}
        </button>
      </div>

      {/* ── Legend ── */}
      {showLegend && (
        <div style={{ background: C.offWhite, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", gap: 24, flexWrap: "wrap" }}>
          {STATUSES.map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: SANS }}>
              <div style={S.dot(STATUS_DEF[s].color)} />
              <span style={{ fontWeight: 600, color: C.ink }}>{s}</span>
              <span style={{ color: C.inkMuted }}>— {STATUS_DEF[s].desc}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: SANS }}>
            <span style={{ fontWeight: 600, color: C.green }}>Strong</span><span style={{ color: C.inkMuted }}>3+ signals</span>
            <span style={{ fontWeight: 600, color: C.amber, marginLeft: 12 }}>Good</span><span style={{ color: C.inkMuted }}>2 signals</span>
            <span style={{ fontWeight: 600, color: C.inkMuted, marginLeft: 12 }}>Possible</span><span style={{ color: C.inkMuted }}>1 signal</span>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ padding: "24px 28px 80px", maxWidth: 960, margin: "0 auto" }}>

        {/* ═══ MATCHES ═══ */}
        {tab === "matches" && (
          <div>
            {listings.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: "60px 40px" }}>
                <div style={{ fontSize: 14, fontFamily: SANS, fontWeight: 600, color: C.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Deal Screener</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 12 }}>Upload your MLS export to find matches</div>
                <div style={{ fontSize: 15, color: C.inkSoft, marginBottom: 28, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 28px" }}>
                  Export an Agent Single Line CSV from Matrix. The screener checks every listing against your {contacts.filter(c=>c.role!=="Wholesaler").length} contacts and surfaces the deals worth sending.
                </div>
                <button onClick={() => fileRef.current?.click()} style={{ ...S.btnPrimary, fontSize: 15, padding: "12px 32px" }}>Upload CSV</button>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                  <div style={{ flex: 1, ...S.card, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, fontFamily: SANS, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Matches</div>
                    <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: C.accent, marginTop: 2 }}>{stats.total}</div>
                  </div>
                  <div style={{ flex: 1, ...S.card, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, fontFamily: SANS, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Strong</div>
                    <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: C.green, marginTop: 2 }}>{stats.strong}</div>
                  </div>
                  <div style={{ flex: 1, ...S.card, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, fontFamily: SANS, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Good</div>
                    <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: C.amber, marginTop: 2 }}>{stats.good}</div>
                  </div>
                  <div style={{ flex: 1, ...S.card, padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, fontFamily: SANS, fontWeight: 600, color: C.inkMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Contacts</div>
                    <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: C.ink, marginTop: 2 }}>{stats.contacts}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, fontFamily: SANS, fontWeight: 600, color: C.inkSoft }}>Contact:</label>
                    <select value={filterContact} onChange={e => setFilterContact(e.target.value)} style={{ ...S.input, width: "auto", minWidth: 200, fontSize: 13, fontFamily: SANS }}>
                      <option value="all">All contacts ({stats.total} matches)</option>
                      {contactsWithMatches.map(c => {
                        const count = results[c.id]?.matches.length || 0;
                        return <option key={c.id} value={c.id}>{c.name} — {c.role} ({count})</option>;
                      })}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, fontFamily: SANS, fontWeight: 600, color: C.inkSoft }}>Quality:</label>
                    <select value={filterConf} onChange={e => setFilterConf(e.target.value)} style={{ ...S.input, width: "auto", fontSize: 13, fontFamily: SANS }}>
                      <option value="strong">Strong only</option>
                      <option value="good">Strong + Good</option>
                      <option value="all">Show all (including Possible)</option>
                    </select>
                  </div>
                </div>

                {/* Match Groups */}
                {Object.keys(results).length === 0 ? (
                  <div style={{ ...S.card, textAlign: "center", padding: 40, color: C.inkSoft }}>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No matches found</div>
                    <div style={{ fontSize: 14 }}>Try adjusting buy boxes or uploading listings from a different area.</div>
                  </div>
                ) : (
                  Object.values(results)
                    .filter(r => filterContact === "all" || r.contact.id === filterContact)
                    .map(r => {
                      const confOrder = { strong: 0, good: 1, possible: 2 };
                      const minConf = filterConf === "strong" ? 0 : filterConf === "good" ? 1 : 2;
                      const filtered = r.matches.filter(m => (confOrder[m.confidence] || 2) <= minConf);
                      return { ...r, matches: filtered };
                    })
                    .filter(r => r.matches.length > 0)
                    .sort((a, b) => b.matches.filter(m => m.confidence === "strong").length - a.matches.filter(m => m.confidence === "strong").length || b.matches.length - a.matches.length)
                    .map(({ contact: ct, matches: mx }) => {
                      const open = expandedGroups[ct.id] !== false;
                      const sc = mx.filter(m => m.confidence === "strong").length;
                      return (
                        <div key={ct.id} style={{ marginBottom: 16 }}>
                          <div onClick={() => toggleGroup(ct.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: C.white, border: `1px solid ${C.border}`, borderBottom: open ? "none" : `1px solid ${C.border}`, borderRadius: open ? "4px 4px 0 0" : 4, cursor: "pointer" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={S.dot(STATUS_DEF[ct.status]?.color || C.inkMuted)} />
                              <span style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>{ct.name}</span>
                              <span style={S.pill(C.borderLight, C.inkSoft)}>{ct.role}</span>
                              <span style={{ fontSize: 13, fontFamily: SANS, color: C.inkMuted }}>{ct.strategy}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {sc > 0 && <span style={S.pill(C.greenSoft, C.green)}>{sc} strong</span>}
                              <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.ink }}>{mx.length}</span>
                              <span style={{ fontSize: 12, color: C.inkMuted, fontFamily: SANS }}>{open ? "▾" : "▸"}</span>
                            </div>
                          </div>
                          {open && (
                            <div style={{ border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 4px 4px", padding: "12px 16px", background: C.offWhite }}>
                              {ct.hardRules?.length > 0 && (
                                <div style={{ fontSize: 12, fontFamily: SANS, color: C.amber, fontWeight: 600, padding: "8px 12px", background: C.amberSoft, borderRadius: 3, marginBottom: 10 }}>
                                  Hard Rules: {ct.hardRules.join(" · ")}
                                </div>
                              )}
                              {mx.map((m, i) => {
                                const confColor = m.confidence === "strong" ? C.green : m.confidence === "good" ? C.amber : C.inkMuted;
                                return (
                                  <div key={m.mls + i} style={{ ...S.card, borderLeft: `3px solid ${confColor}`, marginBottom: 8, padding: "14px 18px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{m.address}</div>
                                        <div style={{ fontSize: 13, fontFamily: SANS, color: C.inkSoft }}>{m.city}, OH {m.zip}</div>
                                      </div>
                                      <div style={{ textAlign: "right" }}>
                                        <div style={S.price}>{fmtP(m.price)}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 2 }}>
                                          <div style={S.dot(confColor)} />
                                          <span style={{ fontSize: 11, fontFamily: SANS, fontWeight: 600, color: confColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.confidence}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", marginTop: 8, fontSize: 13, fontFamily: SANS, color: C.inkSoft }}>
                                      <span>{m.beds} bed</span><div style={S.divider} />
                                      <span>{m.baths} bath ({m.fullBaths}F/{m.halfBaths}H)</span><div style={S.divider} />
                                      {m.sqft > 0 && <><span>{m.sqft.toLocaleString()} sqft</span><div style={S.divider} /></>}
                                      <span>{m.yearBuilt || "—"}</span><div style={S.divider} />
                                      <span>{m.dom} days on market</span>
                                      {m.ppsf > 0 && <><div style={S.divider} /><span>{fmtP(m.ppsf)}/sqft</span></>}
                                      {m.taxes > 0 && <><div style={S.divider} /><span>Tax: {fmtP(m.taxes)}/yr</span></>}
                                    </div>
                                    {m.fmr > 0 && <div style={{ fontSize: 12, fontFamily: SANS, color: C.blue, marginTop: 6 }}>Est. rent: {fmtP(m.fmr)}/mo · MLS# {m.mls} · {m.subType}</div>}
                                    <div style={{ marginTop: 8 }}>
                                      {m.signals.map((sg, si) => (
                                        <span key={si} style={{ ...S.pill(C.greenSoft, C.green), marginRight: 6, marginBottom: 4 }}>{sg.l}</span>
                                      ))}
                                    </div>
                                    {m.alreadySent && <div style={{ ...S.pill(C.greenSoft, C.green), marginTop: 6 }}>Sent to: {m.sentTo.join(", ")}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ CONTACTS ═══ */}
        {tab === "contacts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>Contacts</div>
              <button onClick={() => { setShowForm(true); setEditId(null); }} style={S.btnPrimary}>+ Add Contact</button>
            </div>
            {(showForm || editId) && <ContactForm initial={editId ? contacts.find(c => c.id === editId) : null} onSave={handleSaveContact} onCancel={() => { setShowForm(false); setEditId(null); }} />}

            {[{ label: "Investors", items: investors }, { label: "Buyers", items: buyers }, { label: "Sellers", items: sellers }, { label: "Wholesalers", items: wholesalers }]
              .filter(g => g.items.length > 0)
              .map(group => (
                <div key={group.label} style={{ marginBottom: 24 }}>
                  <div style={S.sectionLabel}>{group.label} ({group.items.length})</div>
                  {group.items.map(c => (
                    <div key={c.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 20px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <div style={S.dot(STATUS_DEF[c.status]?.color || C.inkMuted)} />
                          <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{c.name}</span>
                          <span style={S.pill(C.borderLight, C.inkSoft)}>{c.strategy}</span>
                          {c.braStatus === "Yes" && <span style={S.pill(C.greenSoft, C.green)}>Buyer Rep ✓</span>}
                        </div>
                        <div style={{ fontSize: 13, fontFamily: SANS, color: C.inkSoft, marginLeft: 15 }}>
                          {c.email}{c.phone ? ` · ${c.phone}` : ""} · Max: {fmtP(c.priceMax || 0)}
                          {c.bedsMin > 0 ? ` · ${c.bedsMin}+ bed` : ""}
                          {c.bathsMin > 0 ? ` · ${c.bathsMin}+ bath` : ""}
                        </div>
                        {c.geoRequired?.length > 0 && <div style={{ fontSize: 12, fontFamily: SANS, color: C.blue, marginLeft: 15, marginTop: 2 }}>Target: {c.geoRequired.join(", ")}</div>}
                        {c.geoExclude?.length > 0 && <div style={{ fontSize: 12, fontFamily: SANS, color: C.red, marginLeft: 15, marginTop: 2 }}>Excludes: {c.geoExclude.join(", ")}</div>}
                        {c.hardRules?.length > 0 && <div style={{ fontSize: 12, fontFamily: SANS, color: C.amber, marginLeft: 15, marginTop: 2 }}>Rules: {c.hardRules.join(" · ")}</div>}
                        {c.notes && <div style={{ fontSize: 12, fontFamily: SANS, color: C.inkMuted, marginLeft: 15, marginTop: 3, fontStyle: "italic" }}>{c.notes}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => { setEditId(c.id); setShowForm(false); }} style={S.btnSecondary}>Edit</button>
                        <button onClick={() => handleDeleteContact(c.id)} style={S.btnDanger}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {tab === "settings" && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 20 }}>Screening Settings</div>
            {[
              { label: "Investor Lane", fields: [{ key: "investorMaxPrice", name: "Max Price" }]},
              { label: "First-Time Buyer Lane", fields: [{ key: "fhaMinPrice", name: "Min Price" },{ key: "fhaMaxPrice", name: "Max Price" },{ key: "fhaMinBeds", name: "Min Beds" }]},
              { label: "Move-Up Buyer Lane", fields: [{ key: "moveupMinPrice", name: "Min Price" },{ key: "moveupMaxPrice", name: "Max Price" },{ key: "moveupMinBeds", name: "Min Beds" },{ key: "moveupMinSqft", name: "Min SqFt" }]},
              { label: "Listing Lead Lane", fields: [{ key: "listingMinDOM", name: "Min Days on Market" }]},
              { label: "Global Filters", fields: [{ key: "minBaths", name: "Min Baths" },{ key: "minSqft", name: "Min SqFt" }]},
            ].map(section => (
              <div key={section.label} style={{ ...S.card, marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginBottom: 12 }}>{section.label}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {section.fields.map(f => (
                    <div key={f.key}><label style={S.label}>{f.name}</label>
                      <input style={S.input} type="number" value={thresholds[f.key] || 0} onChange={e => {
                        const u = { ...thresholds, [f.key]: parseInt(e.target.value) || 0 };
                        setThresholds(u); localStorage.setItem("ds_thresholds", JSON.stringify(u));
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ ...S.card }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginBottom: 8 }}>About</div>
              <div style={{ fontSize: 14, fontFamily: SANS, color: C.inkSoft, lineHeight: 1.7 }}>
                Deal Screener V3 — The Real Estate Doc<br/>
                Dr. Gina N. Eaton, Ph.D., REALTOR®<br/>
                Howard Hanna Real Estate Services · Equal Housing Opportunity
              </div>
            </div>
          </div>
        )}

      </div>
      <Toasts items={toasts} set={setToasts} />
    </div>
  );
}

export default function App() { return <EB><DealScreener /></EB>; }
