import { useState, useEffect, useRef, useMemo, Component } from "react";

// ── Brand Colors ──────────────────────────────────────────────────────────────
const TEAL     = "#7C3AED";   // Bold Purple (primary)
const TEAL_L   = "#8B5CF6";
const GOLD     = "#FF5757";   // Vibrant Coral (accent)
const GOLD_L   = "#FF8A8A";
const BG       = "#F8F7FF";   // Soft lavender white
const WHITE    = "#FFFFFF";
const TEXT     = "#1E1B4B";   // Deep indigo text
const TEXT2    = "#6B7280";
const GREEN    = "#10B981";   // Emerald
const AMBER    = "#F59E0B";   // Bright Amber
const RED      = "#EF4444";   // Vivid Red
const BLUE     = "#3B82F6";   // Electric Blue

// ── Lane Config ───────────────────────────────────────────────────────────────
const LANES = {
  investor:  { label: "Investor Match",    icon: "🔨", color: "#F97316",  short: "Inv" },
  fha:       { label: "First-Time Buyer",  icon: "🏠", color: "#10B981",  short: "FHA" },
  moveup:    { label: "Move-Up Buyer",     icon: "⬆️", color: "#3B82F6",  short: "Move" },
  listing:   { label: "Listing Lead",      icon: "📋", color: "#EC4899", short: "List" },
};

// ── Status System (replaces "Tiers") ──────────────────────────────────────────
const STATUSES = ["Active","Warm","Cold","Closed"];
const STATUS_COLORS = { Active: GREEN, Warm: AMBER, Cold: "#94A3B8", Closed: "#8B5CF6" };

// ── Investor Strategies ───────────────────────────────────────────────────────
const STRATEGIES = ["Flip","BRRRR","Buy & Hold","Section 8","House Hack","Any"];

// ── Default Screening Thresholds ──────────────────────────────────────────────
const DEFAULTS = {
  investorMaxPrice: 200000,
  fhaMinPrice: 60000,
  fhaMaxPrice: 250000,
  fhaMinBeds: 3,
  moveupMinPrice: 175000,
  moveupMaxPrice: 400000,
  moveupMinBeds: 4,
  moveupMinSqft: 2000,
  listingMinDOM: 60,
  investorMinBeds: 2,
  investorMaxYearBuilt: 2005,
};

// ── Good Zips (Move-Up Lane) — NE Ohio starter list, editable in Settings ────
const DEFAULT_GOOD_ZIPS = [
  "44067","44141","44147","44264","44236","44224","44321","44333",
  "44256","44646","44720","44718","44212","44203","44281","44685",
  "44313","44223","44312","44319","44240","44262","44060","44094",
];

// ── CSV Column Name Mapping (Matrix exports vary) ─────────────────────────────
const COL_MAP = {
  mls:       ["ML#","MLS#","MLS Listing #","List Number","ListNumber","Listing Number"],
  status:    ["Status","Listing Status","ST"],
  price:     ["List Price","Current Price","LP","Price","ListPrice","Close Price"],
  address:   ["Address","Full Address","Street Address","Property Address"],
  streetNum: ["Street #","St#","Street Number"],
  streetName:["Street Name","St Name","Street Dir","Street"],
  city:      ["City","Town"],
  state:     ["State","ST"],
  zip:       ["Zip","Zip Code","Postal Code","ZipCode"],
  beds:      ["Beds","Bedrooms","BR","Bed","Tot BR","Total Bedrooms","Beds Total"],
  baths:     ["Baths","Total Baths","Bath","Full Baths","Baths Full","BA"],
  halfBaths: ["Half Baths","Baths Half","HB"],
  sqft:      ["SqFt","Sq Ft","SQFT","Building Sq Ft","Total SqFt","Living Area","Sqft Total","Approx SqFt","GLA"],
  yearBuilt: ["Year Built","Yr Blt","YearBuilt","Year Blt"],
  dom:       ["DOM","Days on Market","CDOM","Days On Mkt","ADOM","Market Time"],
  propType:  ["Property Type","Type","Prop Type","PropertyType"],
  style:     ["Style","Architectural Style","Home Style"],
  acres:     ["Acres","Lot Acres","Lot Size Acres"],
  lotSize:   ["Lot Size","Lot Sq Ft","LotSize"],
  remarks:   ["Remarks","Public Remarks","Agent Remarks","Description"],
  origPrice: ["Original Price","Orig Price","Original List Price","List Price Orig"],
  photoUrl:  ["Photo URL","Photo","Photo 1","Main Photo"],
};

function findCol(headers, key) {
  const candidates = COL_MAP[key] || [];
  const headerLower = headers.map(h => h.trim().toLowerCase());
  for (const c of candidates) {
    const idx = headerLower.indexOf(c.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

// ── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "\n" && !inQuotes) { lines.push(current); current = ""; continue; }
    if (ch === "\r" && !inQuotes) continue;
    current += ch;
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  const colIdx = {};
  Object.keys(COL_MAP).forEach(key => { colIdx[key] = findCol(headers, key); });

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = [];
    let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    vals.push(cur.trim());

    const get = (key) => colIdx[key] !== -1 ? (vals[colIdx[key]] || "").trim() : "";
    const getNum = (key) => {
      const raw = get(key).replace(/[^0-9.]/g, "");
      return raw ? parseFloat(raw) : 0;
    };

    // Build address from parts if full address isn't available
    let addr = get("address");
    if (!addr && (get("streetNum") || get("streetName"))) {
      addr = (get("streetNum") + " " + get("streetName")).trim();
    }

    return {
      mls:       get("mls"),
      status:    get("status"),
      price:     getNum("price"),
      address:   addr,
      city:      get("city"),
      state:     get("state") || "OH",
      zip:       get("zip"),
      beds:      getNum("beds"),
      baths:     getNum("baths") + (getNum("halfBaths") * 0.5),
      sqft:      getNum("sqft"),
      yearBuilt: getNum("yearBuilt"),
      dom:       getNum("dom"),
      propType:  get("propType"),
      style:     get("style"),
      acres:     getNum("acres"),
      remarks:   get("remarks"),
      origPrice: getNum("origPrice"),
      photoUrl:  get("photoUrl"),
      pricePerSqft: getNum("sqft") > 0 ? Math.round(getNum("price") / getNum("sqft")) : 0,
      priceReduced: getNum("origPrice") > 0 && getNum("origPrice") > getNum("price"),
      priceDropPct: getNum("origPrice") > 0 ? Math.round(((getNum("origPrice") - getNum("price")) / getNum("origPrice")) * 100) : 0,
    };
  }).filter(r => r.mls && r.price > 0);
}

// ── 4-Lane Screening Engine ──────────────────────────────────────────────────
function screenListings(listings, thresholds, goodZips, roster) {
  return listings.map(listing => {
    const flags = [];
    const notes = [];

    // ── Lane 1: Investor Match ──
    const isInvestorPrice = listing.price <= thresholds.investorMaxPrice;
    const isOlderHome = listing.yearBuilt > 0 && listing.yearBuilt <= thresholds.investorMaxYearBuilt;
    const hasEnoughBeds = listing.beds >= thresholds.investorMinBeds;
    const highDOM = listing.dom >= 30;
    const priceDropped = listing.priceReduced;

    if (isInvestorPrice && (hasEnoughBeds || isOlderHome)) {
      flags.push("investor");
      // Sub-strategy suggestions
      const subs = [];
      if (listing.pricePerSqft > 0 && listing.pricePerSqft < 50 && isOlderHome) subs.push("Flip");
      if (hasEnoughBeds && listing.beds >= 3 && listing.price < 150000) subs.push("BRRRR");
      if (hasEnoughBeds && listing.beds >= 3) subs.push("Buy & Hold");
      if (listing.beds >= 4 || (listing.beds >= 3 && listing.baths >= 2)) subs.push("House Hack");
      if (subs.length === 0) subs.push("Review");
      notes.push("Strategies: " + subs.join(", "));
      if (highDOM) notes.push("High DOM — motivated seller");
      if (priceDropped) notes.push("Price reduced " + listing.priceDropPct + "%");

      // Match to specific investors in roster
      const investorMatches = roster.filter(inv => {
        if (inv.status === "Cold") return false;
        const priceOk = listing.price >= (inv.priceMin || 0) && listing.price <= (inv.priceMax || 999999);
        const bedsOk = listing.beds >= (inv.bedsMin || 0);
        const zipOk = !inv.zips || inv.zips.length === 0 || inv.zips.includes(listing.zip);
        const stratOk = !inv.strategy || inv.strategy === "Any" || subs.includes(inv.strategy);
        return priceOk && bedsOk && zipOk && stratOk;
      });
      listing._investorMatches = investorMatches.map(i => i.name);
    }

    // ── Lane 2: First-Time Buyer ──
    if (listing.price >= thresholds.fhaMinPrice &&
        listing.price <= thresholds.fhaMaxPrice &&
        listing.beds >= thresholds.fhaMinBeds) {
      const remarkLower = (listing.remarks || "").toLowerCase();
      const isBankOwned = remarkLower.includes("bank owned") || remarkLower.includes("foreclosure") || remarkLower.includes("reo") || remarkLower.includes("auction");
      if (!isBankOwned) {
        flags.push("fha");
        if (listing.yearBuilt >= 1980) notes.push("Newer build — likely move-in ready");
        if (listing.dom < 14) notes.push("Fresh listing — act fast");
      }
    }

    // ── Lane 3: Move-Up Buyer ──
    if (listing.price >= thresholds.moveupMinPrice &&
        listing.price <= thresholds.moveupMaxPrice &&
        (listing.beds >= thresholds.moveupMinBeds || listing.sqft >= thresholds.moveupMinSqft)) {
      if (goodZips.length === 0 || goodZips.includes(listing.zip)) {
        flags.push("moveup");
        if (listing.sqft >= 2500) notes.push("Large home — " + listing.sqft.toLocaleString() + " sqft");
        if (listing.acres >= 0.5) notes.push("Large lot — " + listing.acres + " acres");
      }
    }

    // ── Lane 4: Listing Lead ──
    if (listing.dom >= thresholds.listingMinDOM || listing.priceDropPct >= 10) {
      flags.push("listing");
      if (listing.dom >= 90) notes.push("Stale listing — " + listing.dom + " DOM");
      else if (listing.dom >= 60) notes.push("Aging listing — " + listing.dom + " DOM");
      if (listing.priceDropPct >= 10) notes.push("Significant price drop: " + listing.priceDropPct + "%");
    }

    return { ...listing, flags, notes, _investorMatches: listing._investorMatches || [] };
  });
}

// ── Opportunity Score (for sorting within lanes) ─────────────────────────────
function opportunityScore(listing) {
  let score = 0;
  if (listing.flags.length >= 3) score += 30;
  else if (listing.flags.length >= 2) score += 15;
  if (listing.priceReduced) score += 10;
  if (listing.priceDropPct >= 10) score += 10;
  if (listing.dom >= 60) score += 10;
  if (listing.dom >= 30) score += 5;
  if (listing._investorMatches && listing._investorMatches.length > 0) score += 15;
  if (listing.pricePerSqft > 0 && listing.pricePerSqft < 50) score += 10;
  return score;
}

// ── Deal Brief HTML Generator ─────────────────────────────────────────────────
function generateDealBrief(listing, agentInfo) {
  const fmtPrice = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0 });
  return `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
  <div style="background:#1B3A4B;color:#fff;padding:16px 20px;">
    <div style="font-size:18px;font-weight:700;color:#D4A843;">Deal Alert</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px;">The Real Estate Doc — Howard Hanna</div>
  </div>
  <div style="padding:20px;">
    <div style="font-size:16px;font-weight:700;color:#1A2332;margin-bottom:4px;">${listing.address}</div>
    <div style="font-size:13px;color:#5A6777;margin-bottom:16px;">${listing.city}, ${listing.state} ${listing.zip}</div>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#5A6777;">List Price</td><td style="padding:6px 0;font-weight:700;text-align:right;">${fmtPrice(listing.price)}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6777;">Beds / Baths</td><td style="padding:6px 0;text-align:right;">${listing.beds} bed / ${listing.baths} bath</td></tr>
      <tr><td style="padding:6px 0;color:#5A6777;">SqFt</td><td style="padding:6px 0;text-align:right;">${listing.sqft > 0 ? listing.sqft.toLocaleString() : "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6777;">Year Built</td><td style="padding:6px 0;text-align:right;">${listing.yearBuilt || "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6777;">Days on Market</td><td style="padding:6px 0;text-align:right;">${listing.dom}</td></tr>
      ${listing.pricePerSqft > 0 ? `<tr><td style="padding:6px 0;color:#5A6777;">Price / SqFt</td><td style="padding:6px 0;text-align:right;">${fmtPrice(listing.pricePerSqft)}</td></tr>` : ""}
      ${listing.priceReduced ? `<tr><td style="padding:6px 0;color:#D94B4B;">Price Reduced</td><td style="padding:6px 0;text-align:right;color:#D94B4B;font-weight:700;">${listing.priceDropPct}% off original</td></tr>` : ""}
    </table>
    ${listing.notes && listing.notes.length > 0 ? `
    <div style="margin-top:14px;padding:10px 14px;background:#F0F4F8;border-radius:6px;font-size:12px;color:#5A6777;">
      <div style="font-weight:700;color:#1B3A4B;margin-bottom:4px;">Notes</div>
      ${listing.notes.map(n => `<div style="margin-bottom:2px;">• ${n}</div>`).join("")}
    </div>` : ""}
    <div style="margin-top:20px;padding:12px 14px;background:#1B3A4B;border-radius:6px;color:#fff;font-size:12px;">
      <div style="font-weight:700;color:#D4A843;margin-bottom:4px;">Your Agent</div>
      <div>${agentInfo.name} | ${agentInfo.credentials}</div>
      <div>${agentInfo.brokerage}</div>
      <div>📞 ${agentInfo.phone} · ✉ ${agentInfo.email}</div>
    </div>
    <div style="margin-top:12px;font-size:10px;color:#94A3B8;line-height:1.5;">
      This is not an offer or solicitation. Property details sourced from MLS and believed reliable but not guaranteed.
      Contact agent for verification. Equal Housing Opportunity.
    </div>
  </div>
</div>`;
}

// ── Shared Styles ─────────────────────────────────────────────────────────────
const S = {
  app:     { fontFamily: "Georgia,'Times New Roman',serif", background: BG, minHeight: "100vh", color: TEXT },
  card:    { background: WHITE, borderRadius: 12, padding: "22px 24px", marginBottom: 16, boxShadow: "0 4px 14px rgba(124,58,237,0.08)" },
  label:   { display: "block", fontSize: 13, fontWeight: 700, color: TEAL, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  input:   { width: "100%", padding: "12px 14px", borderRadius: 8, border: "2px solid #D8D4F2", fontSize: 15, fontFamily: "Georgia,serif", color: TEXT, boxSizing: "border-box", outline: "none" },
  btn:     (bg, fg="#fff") => ({ background: bg, color: fg, border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Georgia,serif" }),
  tag:     (c) => ({ display: "inline-block", background: c + "18", color: c, border: `1px solid ${c}44`, borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 700, marginRight: 6 }),
  badge:   (c) => ({ display: "inline-block", background: c, color: WHITE, borderRadius: 14, padding: "4px 14px", fontSize: 13, fontWeight: 700 }),
};

// ── Agent Info ─────────────────────────────────────────────────────────────────
const AGENT = {
  name: "Dr. Gina N. Eaton, Ph.D.",
  credentials: "REALTOR®",
  brokerage: "Howard Hanna Real Estate Services",
  phone: "216-269-4536",
  email: "ginaeaton@howardhanna.com",
};

// ── API Helpers ───────────────────────────────────────────────────────────────
const API = "/.netlify/functions";

async function fetchSentLog() {
  try {
    const r = await fetch(`${API}/data?action=sent_mls_list`, { signal: AbortSignal.timeout(10000) });
    if (r.ok) return await r.json();
  } catch (e) { console.warn("Could not fetch send log:", e); }
  return JSON.parse(localStorage.getItem("ds_sent_log") || "{}");
}

async function logSend(data) {
  try {
    const r = await fetch(`${API}/data?action=log_send`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), signal: AbortSignal.timeout(10000),
    });
    if (r.ok) return await r.json();
  } catch (e) { console.warn("Cloud save failed, saving locally:", e); }
  const local = JSON.parse(localStorage.getItem("ds_sent_log") || "{}");
  if (!local[data.mlsNum]) local[data.mlsNum] = [];
  local[data.mlsNum].push(data.sentTo);
  localStorage.setItem("ds_sent_log", JSON.stringify(local));
  return { success: true, local: true };
}

async function fetchRoster() {
  try {
    const r = await fetch(`${API}/data?action=list&tab=Roster`, { signal: AbortSignal.timeout(10000) });
    if (r.ok) return await r.json();
  } catch (e) { console.warn("Could not fetch roster:", e); }
  return JSON.parse(localStorage.getItem("ds_roster") || "[]");
}

async function saveRosterEntry(entry) {
  try {
    const r = await fetch(`${API}/data?action=save_roster&tab=Roster`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry), signal: AbortSignal.timeout(10000),
    });
    if (r.ok) return await r.json();
  } catch (e) { console.warn("Cloud save failed:", e); }
  const local = JSON.parse(localStorage.getItem("ds_roster") || "[]");
  local.push(entry);
  localStorage.setItem("ds_roster", JSON.stringify(local));
  return { success: true, local: true };
}

async function sendDealEmail(to, subject, html) {
  try {
    const r = await fetch(`${API}/send-email`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html, replyTo: AGENT.email }),
      signal: AbortSignal.timeout(15000),
    });
    if (r.ok) return await r.json();
    const err = await r.json();
    return { error: err.error || "Send failed" };
  } catch (e) {
    return { error: e.message };
  }
}

// ── Toast Component ───────────────────────────────────────────────────────────
function Toasts({ toasts, setToasts }) {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts(p => p.slice(1)), 4000);
    return () => clearTimeout(timer);
  }, [toasts, setToasts]);
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, maxWidth: 360 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: t.type === "success" ? GREEN : t.type === "error" ? RED : AMBER, color: "#fff", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 8 }}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "⚠"}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Listing Card ──────────────────────────────────────────────────────────────
function ListingCard({ listing, sentLog, onSend, lane }) {
  const fmtPrice = (n) => "$" + n.toLocaleString("en-US");
  const sentTo = sentLog[listing.mls] || [];
  const wasSent = sentTo.length > 0;

  return (
    <div style={{ ...S.card, borderLeft: `4px solid ${LANES[lane]?.color || TEAL}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: TEXT }}>{listing.address || "No Address"}</div>
          <div style={{ fontSize: 14, color: TEXT2 }}>{listing.city}, {listing.state} {listing.zip}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: TEAL }}>{fmtPrice(listing.price)}</div>
          {listing.priceReduced && <div style={{ fontSize: 13, color: RED, fontWeight: 600 }}>↓ {listing.priceDropPct}% reduced</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, fontSize: 14, color: TEXT2, marginBottom: 10, flexWrap: "wrap" }}>
        <span>{listing.beds} bed / {listing.baths} bath</span>
        {listing.sqft > 0 && <span>{listing.sqft.toLocaleString()} sqft</span>}
        {listing.yearBuilt > 0 && <span>Built {listing.yearBuilt}</span>}
        <span>{listing.dom} DOM</span>
        {listing.pricePerSqft > 0 && <span>${listing.pricePerSqft}/sqft</span>}
      </div>

      {/* Lane Flags */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        {listing.flags.map(f => (
          <span key={f} style={S.tag(LANES[f]?.color || TEAL)}>{LANES[f]?.icon} {LANES[f]?.label}</span>
        ))}
      </div>

      {/* Investor Matches */}
      {listing._investorMatches && listing._investorMatches.length > 0 && (
        <div style={{ fontSize: 14, color: TEAL, fontWeight: 600, marginBottom: 8 }}>
          Matches: {listing._investorMatches.join(", ")}
        </div>
      )}

      {/* Notes */}
      {listing.notes && listing.notes.length > 0 && (
        <div style={{ fontSize: 13, color: TEXT2, marginBottom: 10 }}>
          {listing.notes.map((n, i) => <div key={i}>• {n}</div>)}
        </div>
      )}

      {/* Sent Badge */}
      {wasSent && (
        <div style={{ ...S.badge(GREEN), marginBottom: 8 }}>
          ✓ Sent to: {sentTo.join(", ")}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onSend(listing)} style={S.btn(TEAL)}>✉ Send Deal Brief</button>
        <button onClick={() => {
          const text = `${listing.address}, ${listing.city} ${listing.zip} — ${fmtPrice(listing.price)} | ${listing.beds}bd/${listing.baths}ba | ${listing.sqft > 0 ? listing.sqft.toLocaleString() + "sqft" : ""} | ${listing.dom} DOM | MLS# ${listing.mls}`;
          navigator.clipboard.writeText(text).catch(() => {});
        }} style={S.btn("#64748B")}>📋 Copy</button>
      </div>
    </div>
  );
}

// ── Send Modal ────────────────────────────────────────────────────────────────
function SendModal({ listing, roster, onClose, onSend }) {
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    const email = selectedRecipient ? selectedRecipient.Email : customEmail;
    const name = selectedRecipient ? selectedRecipient.Name : customName;
    if (!email) return;
    setSending(true);
    const html = generateDealBrief(listing, AGENT);
    const subject = `Deal Alert: ${listing.address}, ${listing.city} ${listing.zip} — $${listing.price.toLocaleString()}`;
    const emailResult = await sendDealEmail(email, subject, html);
    if (emailResult.error) {
      setResult({ type: "error", msg: emailResult.error });
    } else {
      await logSend({
        mlsNum: listing.mls,
        address: listing.address,
        price: "$" + listing.price.toLocaleString(),
        lane: listing.flags.join(", "),
        sentTo: name,
        email: email,
      });
      setResult({ type: "success", msg: `Sent to ${name}` });
      onSend(listing.mls, name);
    }
    setSending(false);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: WHITE, borderRadius: 12, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ background: TEAL, borderRadius: "12px 12px 0 0", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: GOLD }}>Send Deal Brief</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{listing.address}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          {result ? (
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{result.type === "success" ? "✅" : "❌"}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: result.type === "success" ? GREEN : RED, marginBottom: 16 }}>{result.msg}</div>
              <button onClick={onClose} style={S.btn(TEAL)}>Done</button>
            </div>
          ) : (
            <>
              {/* Roster Recipients */}
              {roster.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ ...S.label, marginBottom: 10 }}>From Your Roster</div>
                  {roster.filter(r => r.Status !== "Cold").map((r, i) => (
                    <div key={i} onClick={() => { setSelectedRecipient(r); setCustomEmail(""); setCustomName(""); }}
                      style={{ padding: "10px 14px", borderRadius: 6, border: `2px solid ${selectedRecipient?.Name === r.Name ? TEAL : "#E2E8F0"}`, marginBottom: 6, cursor: "pointer", background: selectedRecipient?.Name === r.Name ? TEAL + "08" : WHITE }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: TEXT }}>{r.Name}</div>
                      <div style={{ fontSize: 11, color: TEXT2 }}>{r.Email} · {r.Strategy || "Any"} · <span style={{ color: STATUS_COLORS[r.Status] || AMBER }}>{r.Status}</span></div>
                    </div>
                  ))}
                </div>
              )}
              {/* Custom Recipient */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 10 }}>Or Send to Anyone</div>
                <input placeholder="Name" value={customName} onChange={e => { setCustomName(e.target.value); setSelectedRecipient(null); }} style={{ ...S.input, marginBottom: 8 }} />
                <input placeholder="Email" type="email" value={customEmail} onChange={e => { setCustomEmail(e.target.value); setSelectedRecipient(null); }} style={S.input} />
              </div>
              <button onClick={handleSend} disabled={sending || (!selectedRecipient && !customEmail)}
                style={{ ...S.btn(TEAL), width: "100%", opacity: (sending || (!selectedRecipient && !customEmail)) ? 0.5 : 1 }}>
                {sending ? "Sending..." : "✉ Send Deal Brief"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Roster Manager ────────────────────────────────────────────────────────────
function RosterManager({ roster, setRoster, addToast }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ Name: "", Email: "", Phone: "", Strategy: "Any", PriceMin: "", PriceMax: "", BedsMin: "", Zips: "", Status: "Warm", Notes: "" });

  const handleAdd = async () => {
    if (!form.Name || !form.Email) { addToast("Name and email required", "error"); return; }
    const entry = {
      ...form,
      PriceMin: form.PriceMin || "0",
      PriceMax: form.PriceMax || "999999",
      BedsMin: form.BedsMin || "0",
    };
    await saveRosterEntry(entry);
    setRoster(prev => [...prev, entry]);
    setForm({ Name: "", Email: "", Phone: "", Strategy: "Any", PriceMin: "", PriceMax: "", BedsMin: "", Zips: "", Status: "Warm", Notes: "" });
    setShowForm(false);
    addToast(`${entry.Name} added to roster`, "success");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: TEAL }}>Your Roster ({roster.length})</div>
        <button onClick={() => setShowForm(!showForm)} style={S.btn(TEAL)}>{showForm ? "Cancel" : "+ Add Contact"}</button>
      </div>

      {showForm && (
        <div style={{ ...S.card, border: `2px solid ${GOLD}44` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div><label style={S.label}>Name *</label><input style={S.input} value={form.Name} onChange={e => setForm({ ...form, Name: e.target.value })} /></div>
            <div><label style={S.label}>Email *</label><input style={S.input} type="email" value={form.Email} onChange={e => setForm({ ...form, Email: e.target.value })} /></div>
            <div><label style={S.label}>Phone</label><input style={S.input} value={form.Phone} onChange={e => setForm({ ...form, Phone: e.target.value })} /></div>
            <div><label style={S.label}>Strategy</label>
              <select style={S.input} value={form.Strategy} onChange={e => setForm({ ...form, Strategy: e.target.value })}>
                {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={S.label}>Min Price</label><input style={S.input} placeholder="e.g. 30000" value={form.PriceMin} onChange={e => setForm({ ...form, PriceMin: e.target.value })} /></div>
            <div><label style={S.label}>Max Price</label><input style={S.input} placeholder="e.g. 150000" value={form.PriceMax} onChange={e => setForm({ ...form, PriceMax: e.target.value })} /></div>
            <div><label style={S.label}>Min Beds</label><input style={S.input} placeholder="e.g. 3" value={form.BedsMin} onChange={e => setForm({ ...form, BedsMin: e.target.value })} /></div>
            <div><label style={S.label}>Target Zips (comma-sep)</label><input style={S.input} placeholder="44705,44708,44709" value={form.Zips} onChange={e => setForm({ ...form, Zips: e.target.value })} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>Status</label>
            <div style={{ display: "flex", gap: 8 }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => setForm({ ...form, Status: s })}
                  style={{ ...S.btn(form.Status === s ? STATUS_COLORS[s] : "#E2E8F0", form.Status === s ? WHITE : TEXT2), fontSize: 12, padding: "6px 14px" }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}><label style={S.label}>Notes</label><textarea style={{ ...S.input, minHeight: 60 }} value={form.Notes} onChange={e => setForm({ ...form, Notes: e.target.value })} /></div>
          <button onClick={handleAdd} style={{ ...S.btn(GREEN), width: "100%" }}>Save to Roster</button>
        </div>
      )}

      {roster.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", color: TEXT2 }}>No contacts yet. Add investors and buyers to get started.</div>
      ) : (
        roster.map((r, i) => (
          <div key={i} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: TEXT }}>{r.Name}</div>
              <div style={{ fontSize: 14, color: TEXT2 }}>{r.Email} {r.Phone ? `· ${r.Phone}` : ""}</div>
              <div style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>
                {r.Strategy !== "Any" ? r.Strategy + " · " : ""}
                {r.PriceMin && r.PriceMax ? `$${parseInt(r.PriceMin).toLocaleString()}–$${parseInt(r.PriceMax).toLocaleString()}` : ""}
                {r.BedsMin && parseInt(r.BedsMin) > 0 ? ` · ${r.BedsMin}+ beds` : ""}
                {r.Zips ? ` · Zips: ${r.Zips}` : ""}
              </div>
            </div>
            <span style={S.badge(STATUS_COLORS[r.Status] || AMBER)}>{r.Status}</span>
          </div>
        ))
      )}
    </div>
  );
}

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ fontFamily: "Georgia,serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, padding: 24 }}>
          <div style={{ background: WHITE, borderRadius: 12, padding: 40, maxWidth: 480, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: TEAL, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 13, color: TEXT2, marginBottom: 24 }}>Tap Reload to get back to work. Your data is safe.</div>
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} style={S.btn(TEAL)}>↺ Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ═══════════════════ MAIN APP ═════════════════════════════════════════════════
function DealScreener() {
  // ── State ──
  const [tab, setTab] = useState("home");
  const [listings, setListings] = useState([]);
  const [screened, setScreened] = useState([]);
  const [sentLog, setSentLog] = useState({});
  const [roster, setRoster] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendModal, setSendModal] = useState(null);
  const [thresholds, setThresholds] = useState(DEFAULTS);
  const [goodZips, setGoodZips] = useState(DEFAULT_GOOD_ZIPS);
  const [laneFilter, setLaneFilter] = useState("all");
  const fileRef = useRef(null);

  const addToast = (msg, type = "info") => setToasts(p => [...p, { id: Date.now(), msg, type }]);

  // ── Load data on mount ──
  useEffect(() => {
    fetchSentLog().then(setSentLog);
    fetchRoster().then(data => {
      const mapped = data.map(r => ({
        ...r,
        PriceMin: r.PriceMin || r.priceMin || "0",
        PriceMax: r.PriceMax || r.priceMax || "999999",
        BedsMin: r.BedsMin || r.bedsMin || "0",
        Zips: r.Zips || r.zips || "",
        Status: r.Status || r.status || "Warm",
        Strategy: r.Strategy || r.strategy || "Any",
      }));
      setRoster(mapped);
    });
  }, []);

  // ── CSV Upload Handler ──
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (parsed.length === 0) {
        addToast("No listings found. Check CSV format.", "error");
        setLoading(false);
        return;
      }

      // Check for sold listings
      const soldCount = parsed.filter(l => l.status.toUpperCase() === "S" || l.status.toUpperCase() === "SOLD").length;
      if (soldCount > parsed.length * 0.5) {
        addToast(`⚠ ${soldCount} sold listings detected — this may be a comp export, not Active listings`, "warning");
      }

      // Screen through 4 lanes
      const rosterForMatching = roster.map(r => ({
        name: r.Name,
        strategy: r.Strategy || "Any",
        priceMin: parseInt(r.PriceMin) || 0,
        priceMax: parseInt(r.PriceMax) || 999999,
        bedsMin: parseInt(r.BedsMin) || 0,
        zips: r.Zips ? r.Zips.split(",").map(z => z.trim()) : [],
        status: r.Status || "Warm",
      }));

      const results = screenListings(parsed, thresholds, goodZips, rosterForMatching);
      results.sort((a, b) => opportunityScore(b) - opportunityScore(a));

      setListings(parsed);
      setScreened(results);
      setLoading(false);

      const flagged = results.filter(r => r.flags.length > 0);
      addToast(`${parsed.length} listings loaded · ${flagged.length} flagged across 4 lanes`, "success");
      setTab("results");
      setLaneFilter("all");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Lane Counts ──
  const counts = useMemo(() => {
    const c = { all: 0, investor: 0, fha: 0, moveup: 0, listing: 0, unflagged: 0 };
    screened.forEach(l => {
      if (l.flags.length === 0) { c.unflagged++; return; }
      c.all++;
      l.flags.forEach(f => { if (c[f] !== undefined) c[f]++; });
    });
    return c;
  }, [screened]);

  // ── Filtered listings ──
  const filteredListings = useMemo(() => {
    if (laneFilter === "all") return screened.filter(l => l.flags.length > 0);
    if (laneFilter === "unflagged") return screened.filter(l => l.flags.length === 0);
    return screened.filter(l => l.flags.includes(laneFilter));
  }, [screened, laneFilter]);

  // ── Top Picks (multi-flag + high opportunity score) ──
  const topPicks = useMemo(() => {
    return screened
      .filter(l => l.flags.length > 0)
      .sort((a, b) => opportunityScore(b) - opportunityScore(a))
      .slice(0, 7);
  }, [screened]);

  // ── Handle send completion ──
  const handleSendComplete = (mls, name) => {
    setSentLog(prev => {
      const updated = { ...prev };
      if (!updated[mls]) updated[mls] = [];
      if (!updated[mls].includes(name)) updated[mls].push(name);
      return updated;
    });
  };

  // ── Tabs ──
  const TABS = [
    { id: "home",    label: "Home",    icon: "🏠", show: true },
    { id: "results", label: "Results", icon: "📊", show: screened.length > 0 },
    { id: "roster",  label: "Roster",  icon: "👥", show: true },
    { id: "log",     label: "Send Log",icon: "📤", show: true },
    { id: "settings",label: "Settings",icon: "⚙️", show: true },
  ];

  return (
    <div style={S.app}>
      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL}, #9333EA)`, padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 22, color: WHITE, letterSpacing: 0.5 }}>Deal Screener</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>THE REAL ESTATE DOC</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {screened.length > 0 && <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{screened.length} listings</span>}
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={{ ...S.btn(GOLD, WHITE), fontSize: 15, padding: "10px 22px", borderRadius: 10 }}>
            {loading ? "Loading..." : "📁 Upload CSV"}
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ background: WHITE, borderBottom: "2px solid #E5E1F5", display: "flex", overflowX: "auto", padding: "0 12px" }}>
        {TABS.filter(t => t.show).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "none", border: "none", borderBottom: tab === t.id ? `3px solid ${TEAL}` : "3px solid transparent", padding: "14px 18px", fontSize: 15, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? TEAL : TEXT2, cursor: "pointer", fontFamily: "Georgia,serif", whiteSpace: "nowrap" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "24px 24px 80px", maxWidth: 900, margin: "0 auto" }}>

        {/* ── HOME TAB ── */}
        {tab === "home" && (
          <div>
            {screened.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: 50 }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>📁</div>
                <div style={{ fontWeight: 700, fontSize: 24, color: TEAL, marginBottom: 10 }}>Upload Your MLS Export</div>
                <div style={{ fontSize: 16, color: TEXT2, marginBottom: 24, lineHeight: 1.7 }}>
                  Export an Agent Single Line CSV from Matrix with Active listings.
                  The screener will sort every listing into 4 lanes and surface your best opportunities.
                </div>
                <button onClick={() => fileRef.current?.click()} style={{ ...S.btn(GOLD, WHITE), fontSize: 17, padding: "14px 36px", borderRadius: 10 }}>
                  📁 Upload CSV
                </button>
                <div style={{ marginTop: 28, textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: TEAL, marginBottom: 12 }}>Your 4 Screening Lanes</div>
                  {Object.entries(LANES).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, fontSize: 15 }}>
                      <span style={S.badge(v.color)}>{v.icon} {v.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Dashboard Summary */}
                <div style={{ ...S.card, background: `linear-gradient(135deg, ${TEAL}, #9333EA)`, color: WHITE }}>
                  <div style={{ fontWeight: 700, fontSize: 20, color: WHITE, marginBottom: 16 }}>Screening Results</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {Object.entries(LANES).map(([k, v]) => (
                      <div key={k} onClick={() => { setTab("results"); setLaneFilter(k); }}
                        style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "16px 12px", textAlign: "center", cursor: "pointer", border: `2px solid ${v.color}55` }}>
                        <div style={{ fontSize: 32, fontWeight: 800, color: v.color }}>{counts[k]}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{v.icon} {v.short}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    {counts.unflagged} listings did not match any lane · {screened.length} total loaded
                  </div>
                </div>

                {/* Top Picks */}
                {topPicks.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: TEAL, marginBottom: 12, marginTop: 8 }}>⭐ Top Picks</div>
                    {topPicks.map((l, i) => (
                      <ListingCard key={l.mls + i} listing={l} sentLog={sentLog} onSend={setSendModal} lane={l.flags[0]} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── RESULTS TAB ── */}
        {tab === "results" && (
          <div>
            {/* Lane Filter Buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              <button onClick={() => setLaneFilter("all")}
                style={{ ...S.btn(laneFilter === "all" ? TEAL : "#E5E1F5", laneFilter === "all" ? WHITE : TEXT2), fontSize: 14, padding: "8px 18px" }}>
                All ({counts.all})
              </button>
              {Object.entries(LANES).map(([k, v]) => (
                <button key={k} onClick={() => setLaneFilter(k)}
                  style={{ ...S.btn(laneFilter === k ? v.color : "#E5E1F5", laneFilter === k ? WHITE : TEXT2), fontSize: 14, padding: "8px 18px" }}>
                  {v.icon} {v.short} ({counts[k]})
                </button>
              ))}
              <button onClick={() => setLaneFilter("unflagged")}
                style={{ ...S.btn(laneFilter === "unflagged" ? "#94A3B8" : "#E5E1F5", laneFilter === "unflagged" ? WHITE : TEXT2), fontSize: 14, padding: "8px 18px" }}>
                No Match ({counts.unflagged})
              </button>
            </div>

            {filteredListings.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", color: TEXT2, padding: 30 }}>No listings in this lane.</div>
            ) : (
              filteredListings.map((l, i) => (
                <ListingCard key={l.mls + i} listing={l} sentLog={sentLog} onSend={setSendModal} lane={laneFilter === "all" ? l.flags[0] : laneFilter} />
              ))
            )}
          </div>
        )}

        {/* ── ROSTER TAB ── */}
        {tab === "roster" && (
          <RosterManager roster={roster} setRoster={setRoster} addToast={addToast} />
        )}

        {/* ── SEND LOG TAB ── */}
        {tab === "log" && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: TEAL, marginBottom: 16 }}>Send Log</div>
            {Object.keys(sentLog).length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", color: TEXT2, fontSize: 15 }}>No deals sent yet. Upload a CSV, find a match, and send your first deal brief.</div>
            ) : (
              Object.entries(sentLog).map(([mls, recipients]) => (
                <div key={mls} style={S.card}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: TEXT }}>MLS# {mls}</div>
                  <div style={{ fontSize: 14, color: TEXT2 }}>Sent to: {Array.isArray(recipients) ? recipients.join(", ") : recipients}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: TEAL, marginBottom: 16 }}>Screening Settings</div>

            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 17, color: TEAL, marginBottom: 14 }}>🔨 Investor Lane</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={S.label}>Max Price</label><input style={S.input} type="number" value={thresholds.investorMaxPrice} onChange={e => setThresholds({ ...thresholds, investorMaxPrice: parseInt(e.target.value) || 0 })} /></div>
                <div><label style={S.label}>Min Beds</label><input style={S.input} type="number" value={thresholds.investorMinBeds} onChange={e => setThresholds({ ...thresholds, investorMinBeds: parseInt(e.target.value) || 0 })} /></div>
                <div><label style={S.label}>Max Year Built</label><input style={S.input} type="number" value={thresholds.investorMaxYearBuilt} onChange={e => setThresholds({ ...thresholds, investorMaxYearBuilt: parseInt(e.target.value) || 0 })} /></div>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 17, color: TEAL, marginBottom: 14 }}>🏠 First-Time Buyer Lane</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={S.label}>Min Price</label><input style={S.input} type="number" value={thresholds.fhaMinPrice} onChange={e => setThresholds({ ...thresholds, fhaMinPrice: parseInt(e.target.value) || 0 })} /></div>
                <div><label style={S.label}>Max Price</label><input style={S.input} type="number" value={thresholds.fhaMaxPrice} onChange={e => setThresholds({ ...thresholds, fhaMaxPrice: parseInt(e.target.value) || 0 })} /></div>
                <div><label style={S.label}>Min Beds</label><input style={S.input} type="number" value={thresholds.fhaMinBeds} onChange={e => setThresholds({ ...thresholds, fhaMinBeds: parseInt(e.target.value) || 0 })} /></div>
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 17, color: TEAL, marginBottom: 14 }}>⬆️ Move-Up Buyer Lane</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={S.label}>Min Price</label><input style={S.input} type="number" value={thresholds.moveupMinPrice} onChange={e => setThresholds({ ...thresholds, moveupMinPrice: parseInt(e.target.value) || 0 })} /></div>
                <div><label style={S.label}>Max Price</label><input style={S.input} type="number" value={thresholds.moveupMaxPrice} onChange={e => setThresholds({ ...thresholds, moveupMaxPrice: parseInt(e.target.value) || 0 })} /></div>
                <div><label style={S.label}>Min Beds</label><input style={S.input} type="number" value={thresholds.moveupMinBeds} onChange={e => setThresholds({ ...thresholds, moveupMinBeds: parseInt(e.target.value) || 0 })} /></div>
                <div><label style={S.label}>Min SqFt</label><input style={S.input} type="number" value={thresholds.moveupMinSqft} onChange={e => setThresholds({ ...thresholds, moveupMinSqft: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={S.label}>Good Zips (comma-separated)</label>
                <textarea style={{ ...S.input, minHeight: 60 }} value={goodZips.join(", ")} onChange={e => setGoodZips(e.target.value.split(",").map(z => z.trim()).filter(z => z))} />
              </div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 17, color: TEAL, marginBottom: 14 }}>📋 Listing Lead Lane</div>
              <div><label style={S.label}>Min DOM</label><input style={S.input} type="number" value={thresholds.listingMinDOM} onChange={e => setThresholds({ ...thresholds, listingMinDOM: parseInt(e.target.value) || 0 })} /></div>
            </div>

            <div style={S.card}>
              <div style={{ fontWeight: 700, fontSize: 17, color: TEAL, marginBottom: 10 }}>About</div>
              <div style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7 }}>
                Deal Screener V1 — The Real Estate Doc<br />
                Built by Dr. Gina N. Eaton, Ph.D.<br />
                Howard Hanna Real Estate Services<br />
                Equal Housing Opportunity
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Send Modal ── */}
      {sendModal && (
        <SendModal listing={sendModal} roster={roster} onClose={() => setSendModal(null)} onSend={handleSendComplete} />
      )}

      {/* ── Toasts ── */}
      <Toasts toasts={toasts} setToasts={setToasts} />
    </div>
  );
}

export default function App() { return <ErrorBoundary><DealScreener /></ErrorBoundary>; }
