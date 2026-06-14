// ── Send Email via Resend API ─────────────────────────────────────────────────
// No npm package needed — uses native fetch (Node 18+ on Netlify)

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "POST only" }) };
  }

  try {
    const { to, subject, html, replyTo } = JSON.parse(event.body || "{}");

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: to, subject, html" }),
      };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || "Deal Screener <deals@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: data.message || "Email send failed" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id: data.id }),
    };
  } catch (err) {
    console.error("Email function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
