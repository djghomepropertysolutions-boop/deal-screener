import { useState, useEffect, useRef, useMemo, useCallback, Component } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// DEAL SCREENER V6a — Parser + Dual Upload + Comp Processing + Basic Matching
// ═══════════════════════════════════════════════════════════════════════════════

// ── Design System ─────────────────────────────────────────────────────────────
const C={ink:"#0F172A",inkS:"#334155",inkM:"#94A3B8",bg:"#FAFBFC",wh:"#FFFFFF",off:"#F8FAFC",bdr:"#E2E8F0",bdrL:"#F1F5F9",pri:"#1E3A5F",priL:"#2B4C73",gold:"#B8860B",goldL:"#D4A843",grn:"#047857",grnS:"#ECFDF5",amb:"#B45309",ambS:"#FFFBEB",red:"#B91C1C",redS:"#FEF2F2",blu:"#1D4ED8",pur:"#6D28D9"};
const F="'Georgia','Times New Roman',serif";
const FS="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const FM="'SF Mono','Fira Code','Consolas',monospace";
const $f=n=>"$"+n.toLocaleString("en-US",{maximumFractionDigits:0});

// ── FMR Rent Data (NE Ohio) ──────────────────────────────────────────────────
const FD={"44102":[700,850,1100,1280],"44103":[650,800,1000,1180],"44104":[620,770,950,1100],"44105":[650,800,1000,1180],"44106":[750,920,1180,1350],"44107":[780,950,1220,1400],"44108":[620,770,950,1100],"44109":[700,850,1100,1280],"44110":[650,800,1000,1180],"44111":[700,850,1100,1280],"44112":[620,770,950,1100],"44113":[750,920,1180,1350],"44114":[780,950,1200,1380],"44115":[700,850,1100,1280],"44116":[800,980,1250,1420],"44117":[650,800,1000,1180],"44118":[750,920,1180,1350],"44119":[680,840,1080,1250],"44120":[700,860,1100,1280],"44121":[720,880,1130,1300],"44122":[800,980,1250,1420],"44124":[780,950,1220,1400],"44125":[700,860,1100,1280],"44126":[750,920,1180,1350],"44127":[600,750,950,1100],"44128":[680,840,1080,1250],"44129":[720,880,1130,1300],"44130":[750,920,1180,1350],"44131":[700,860,1100,1280],"44132":[680,840,1080,1250],"44133":[750,920,1180,1350],"44134":[720,880,1130,1300],"44135":[680,840,1060,1230],"44136":[750,920,1180,1350],"44137":[680,840,1080,1250],"44138":[750,920,1180,1350],"44139":[800,980,1250,1420],"44141":[750,920,1180,1350],"44143":[720,880,1130,1300],"44144":[680,840,1060,1230],"44145":[780,950,1220,1400],"44146":[720,880,1130,1300],"44147":[750,920,1180,1350],"44301":[650,800,1050,1200],"44302":[600,750,950,1100],"44303":[650,800,1050,1200],"44305":[600,750,950,1100],"44306":[580,720,900,1050],"44307":[600,750,950,1100],"44310":[620,770,980,1130],"44311":[600,750,950,1100],"44312":[700,870,1100,1280],"44313":[750,920,1180,1350],"44314":[620,770,980,1130],"44319":[700,870,1100,1280],"44320":[650,800,1050,1200],"44321":[750,920,1180,1350],"44333":[800,980,1250,1420],"44701":[550,700,880,1020],"44702":[530,680,850,980],"44703":[530,680,850,980],"44704":[550,700,880,1020],"44705":[530,680,850,980],"44706":[550,700,880,1020],"44708":[580,730,920,1060],"44709":[600,750,950,1100],"44718":[650,800,1020,1180],"44720":[680,840,1060,1230],"44646":[650,800,1020,1180]};
const DFR=[650,800,1000,1180];
function getFMR(z,b){const i=Math.min(Math.max(b,1),4)-1;return(FD[z]||DFR)[i];}

// ── Rehab Estimates ──────────────────────────────────────────────────────────
function estRehab(yr,sqft,condition){
  if(!yr||!sqft)return 0;
  const cond=(condition||"").toLowerCase();
  if(cond.includes("new construction"))return Math.round(5*sqft);
  if(cond.includes("updated")||cond.includes("remodeled"))return Math.round(10*sqft);
  if(cond.includes("fixer"))return Math.round(40*sqft);
  // fallback by year
  if(yr<1950)return Math.round(42*sqft);
  if(yr<1970)return Math.round(30*sqft);
  if(yr<1990)return Math.round(20*sqft);
  return Math.round(12*sqft);
}

// ── Status & Strategy Constants ──────────────────────────────────────────────
const STATUSES=["Active","Warm","Cold","Closed"];
const STAT_C={Active:C.grn,Warm:C.amb,Cold:C.inkM,Closed:C.pur};
const STRATEGIES=["Flip","BRRRR","Buy & Hold","Section 8","House Hack","Long-Term Rental","Multifamily","Group Home","Any"];
const ROLES=["Investor","Buyer","Seller","Wholesaler"];

// ── Contacts ─────────────────────────────────────────────────────────────────
const DEF_CT=[
{id:"I01",name:"Irwin Buhain",email:"irwin@homebuyerplus.com",role:"Investor",strategy:"Buy & Hold",priceMax:300000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"1-4 units; CLE/AKR/CAN"},
{id:"I02",name:"Andres",email:"andres@tauroacquisition.com",role:"Investor",strategy:"Flip",priceMax:250000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING"],hardRules:["SFH only"],braStatus:"No",status:"Warm",notes:"CLE/AKR/CAN"},
{id:"I03",name:"Taden Hatch",email:"taden@hauerhouses.com",role:"Investor",strategy:"Flip",priceMax:200000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"Extremely distressed"},
{id:"I04",name:"Nick Campo",email:"deals.flashflipllc@gmail.com",role:"Investor",strategy:"Flip",priceMax:250000,bedsMin:2,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"Also Buy & Hold"},
{id:"I05",name:"Isaiah Collier",email:"sweethomepropgroup@gmail.com",role:"Investor",strategy:"Flip",priceMax:250000,bedsMin:3,bathsMin:2,geoReq:[],geoEx:[],subTypes:["SING"],hardRules:["No foundation issues"],braStatus:"No",status:"Warm",notes:"Also long-term rentals"},
{id:"B01",name:"Brook",email:"bharville123@gmail.com",role:"Buyer",strategy:"House Hack",priceMax:190000,bedsMin:1,bathsMin:1,geoReq:["Warrensville Heights","Maple Heights","Bedford","Bedford Heights","Garfield Heights","Northfield","Sagamore Hills"],geoEx:[],subTypes:["SING","MULTI"],hardRules:["1-2 units only","No 6+ beds","No DODD"],braStatus:"No",status:"Active",notes:"POF verified"},
{id:"I07",name:"Larry Cox",email:"new2uinvestmentsllc@gmail.com",role:"Investor",strategy:"Flip",priceMax:80000,bedsMin:0,bathsMin:0,geoReq:["Cleveland","Garfield Heights","Cleveland Heights","Parma","Berea","Euclid","Lakewood","Brooklyn"],geoEx:[],subTypes:["SING","MULTI"],hardRules:["$80K HARD ceiling"],braStatus:"No",status:"Warm",notes:"1-4 units"},
{id:"I08",name:"Christopher Shambley",email:"chrisshambley01@gmail.com",role:"Investor",strategy:"Buy & Hold",priceMax:100000,bedsMin:0,bathsMin:0,geoReq:["Warrensville Heights","Maple Heights","Bedford","Bedford Heights","Garfield Heights"],geoEx:[],subTypes:["SING","MULTI"],hardRules:["ONLY these 5 cities"],braStatus:"Yes",status:"Warm",notes:"POF verified"},
{id:"I09",name:"Colton Tolleson",email:"ctolly27@gmail.com",role:"Investor",strategy:"BRRRR",priceMax:185000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:["All-in ≤60% ARV"],braStatus:"No",status:"Warm",notes:"Also Buy & Hold"},
{id:"I10",name:"Scott Jenkins",email:"scott@dogwoodhomesolutions.com",role:"Investor",strategy:"Flip",priceMax:250000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"Also BRRRR/Hold"},
{id:"I11",name:"Noah Daniels-Wilder",email:"noah@drivejdwlogistics.com",role:"Investor",strategy:"BRRRR",priceMax:175000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:["East Cleveland"],subTypes:["SING","MULTI"],hardRules:["All-in ≤60% ARV"],braStatus:"No",status:"Warm",notes:"Also Section 8"},
{id:"I12",name:"Cheryl James",email:"ctherejames@gmail.com",role:"Investor",strategy:"Multifamily",priceMax:250000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["MULTI"],hardRules:["Multifamily only"],braStatus:"No",status:"Warm",notes:"Cleveland area"},
{id:"I13",name:"Ivan Torres",email:"ivantorresarchila@gmail.com",role:"Investor",strategy:"Flip",priceMax:200000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:["7-day inspection","30-day close"],braStatus:"No",status:"Warm",notes:"Also BRRRR/Hold"},
{id:"I14",name:"Lourdes Elias Sanchez",email:"lerealtylv@gmail.com",role:"Investor",strategy:"Flip",priceMax:300000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:["Cash buyer","15-day close"],braStatus:"No",status:"Warm",notes:"Also BRRRR/Hold"},
{id:"W01",name:"Ahmed Khaled",email:"ahmedabdelatif110@gmail.com",role:"Wholesaler",strategy:"Any",priceMax:1000000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:["Referral ONLY"],braStatus:"No",status:"Warm",notes:"Wholesaler"},
{id:"W02",name:"Travis Antienowicz",email:"travis.antienowicz0527@gmail.com",role:"Wholesaler",strategy:"Any",priceMax:1000000,bedsMin:0,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:["Referral ONLY"],braStatus:"No",status:"Warm",notes:"Wholesaler"},
{id:"I17",name:"Victor Blandon",email:"mctvconstruction25@gmail.com",role:"Investor",strategy:"Flip",priceMax:100000,bedsMin:2,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"Distressed; BRRRR/Hold"},
{id:"I18",name:"Luis Espinal",email:"luiscash4doors@gmail.com",role:"Investor",strategy:"Flip",priceMax:175000,bedsMin:2,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"Distressed; BRRRR/Hold"},
{id:"I19",name:"Victor",email:"blueroseheights@gmail.com",role:"Investor",strategy:"Flip",priceMax:150000,bedsMin:2,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"Blue Rose Heights; Distressed"},
{id:"I20",name:"Kelvin Marwane",email:"homesfastrack@gmail.com",role:"Investor",strategy:"Flip",priceMax:125000,bedsMin:2,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:["$1K EMD","14-day inspection","As-is"],braStatus:"No",status:"Warm",notes:"Distressed; Specific terms"},
{id:"I21",name:"Martin Sands",email:"martinsandcoaching@gmail.com",role:"Investor",strategy:"Flip",priceMax:160000,bedsMin:2,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"Distressed; BRRRR/Hold"},
{id:"I22",name:"Obed Panda",email:"obed.mavana@gmail.com",role:"Investor",strategy:"Flip",priceMax:120000,bedsMin:2,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"Distressed; BRRRR/Hold"},
{id:"I23",name:"G Smith",email:"246parrish@gmail.com",role:"Investor",strategy:"Flip",priceMax:50000,bedsMin:2,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:[],braStatus:"No",status:"Warm",notes:"Distressed; BRRRR/Hold"},
{id:"I24",name:"Matt Beard",email:"mattbeard@mainplacehomes.com",role:"Investor",strategy:"Flip",priceMax:150000,bedsMin:2,bathsMin:0,geoReq:[],geoEx:[],subTypes:["SING","MULTI"],hardRules:["Under $150K"],braStatus:"No",status:"Warm",notes:"2-4 bed SFH/duplex; Distressed"},
];

// ── CSV Parser (48-column Deal Screener Export) ──────────────────────────────
function parseCSV(text){
  const lines=[];let cur="",inQ=false;
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){inQ=!inQ;continue;}if(ch==="\n"&&!inQ){lines.push(cur);cur="";continue;}if(ch==="\r"&&!inQ)continue;cur+=ch;}
  if(cur.trim())lines.push(cur);
  if(lines.length<2)return[];
  // Quote-aware header parsing
  const hdr=[];{let c="",q=false;for(let i=0;i<lines[0].length;i++){const ch=lines[0][i];if(ch==='"'){q=!q;continue;}if(ch===","&&!q){hdr.push(c.trim());c="";continue;}c+=ch;}hdr.push(c.trim());}
  const fi=n=>hdr.findIndex(h=>h.toLowerCase()===n.toLowerCase());
  // Map all 48 columns
  const ci={addr:fi("Address"),city:fi("City"),county:fi("County"),price:fi("Current Price"),zip:fi("Postal Code"),subType:fi("Property Sub Type"),propType:fi("Property Type"),units:fi("# Units Total"),sqft:fi("Above Grade Finished Area"),style:fi("Architectural Style"),basement:fi("Basement"),bathsFull:fi("Bathrooms Full"),bathsHalf:fi("Bathrooms Half"),beds:fi("Bedrooms Total"),bga:fi("Below Grade Finished Area"),garage:fi("Garage Spaces"),acres:fi("Lot Size Acres"),stories:fi("Stories"),yr:fi("Year Built"),tax:fi("Annual Taxes"),assocYN:fi("Association YN"),grossRent:fi("Gross Rent Total"),homestead:fi("Homestead Exemption YN"),insurance:fi("Insurance Cost"),noi:fi("Net Operating Income"),opex:fi("Operating Expense"),avm:fi("Realist AVM"),domCdom:fi("DOM/CDOM"),onMktDate:fi("On Market Date"),origPrice:fi("Original List Price"),prevPrice:fi("Previous List Price"),priceChgDate:fi("Price Change Timestamp"),buyerFin:fi("Buyer Financing"),closeDate:fi("Close Date"),closePrice:fi("Close Price"),sellerCC:fi("Seller Paid Closing Costs"),courtOrdered:fi("Court Ordered YN"),leases:fi("Existing Leases"),foundation:fi("Foundation Details"),listTerms:fi("Listing Terms"),occupant:fi("Occupant Type"),condition:fi("Property Condition"),remarks:fi("Public Remarks"),delinquent:fi("Realist Delinquent"),foreclosure:fi("Realist Foreclosure"),school:fi("School District"),agentRemarks:fi("Agent Only Remarks"),zoning:fi("Zoning")};
  return lines.slice(1).filter(l=>l.trim()).map(line=>{
    const v=[];let c="",q=false;
    for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){q=!q;continue;}if(ch===","&&!q){v.push(c.trim());c="";continue;}c+=ch;}v.push(c.trim());
    const g=k=>ci[k]>=0?(v[ci[k]]||"").trim():"";
    const mn=k=>{const r=g(k).replace(/[$,]/g,"");return r?parseFloat(r):0;};
    const price=mn("price");const sqft=mn("sqft");const avm=mn("avm");
    const domR=g("domCdom").split("/");const dom=parseInt(domR[0])||0;const cdom=parseInt(domR[1])||dom;
    const closeP=mn("closePrice");
    const origP=mn("origPrice");const prevP=mn("prevPrice");
    // Composite key (MLS# missing from export)
    const key=(g("addr")+"|"+g("city")+"|"+g("zip")).toLowerCase();
    // Map sub type from full name to short code
    let st=g("subType");
    if(st.toLowerCase().includes("single"))st="SING";
    else if(st.toLowerCase().includes("condo"))st="CONDO";
    else if(st.toLowerCase().includes("multi")||st.toLowerCase().includes("duplex")||st.toLowerCase().includes("triplex"))st="MULTI";
    else if(st.toLowerCase().includes("land"))st="LAND";
    return{key,addr:g("addr"),city:g("city"),county:g("county"),price,zip:g("zip"),subType:st,subTypeFull:g("subType"),propType:g("propType"),units:mn("units"),sqft,style:g("style"),basement:g("basement"),bathsFull:mn("bathsFull"),bathsHalf:mn("bathsHalf"),baths:mn("bathsFull")+mn("bathsHalf")*0.5,beds:mn("beds"),bga:mn("bga"),garage:mn("garage"),acres:mn("acres"),stories:g("stories"),yr:mn("yr"),tax:mn("tax"),assocYN:g("assocYN"),grossRent:mn("grossRent"),homestead:g("homestead"),insurance:mn("insurance"),noi:mn("noi"),opex:mn("opex"),avm,dom,cdom,onMktDate:g("onMktDate"),origPrice:origP,prevPrice:prevP,priceChgDate:g("priceChgDate"),buyerFin:g("buyerFin"),closeDate:g("closeDate"),closePrice:closeP,sellerCC:mn("sellerCC"),courtOrdered:g("courtOrdered"),leases:g("leases"),foundation:g("foundation"),listTerms:g("listTerms"),occupant:g("occupant"),condition:g("condition"),remarks:g("remarks"),delinquent:g("delinquent"),foreclosure:g("foreclosure"),school:g("school"),agentRemarks:g("agentRemarks"),zoning:g("zoning"),
    // Computed
    ppsf:sqft>0?Math.round(price/sqft):0,
    reduced:origP>0&&origP>price,
    dropPct:origP>0?Math.round((origP-price)/origP*100):0,
    isSold:closeP>0&&g("closeDate")!=="",
    };
  }).filter(r=>r.addr&&(r.price>0||r.closePrice>0));
}

// ── Sold Comp Processor ──────────────────────────────────────────────────────
function buildCompData(soldListings){
  const byZip={};
  soldListings.forEach(s=>{
    if(!s.zip)return;
    const soldP=s.closePrice||s.price;
    const sf=s.sqft;
    if(!soldP||!sf||sf<=0)return;
    const ppsf=Math.round(soldP/sf);
    if(!byZip[s.zip])byZip[s.zip]={prices:[],ppsfs:[],count:0};
    byZip[s.zip].prices.push(soldP);
    byZip[s.zip].ppsfs.push(ppsf);
    byZip[s.zip].count++;
  });
  Object.keys(byZip).forEach(z=>{
    const d=byZip[z];
    d.avgPpsf=Math.round(d.ppsfs.reduce((a,b)=>a+b,0)/d.ppsfs.length);
    d.medPrice=d.prices.sort((a,b)=>a-b)[Math.floor(d.prices.length/2)];
    d.avgPrice=Math.round(d.prices.reduce((a,b)=>a+b,0)/d.prices.length);
  });
  return byZip;
}

// ── Matching Engine (V6a: basic buy-box + opportunity signals) ────────────────
function matchAll(listings,contacts,compData,sent){
  const out={};
  contacts.forEach(ct=>{
    if(ct.status==="Cold"||ct.status==="Closed"||ct.role==="Wholesaler")return;
    const mx=[];
    listings.forEach(li=>{
      if(li.isSold)return; // Don't match sold listings
      // Buy box pass/fail
      if(li.price>(ct.priceMax||9999999))return;
      if((ct.bedsMin||0)>0&&li.beds<ct.bedsMin)return;
      if((ct.bathsMin||0)>0&&li.baths<ct.bathsMin)return;
      if(ct.geoReq?.length>0&&!ct.geoReq.some(g=>li.city.toLowerCase()===g.toLowerCase()))return;
      if(ct.geoEx?.length>0&&ct.geoEx.some(g=>li.city.toLowerCase()===g.toLowerCase()))return;
      if(ct.subTypes?.length>0&&!ct.subTypes.includes("Any")&&!ct.subTypes.includes(li.subType))return;
      // Isaiah foundation check
      if(ct.hardRules?.some(r=>r.toLowerCase().includes("foundation"))&&li.foundation&&li.foundation.toLowerCase().includes("damage"))return;

      const sigs=[];
      // ARV comparison (Realist AVM primary, comp data secondary)
      const arv=li.avm||(compData[li.zip]?compData[li.zip].avgPpsf*li.sqft:0);
      if(arv>0&&li.price>0){
        const arvRatio=li.price/arv;
        if(arvRatio<=0.6)sigs.push({l:"Price is "+Math.round((1-arvRatio)*100)+"% below estimated value ("+$f(arv)+")",w:3});
        else if(arvRatio<=0.75)sigs.push({l:"Price is "+Math.round((1-arvRatio)*100)+"% below est. value ("+$f(arv)+")",w:2});
        else if(arvRatio<=0.85)sigs.push({l:"Priced "+Math.round((1-arvRatio)*100)+"% below est. value",w:1});
      }
      // Geo match
      if(ct.geoReq?.length>0)sigs.push({l:"In target area ("+li.city+")",w:1.5});
      // Rent ratio
      const rent=li.grossRent||getFMR(li.zip,li.beds);
      if(rent>0&&li.price>0){
        const rr=(rent/li.price)*100;
        if(rr>=1.2)sigs.push({l:rr.toFixed(1)+"% rent ratio — strong cash flow",w:2});
        else if(rr>=1.0)sigs.push({l:rr.toFixed(1)+"% rent ratio (1% rule)",w:1.5});
        else if(rr>=0.8)sigs.push({l:rr.toFixed(1)+"% rent ratio",w:0.5});
      }
      // DOM
      if(li.dom>=90)sigs.push({l:li.dom+" days — highly motivated",w:1.5});
      else if(li.dom>=60)sigs.push({l:li.dom+" days — motivated",w:1});
      // Price reduction
      if(li.reduced&&li.dropPct>=10)sigs.push({l:"Price reduced "+li.dropPct+"% from "+$f(li.origPrice),w:1.5});
      else if(li.reduced)sigs.push({l:"Price reduced "+li.dropPct+"%",w:0.5});
      // Condition
      if((li.condition||"").toLowerCase().includes("fixer"))sigs.push({l:"Listed as Fixer",w:1});
      // Foreclosure / Court Ordered
      if(li.foreclosure==="Yes")sigs.push({l:"Realist Foreclosure flag",w:1.5});
      if(li.courtOrdered==="Yes")sigs.push({l:"Court ordered sale",w:1});
      // Vacant
      if(li.occupant==="Vacant")sigs.push({l:"Vacant — immediate access",w:0.5});
      // Tenant in place
      if(li.occupant==="Tenant")sigs.push({l:"Tenant in place — income from day 1",w:0.5});
      // Multifamily bonus for multifamily investors
      if(ct.strategy==="Multifamily"&&li.subType==="MULTI")sigs.push({l:"Multi-family property",w:1.5});

      // Grade
      const tw=sigs.reduce((s,x)=>s+x.w,0);
      let grade="D";
      if(tw>=5)grade="A";
      else if(tw>=2.5)grade="B";
      else if(tw>=0.5)grade="C";
      if(sigs.length===0)return;

      const sentKey=li.key;
      const sTo=sent[sentKey]||[];
      mx.push({...li,sigs,grade,arv:arv||0,rent,alreadySent:sTo.length>0,sentTo:sTo});
    });
    mx.sort((a,b)=>({A:0,B:1,C:2,D:3}[a.grade]||9)-({A:0,B:1,C:2,D:3}[b.grade]||9));
    if(mx.length>0)out[ct.id]={contact:ct,matches:mx};
  });
  return out;
}

// ── Drop Zone ────────────────────────────────────────────────────────────────
function DropZone({label,sub,count,lastDate,alert,alertC,onFiles,accent}){
  const[over,setOver]=useState(false);const ref=useRef(null);
  const handle=files=>{Array.from(files).filter(f=>f.name.endsWith(".csv")).forEach(f=>{const r=new FileReader();r.onload=e=>onFiles(e.target.result,f.name);r.readAsText(f);});};
  return(
    <div onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)} onDrop={e=>{e.preventDefault();setOver(false);handle(e.dataTransfer.files);}}
      onClick={()=>ref.current?.click()}
      style={{flex:1,border:`2px dashed ${over?accent:C.bdr}`,borderRadius:6,padding:"22px 16px",textAlign:"center",cursor:"pointer",background:over?accent+"08":C.wh,transition:"all .15s"}}>
      <input ref={ref} type="file" accept=".csv" multiple onChange={e=>{handle(e.target.files);e.target.value="";}} style={{display:"none"}}/>
      <div style={{fontSize:12,fontFamily:FS,fontWeight:700,color:accent,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{label}</div>
      {count>0?<div style={{fontFamily:FM,fontSize:24,fontWeight:700,color:C.ink}}>{count.toLocaleString()} listings</div>
      :<div style={{fontSize:14,color:C.inkS}}>Drop CSV files here or click to browse</div>}
      {sub&&<div style={{fontSize:12,fontFamily:FS,color:C.inkM,marginTop:4}}>{sub}</div>}
      {lastDate&&<div style={{fontSize:11,fontFamily:FS,color:C.inkM,marginTop:4}}>Updated: {lastDate}</div>}
      {alert&&<div style={{fontSize:12,fontFamily:FS,fontWeight:600,color:alertC||C.amb,marginTop:6}}>{alert}</div>}
    </div>
  );
}

// ── Contact Form ─────────────────────────────────────────────────────────────
function ContactForm({initial,onSave,onCancel}){
  const blank={name:"",email:"",phone:"",role:"Investor",strategy:"Any",priceMax:"",bedsMin:"",bathsMin:"",geoReq:"",geoEx:"",subTypes:"SING,MULTI",hardRules:"",braStatus:"No",status:"Warm",notes:""};
  const[f,setF]=useState(()=>initial?{...initial,geoReq:(initial.geoReq||[]).join(", "),geoEx:(initial.geoEx||[]).join(", "),hardRules:(initial.hardRules||[]).join("; "),subTypes:(initial.subTypes||[]).join(","),priceMax:initial.priceMax||"",bedsMin:initial.bedsMin||"",bathsMin:initial.bathsMin||""}:blank);
  const up=(k,v)=>setF(p=>({...p,[k]:v}));
  const inp={width:"100%",padding:"8px 10px",borderRadius:3,border:`1px solid ${C.bdr}`,fontSize:14,fontFamily:F,color:C.ink,boxSizing:"border-box"};
  const lbl={fontSize:11,fontFamily:FS,fontWeight:600,color:C.inkS,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3,display:"block"};
  return(
    <div style={{background:C.wh,border:`1px solid ${C.bdr}`,borderLeft:`3px solid ${C.pri}`,borderRadius:4,padding:"20px 22px",marginBottom:14}}>
      <div style={{fontSize:16,fontWeight:700,color:C.pri,marginBottom:14}}>{initial?"Edit":"Add"} Contact</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 14px"}}>
        <div><label style={lbl}>Name</label><input style={inp} value={f.name} onChange={e=>up("name",e.target.value)}/></div>
        <div><label style={lbl}>Email</label><input style={inp} value={f.email} onChange={e=>up("email",e.target.value)}/></div>
        <div><label style={lbl}>Role</label><select style={inp} value={f.role} onChange={e=>up("role",e.target.value)}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
        <div><label style={lbl}>Strategy</label><select style={inp} value={f.strategy} onChange={e=>up("strategy",e.target.value)}>{STRATEGIES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Max Budget</label><input style={inp} type="number" value={f.priceMax} onChange={e=>up("priceMax",e.target.value)}/></div>
        <div><label style={lbl}>Min Beds</label><input style={inp} type="number" value={f.bedsMin} onChange={e=>up("bedsMin",e.target.value)}/></div>
        <div><label style={lbl}>Min Baths</label><input style={inp} type="number" value={f.bathsMin} onChange={e=>up("bathsMin",e.target.value)}/></div>
        <div><label style={lbl}>Status</label><select style={inp} value={f.status} onChange={e=>up("status",e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div style={{gridColumn:"1/-1"}}><label style={lbl}>Target Cities</label><input style={inp} value={f.geoReq} onChange={e=>up("geoReq",e.target.value)}/></div>
        <div style={{gridColumn:"1/-1"}}><label style={lbl}>Excluded Cities</label><input style={inp} value={f.geoEx} onChange={e=>up("geoEx",e.target.value)}/></div>
        <div style={{gridColumn:"1/-1"}}><label style={lbl}>Hard Rules (semicolon-sep)</label><input style={inp} value={f.hardRules} onChange={e=>up("hardRules",e.target.value)}/></div>
        <div style={{gridColumn:"1/-1"}}><label style={lbl}>Notes</label><textarea style={{...inp,minHeight:40}} value={f.notes} onChange={e=>up("notes",e.target.value)}/></div>
      </div>
      <div style={{display:"flex",gap:8,marginTop:14}}>
        <button onClick={()=>{if(!f.name)return;onSave({...f,id:f.id||"C"+Date.now(),priceMax:parseInt(f.priceMax)||9999999,bedsMin:parseInt(f.bedsMin)||0,bathsMin:parseInt(f.bathsMin)||0,geoReq:f.geoReq?f.geoReq.split(",").map(s=>s.trim()).filter(Boolean):[],geoEx:f.geoEx?f.geoEx.split(",").map(s=>s.trim()).filter(Boolean):[],hardRules:f.hardRules?f.hardRules.split(";").map(s=>s.trim()).filter(Boolean):[],subTypes:f.subTypes?f.subTypes.split(",").map(s=>s.trim()).filter(Boolean):["SING","MULTI"]});}} style={{background:C.pri,color:C.wh,border:"none",borderRadius:3,padding:"9px 20px",fontSize:13,fontWeight:600,fontFamily:FS,cursor:"pointer"}}>Save</button>
        <button onClick={onCancel} style={{background:"transparent",color:C.inkS,border:`1px solid ${C.bdr}`,borderRadius:3,padding:"8px 18px",fontSize:13,fontFamily:FS,cursor:"pointer"}}>Cancel</button>
      </div>
    </div>
  );
}

// ── Error Boundary ───────────────────────────────────────────────────────────
class EB extends Component{constructor(p){super(p);this.state={e:false}}static getDerivedStateFromError(){return{e:true}}render(){if(this.state.e)return<div style={{fontFamily:F,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}><div style={{background:C.wh,padding:40,textAlign:"center",borderRadius:4}}><div style={{fontSize:18,fontWeight:700,color:C.pri,marginBottom:16}}>Something went wrong</div><button onClick={()=>{this.setState({e:false});window.location.reload()}} style={{background:C.pri,color:C.wh,border:"none",borderRadius:3,padding:"10px 24px",fontSize:14,fontFamily:FS,cursor:"pointer"}}>Reload</button></div></div>;return this.props.children}}

// ═══════════════════ MAIN APP ═════════════════════════════════════════════════
function DealScreener(){
  const[tab,setTab]=useState("matches");
  const[actives,setActives]=useState([]);
  const[compData,setCompData]=useState(()=>{try{return JSON.parse(localStorage.getItem("ds6_comp")||"{}");} catch(e){return{};}});
  const[soldCount,setSoldCount]=useState(()=>parseInt(localStorage.getItem("ds6_soldN")||"0"));
  const[soldDate,setSoldDate]=useState(()=>localStorage.getItem("ds6_soldD")||"");
  const[results,setResults]=useState({});
  const[sent]=useState({});
  const[contacts,setContacts]=useState(()=>{try{const s=localStorage.getItem("ds6_ct");return s?JSON.parse(s):DEF_CT;}catch(e){return DEF_CT;}});
  const[toasts,setToasts]=useState([]);
  const[filterCt,setFilterCt]=useState("all");
  const[filterG,setFilterG]=useState("B");
  const[showForm,setShowForm]=useState(false);
  const[editId,setEditId]=useState(null);
  const[expanded,setExpanded]=useState({});
  const toast=useCallback(m=>setToasts(p=>[...p,{id:Date.now(),m}]),[]);
  const saveCt=c=>{setContacts(c);localStorage.setItem("ds6_ct",JSON.stringify(c));};

  // Toast auto-dismiss
  useEffect(()=>{if(toasts.length>0){const t=setTimeout(()=>setToasts(p=>p.slice(1)),3500);return()=>clearTimeout(t);}},[toasts]);

  // Re-match when dependencies change
  useEffect(()=>{if(actives.length)setResults(matchAll(actives,contacts,compData,sent));},[contacts,actives,compData,sent]);

  // Sold freshness
  const soldDays=soldDate?Math.floor((Date.now()-new Date(soldDate).getTime())/86400000):999;
  const soldAlert=soldDays>35?{m:"Sold comps are "+soldDays+" days old — refresh",c:C.red}:soldDays>25?{m:"Refresh recommended ("+soldDays+" days)",c:C.amb}:null;

  const handleActive=(text,name)=>{
    const parsed=parseCSV(text).filter(r=>!r.isSold);
    if(!parsed.length){toast("No active listings in "+name);return;}
    setActives(prev=>{const map={};prev.forEach(l=>{map[l.key]=l;});parsed.forEach(l=>{map[l.key]=l;});return Object.values(map);});
    toast(parsed.length+" active listings from "+name);
  };

  const handleSold=(text,name)=>{
    const parsed=parseCSV(text);
    const sold=parsed.filter(r=>r.isSold||r.closePrice>0);
    if(!sold.length){toast("No sold data in "+name);return;}
    // Accumulate with previous
    const prev=JSON.parse(localStorage.getItem("ds6_soldRaw")||"[]");
    const map={};prev.forEach(l=>{map[l.key]=l;});sold.forEach(l=>{map[l.key]=l;});
    const combined=Object.values(map);
    localStorage.setItem("ds6_soldRaw",JSON.stringify(combined));
    const cd=buildCompData(combined);
    setCompData(cd);localStorage.setItem("ds6_comp",JSON.stringify(cd));
    setSoldCount(combined.length);localStorage.setItem("ds6_soldN",String(combined.length));
    const today=new Date().toLocaleDateString("en-US");setSoldDate(today);localStorage.setItem("ds6_soldD",today);
    toast(sold.length+" sold comps — "+Object.keys(cd).length+" zips mapped");
  };

  const stats=useMemo(()=>{let t=0,a=0,b=0,ct=0;Object.values(results).forEach(r=>{ct++;r.matches.forEach(m=>{t++;if(m.grade==="A")a++;if(m.grade==="B")b++;});});return{t,a,b,c:t-a-b,ct};},[results]);

  const GRADES={A:{c:C.grn,bg:C.grnS,l:"Send Now"},B:{c:C.amb,bg:C.ambS,l:"Worth a Look"},C:{c:C.inkS,bg:C.bdrL,l:"Watchlist"},D:{c:C.inkM,bg:C.off,l:"Skip"}};
  const pill=(bg,fg,t)=><span style={{display:"inline-block",background:bg,color:fg,borderRadius:2,padding:"2px 8px",fontSize:11,fontWeight:600,fontFamily:FS}}>{t}</span>;
  const dot=c=><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:c}}/>;
  const divEl=<span style={{display:"inline-block",width:1,height:12,background:C.bdr,margin:"0 8px",verticalAlign:"middle"}}/>;

  const TABS=[{id:"matches",l:"Matches"},{id:"contacts",l:"Contacts"}];

  return(
    <div style={{fontFamily:F,background:C.bg,minHeight:"100vh",color:C.ink}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${C.pri},#0F2440)`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="/headshot.png" alt="" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(255,255,255,0.2)"}} onError={e=>{e.target.style.display="none";}}/>
          <div><div style={{fontWeight:700,fontSize:17,color:C.wh}}>Deal Screener</div><div style={{fontSize:10,fontFamily:FS,color:"rgba(255,255,255,0.4)",letterSpacing:"0.15em",textTransform:"uppercase"}}>Dr. Gina N. Eaton · Howard Hanna</div></div>
        </div>
        {actives.length>0&&<span style={{fontSize:13,fontFamily:FS,color:"rgba(255,255,255,0.5)"}}>{actives.length} active · {soldCount} sold comps</span>}
      </div>
      <div style={{height:2,background:`linear-gradient(90deg,${C.gold},${C.goldL},transparent)`}}/>
      {/* Tabs */}
      <div style={{background:C.wh,borderBottom:`1px solid ${C.bdr}`,display:"flex",padding:"0 28px"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${C.pri}`:"2px solid transparent",padding:"12px 18px",fontSize:14,fontWeight:tab===t.id?700:400,fontFamily:FS,color:tab===t.id?C.pri:C.inkM,cursor:"pointer"}}>{t.l}</button>)}
      </div>

      <div style={{padding:"20px 28px 80px",maxWidth:960,margin:"0 auto"}}>
        {/* MATCHES */}
        {tab==="matches"&&<>
          {/* Upload Zones */}
          <div style={{display:"flex",gap:16,marginBottom:20}}>
            <DropZone label="Active Listings" sub="Drop your MLS Active export CSV(s)" count={actives.length} onFiles={handleActive} accent={C.pri}/>
            <DropZone label="Sold Comps" sub="6-month Sold export for ARV data" count={soldCount} lastDate={soldDate} alert={soldAlert?.m} alertC={soldAlert?.c} onFiles={handleSold} accent={C.gold}/>
          </div>

          {actives.length>0&&<>
            {/* Comp data notice */}
            {Object.keys(compData).length>0?
              <div style={{fontSize:12,fontFamily:FS,color:C.grn,marginBottom:12}}>Sold comp data loaded: {Object.keys(compData).length} zip codes mapped · Realist AVM available on 95% of listings</div>:
              <div style={{fontSize:12,fontFamily:FS,color:C.amb,marginBottom:12,fontWeight:600}}>Upload Sold Comps for ARV comparison data. Using Realist AVM as primary valuation.</div>}

            {/* Stats */}
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              {[{l:"Grade A",n:stats.a,c:C.grn},{l:"Grade B",n:stats.b,c:C.amb},{l:"Grade C",n:stats.c,c:C.inkS},{l:"Contacts",n:stats.ct,c:C.pri}].map(s=>
                <div key={s.l} style={{flex:1,background:C.wh,border:`1px solid ${C.bdr}`,borderRadius:4,padding:"12px 16px"}}>
                  <div style={{fontSize:10,fontFamily:FS,fontWeight:600,color:C.inkM,textTransform:"uppercase",letterSpacing:"0.08em"}}>{s.l}</div>
                  <div style={{fontFamily:FM,fontSize:24,fontWeight:700,color:s.c,marginTop:2}}>{s.n}</div>
                </div>)}
            </div>

            {/* Filters */}
            <div style={{display:"flex",gap:14,marginBottom:18,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,fontFamily:FS,fontWeight:600,color:C.inkS}}>Grade:</span>
                <select value={filterG} onChange={e=>setFilterG(e.target.value)} style={{padding:"6px 10px",borderRadius:3,border:`1px solid ${C.bdr}`,fontSize:13,fontFamily:FS}}>
                  <option value="A">A only — Send Now</option>
                  <option value="B">A + B — Worth a Look</option>
                  <option value="C">A + B + C</option>
                  <option value="all">Show all</option>
                </select>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,fontFamily:FS,fontWeight:600,color:C.inkS}}>Contact:</span>
                <select value={filterCt} onChange={e=>setFilterCt(e.target.value)} style={{padding:"6px 10px",borderRadius:3,border:`1px solid ${C.bdr}`,fontSize:13,fontFamily:FS,maxWidth:220}}>
                  <option value="all">All contacts</option>
                  {Object.values(results).sort((a,b)=>a.contact.name.localeCompare(b.contact.name)).map(r=><option key={r.contact.id} value={r.contact.id}>{r.contact.name} ({r.matches.length})</option>)}
                </select>
              </div>
            </div>

            {/* Match Groups */}
            {Object.values(results).filter(r=>filterCt==="all"||r.contact.id===filterCt).map(r=>{
              const go={A:0,B:1,C:2,D:3};const maxG=filterG==="all"?3:go[filterG]??1;
              const filtered=r.matches.filter(m=>(go[m.grade]??9)<=maxG);
              if(!filtered.length)return null;
              const ct=r.contact;const isOpen=expanded[ct.id]!==false;
              const aC=filtered.filter(m=>m.grade==="A").length;
              return(<div key={ct.id} style={{marginBottom:14}}>
                <div onClick={()=>setExpanded(p=>({...p,[ct.id]:!isOpen}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 18px",background:C.wh,border:`1px solid ${C.bdr}`,borderRadius:isOpen?"4px 4px 0 0":4,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {dot(STAT_C[ct.status]||C.inkM)}
                    <span style={{fontWeight:700,fontSize:15}}>{ct.name}</span>
                    {pill(C.bdrL,C.inkS,ct.role)}
                    <span style={{fontSize:12,fontFamily:FS,color:C.inkM}}>{ct.strategy} · Max {$f(ct.priceMax||0)}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {aC>0&&pill(C.grnS,C.grn,aC+" Grade A")}
                    <span style={{fontFamily:FM,fontSize:14,fontWeight:700}}>{filtered.length}</span>
                    <span style={{fontSize:12,color:C.inkM}}>{isOpen?"▾":"▸"}</span>
                  </div>
                </div>
                {isOpen&&<div style={{border:`1px solid ${C.bdr}`,borderTop:"none",borderRadius:"0 0 4px 4px",padding:"10px 14px",background:C.off}}>
                  {ct.hardRules?.length>0&&<div style={{fontSize:12,fontFamily:FS,color:C.amb,fontWeight:600,padding:"6px 10px",background:C.ambS,borderRadius:3,marginBottom:8}}>Rules: {ct.hardRules.join(" · ")}</div>}
                  {filtered.map((m,i)=>{
                    const G=GRADES[m.grade];
                    return(<div key={m.key+i} style={{background:C.wh,border:`1px solid ${C.bdr}`,borderLeft:`3px solid ${G.c}`,borderRadius:4,padding:"14px 16px",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div><div style={{fontWeight:700,fontSize:15}}>{m.addr}</div><div style={{fontSize:12,fontFamily:FS,color:C.inkS}}>{m.city}, OH {m.zip} · {m.county} County</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontFamily:FM,fontWeight:700,fontSize:18,color:C.pri}}>{$f(m.price)}</div>{pill(G.bg,G.c,"Grade "+m.grade+" — "+G.l)}</div>
                      </div>
                      {/* Property Details */}
                      <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",marginTop:8,fontSize:13,fontFamily:FS,color:C.inkS}}>
                        <span>{m.beds}bd/{m.baths}ba</span>{divEl}
                        {m.sqft>0&&<><span>{m.sqft.toLocaleString()}sf</span>{divEl}</>}
                        <span>{m.yr||"—"}</span>{divEl}
                        <span>{m.dom}d on market</span>
                        {m.ppsf>0&&<>{divEl}<span>{$f(m.ppsf)}/sf</span></>}
                        {m.tax>0&&<>{divEl}<span>Tax:{$f(m.tax)}/yr</span></>}
                        {m.reduced&&<>{divEl}<span style={{color:C.red,fontWeight:600}}>↓{m.dropPct}%</span></>}
                      </div>
                      {/* Details row 2 */}
                      <div style={{fontSize:12,fontFamily:FS,color:C.inkS,marginTop:4}}>
                        {m.style}{m.stories?" · "+m.stories+" story":""}{m.basement?" · Bsmt: "+m.basement:""}{m.garage>0?" · "+m.garage+" garage":""}
                        {m.subTypeFull?" · "+m.subTypeFull:""}
                        {m.condition?" · "+m.condition:""}
                      </div>
                      {/* Valuation */}
                      {m.arv>0&&<div style={{fontSize:12,fontFamily:FS,color:C.blu,marginTop:6}}>
                        Est. Value: {$f(m.arv)}{m.avm>0?" (Realist AVM)":compData[m.zip]?" (area comp avg)":""} · {m.arv>m.price?"Priced "+Math.round((1-m.price/m.arv)*100)+"% below":"At or above est. value"}
                      </div>}
                      {/* Rent estimate */}
                      <div style={{fontSize:12,fontFamily:FS,color:C.inkS,marginTop:2}}>
                        Est. rent: {$f(m.rent)}/mo ({m.grossRent>0?"MLS actual":"FMR estimate"})
                        {m.occupant?" · Occupant: "+m.occupant:""}
                        {m.homestead==="Yes"?" · ⚠ Homestead exemption (taxes will increase)":""}
                      </div>
                      {/* Signals */}
                      <div style={{marginTop:6}}>{m.sigs.filter(s=>s.w>0).map((s,si)=><span key={si} style={{display:"inline-block",background:C.grnS,color:C.grn,borderRadius:2,padding:"2px 8px",fontSize:11,fontWeight:600,fontFamily:FS,marginRight:4,marginBottom:3}}>{s.l}</span>)}</div>
                      {/* Red flags */}
                      {(m.foreclosure==="Yes"||m.courtOrdered==="Yes"||(m.assocYN==="Yes"&&m.subType==="CONDO")||m.homestead==="Yes")&&
                        <div style={{marginTop:4}}>
                          {m.foreclosure==="Yes"&&pill(C.redS,C.red,"Foreclosure")}
                          {m.courtOrdered==="Yes"&&pill(C.ambS,C.amb,"Court Ordered")}
                          {m.assocYN==="Yes"&&m.subType==="CONDO"&&pill(C.ambS,C.amb,"Condo — HOA")}
                          {m.homestead==="Yes"&&pill(C.ambS,C.amb,"Homestead — taxes will rise")}
                        </div>}
                      {m.school&&<div style={{fontSize:11,fontFamily:FS,color:C.inkM,marginTop:4}}>School: {m.school}</div>}
                      {/* Zillow link */}
                      <div style={{marginTop:6}}><a href={"https://www.zillow.com/homes/"+encodeURIComponent(m.addr+" "+m.city+" OH "+m.zip)} target="_blank" rel="noopener noreferrer" style={{fontSize:12,fontFamily:FS,color:C.blu,textDecoration:"none"}}>View on Zillow →</a></div>
                    </div>);
                  })}
                </div>}
              </div>);
            })}
          </>}
        </>}

        {/* CONTACTS */}
        {tab==="contacts"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:20,fontWeight:700}}>Contacts ({contacts.length})</div>
            <button onClick={()=>{setShowForm(true);setEditId(null);}} style={{background:C.pri,color:C.wh,border:"none",borderRadius:3,padding:"9px 20px",fontSize:13,fontWeight:600,fontFamily:FS,cursor:"pointer"}}>+ Add Contact</button>
          </div>
          {(showForm||editId)&&<ContactForm initial={editId?contacts.find(c=>c.id===editId):null} onSave={c=>{const u=editId?contacts.map(x=>x.id===editId?c:x):[...contacts,c];saveCt(u);setShowForm(false);setEditId(null);toast(c.name+(editId?" updated":" added"));}} onCancel={()=>{setShowForm(false);setEditId(null);}}/>}
          {ROLES.map(role=>{
            const items=contacts.filter(c=>c.role===role);
            if(!items.length)return null;
            return(<div key={role} style={{marginBottom:20}}>
              <div style={{fontSize:10,fontFamily:FS,fontWeight:700,color:C.inkM,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{role}s ({items.length})</div>
              {items.map(c=>(
                <div key={c.id} style={{background:C.wh,border:`1px solid ${C.bdr}`,borderRadius:4,padding:"12px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>{dot(STAT_C[c.status]||C.inkM)}<span style={{fontWeight:700,fontSize:15}}>{c.name}</span>{pill(C.bdrL,C.inkS,c.strategy)}{c.braStatus==="Yes"&&pill(C.grnS,C.grn,"BRA ✓")}</div>
                    <div style={{fontSize:12,fontFamily:FS,color:C.inkS,marginLeft:13}}>{c.email} · Max: {$f(c.priceMax||0)}{c.bedsMin>0?" · "+c.bedsMin+"+bd":""}{c.bathsMin>0?" · "+c.bathsMin+"+ba":""}</div>
                    {c.geoReq?.length>0&&<div style={{fontSize:11,fontFamily:FS,color:C.blu,marginLeft:13,marginTop:2}}>Target: {c.geoReq.join(", ")}</div>}
                    {c.geoEx?.length>0&&<div style={{fontSize:11,fontFamily:FS,color:C.red,marginLeft:13}}>Excludes: {c.geoEx.join(", ")}</div>}
                    {c.hardRules?.length>0&&<div style={{fontSize:11,fontFamily:FS,color:C.amb,marginLeft:13}}>Rules: {c.hardRules.join(" · ")}</div>}
                    {c.notes&&<div style={{fontSize:11,fontFamily:FS,color:C.inkM,marginLeft:13,fontStyle:"italic"}}>{c.notes}</div>}
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{setEditId(c.id);setShowForm(false);}} style={{background:"transparent",color:C.inkS,border:`1px solid ${C.bdr}`,borderRadius:3,padding:"6px 14px",fontSize:12,fontFamily:FS,cursor:"pointer"}}>Edit</button>
                    <button onClick={()=>{if(window.confirm("Remove?")){saveCt(contacts.filter(x=>x.id!==c.id));toast("Removed");}}} style={{background:"transparent",color:C.red,border:`1px solid ${C.red}33`,borderRadius:3,padding:"6px 12px",fontSize:12,fontFamily:FS,cursor:"pointer"}}>✕</button>
                  </div>
                </div>))}
            </div>);
          })}
        </div>}
      </div>
      {/* Toasts */}
      <div style={{position:"fixed",top:16,right:16,zIndex:9999}}>{toasts.map(t=><div key={t.id} style={{background:C.pri,color:C.wh,padding:"10px 16px",borderRadius:3,fontSize:13,fontFamily:FS,fontWeight:500,marginBottom:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}>{t.m}</div>)}</div>
    </div>
  );
}

export default function App(){return<EB><DealScreener/></EB>;}
