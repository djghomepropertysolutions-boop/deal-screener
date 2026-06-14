const { google } = require("googleapis");

// ── Auth ──────────────────────────────────────────────────────────────────────
function getAuth() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ── Tab Names ─────────────────────────────────────────────────────────────────
const TABS = {
  sendLog: "SendLog",
  roster: "Roster",
  settings: "Settings",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getRows(tab) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A:Z`,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = row[i] || ""));
    return obj;
  });
}

async function appendRow(tab, rowData) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1:1`,
  });
  const headers = (res.data.values && res.data.values[0]) || [];
  const row = headers.map((h) => rowData[h] || "");
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  return { success: true };
}

async function updateRow(tab, matchCol, matchVal, updates) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A:Z`,
  });
  const rows = res.data.values || [];
  if (rows.length < 2) return { success: false, error: "No data" };
  const headers = rows[0];
  const colIdx = headers.indexOf(matchCol);
  if (colIdx === -1) return { success: false, error: `Column ${matchCol} not found` };
  const rowIdx = rows.findIndex((r, i) => i > 0 && r[colIdx] === matchVal);
  if (rowIdx === -1) return { success: false, error: "Row not found" };
  const updatedRow = [...rows[rowIdx]];
  Object.entries(updates).forEach(([key, val]) => {
    const ki = headers.indexOf(key);
    if (ki !== -1) updatedRow[ki] = val;
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A${rowIdx + 1}:${String.fromCharCode(65 + headers.length - 1)}${rowIdx + 1}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [updatedRow] },
  });
  return { success: true };
}

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const params = event.queryStringParameters || {};
    const action = params.action || "list";
    const tab = params.tab || "SendLog";

    // ── GET requests ──
    if (event.httpMethod === "GET") {
      if (action === "list") {
        const rows = await getRows(tab);
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      }

      if (action === "check_sent") {
        // Check if a specific MLS# was already sent to a specific person
        const rows = await getRows(TABS.sendLog);
        const mlsNum = params.mls || "";
        const sentTo = params.sentTo || "";
        const found = rows.some(
          (r) => r["MLS#"] === mlsNum && r["SentTo"] === sentTo
        );
        return { statusCode: 200, headers, body: JSON.stringify({ sent: found }) };
      }

      if (action === "sent_mls_list") {
        // Return all MLS numbers that have been sent (for duplicate detection)
        const rows = await getRows(TABS.sendLog);
        const sentMap = {};
        rows.forEach((r) => {
          const mls = r["MLS#"];
          if (mls) {
            if (!sentMap[mls]) sentMap[mls] = [];
            sentMap[mls].push(r["SentTo"] || "");
          }
        });
        return { statusCode: 200, headers, body: JSON.stringify(sentMap) };
      }
    }

    // ── POST requests ──
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");

      if (action === "log_send") {
        const result = await appendRow(TABS.sendLog, {
          Date: body.date || new Date().toLocaleDateString("en-US"),
          "MLS#": body.mlsNum || "",
          Address: body.address || "",
          Price: body.price || "",
          Lane: body.lane || "",
          SentTo: body.sentTo || "",
          Email: body.email || "",
          InvestorStatus: body.investorStatus || "Warm",
        });
        return { statusCode: 200, headers, body: JSON.stringify(result) };
      }

      if (action === "save_roster") {
        const result = await appendRow(TABS.roster, body);
        return { statusCode: 200, headers, body: JSON.stringify(result) };
      }

      if (action === "update_roster") {
        const result = await updateRow(
          TABS.roster,
          "Name",
          body.name,
          body.updates
        );
        return { statusCode: 200, headers, body: JSON.stringify(result) };
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Unknown action: " + action }),
    };
  } catch (err) {
    console.error("Data function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
