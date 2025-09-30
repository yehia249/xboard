// simulate-paynow.js
const crypto = require("crypto");
const fetch = require("node-fetch"); // npm i node-fetch@2 if needed

// === EDIT THESE THREE ===
const WEBHOOK_URL = "http://localhost:3000/api/paynow/webhook"; // or your Vercel URL
const SECRET = "pn-164b15fbe87a487ba29293414b3fb832";
const REF = "srv=57|uid=MWw5Q4tSVpfbhkWDEjsgmtirubv2"; // server id + firebase uid

// build a payload that matches your handler
function payload(eventType, tier, subId) {
  return {
    event_type: eventType,                 // "ON_SUBSCRIPTION_ACTIVATED" | "ON_SUBSCRIPTION_RENEWED" | "ON_SUBSCRIPTION_CANCELED"
    event_id: "evt_" + Date.now(),
    body: {
      reference: REF,                      // your code parses srv/uid from this
      subscription_id: subId || "sub_abc123",
      current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString(), // +30d
      product: { metadata: { tier } },     // your code reads product.metadata.tier
      // variables / plan.metadata are also checked but product.metadata is enough
    },
  };
}

async function send(evt) {
  const raw = JSON.stringify(evt);
  const ts = Date.now().toString();

  // Your handler computes HMAC-SHA256 over the RAW BODY (no timestamp concatenation)
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(raw);
  const sig = hmac.digest("hex");

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "paynow-signature": sig,
      "paynow-timestamp": ts,
    },
    body: raw,
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log(text);
}

// === Choose one to simulate ===
(async () => {
  // 1) Activate Gold
  // await send(payload("ON_SUBSCRIPTION_ACTIVATED", "gold", "sub_gold_1"));

  // 2) Renew Silver
  // await send(payload("ON_SUBSCRIPTION_RENEWED", "silver", "sub_silver_1"));

  // 3) Cancel Gold (keeps tier until period end)
  // await send(payload("ON_SUBSCRIPTION_CANCELED", "gold", "sub_gold_1"));

  // Example: activate Gold
  await send(payload("ON_SUBSCRIPTION_ACTIVATED", "gold", "sub_gold_1"));
})();
