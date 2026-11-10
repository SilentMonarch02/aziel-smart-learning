// Starts an M-Pesa STK push (the prompt on the student's phone). Needs a signed-in student.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const out = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const env = (k: string) => Deno.env.get(k) ?? "";
const BASE = env("MPESA_ENV") === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return out({ error: "Method not allowed" }, 405);

  const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: u } = await sb.auth.getUser(jwt);
  if (!u?.user) return out({ error: "Please sign in first." }, 401);

  const { data: st } = await sb.from("students").select("id,full_name").eq("user_id", u.user.id).maybeSingle();
  if (!st) return out({ error: "No student record is linked to this account." }, 403);

  const body = await req.json().catch(() => ({}));
  let phone = String(body.phone ?? "").replace(/[\s+\-]/g, "");
  if (/^0[71]\d{8}$/.test(phone)) phone = "254" + phone.slice(1);
  if (/^[71]\d{8}$/.test(phone)) phone = "254" + phone;
  if (!/^254[71]\d{8}$/.test(phone)) return out({ error: "Enter a valid Safaricom number, for example 0712345678." }, 400);
  const amount = Math.round(Number(body.amount));
  if (!(amount >= 1 && amount <= 70000)) return out({ error: "Enter an amount between 1 and 70,000." }, 400);

  // at most one request every 60 seconds per student
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await sb.from("mpesa_requests").select("id", { count: "exact", head: true })
    .eq("student_id", st.id).gte("created_at", since);
  if ((count ?? 0) > 0) return out({ error: "A payment request was just sent. Please wait a minute and try again." }, 429);

  // 1. access token
  const tr = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: "Basic " + btoa(`${env("MPESA_CONSUMER_KEY")}:${env("MPESA_CONSUMER_SECRET")}`) },
  });
  const token = (await tr.json().catch(() => ({}))).access_token;
  if (!token) return out({ error: "M-Pesa is not available right now. Please try again later." }, 502);

  // 2. STK push
  const ts = new Date(Date.now() + 3 * 3600_000).toISOString().replace(/[-:T]/g, "").slice(0, 14); // East Africa time
  const code = env("MPESA_SHORTCODE");
  const payload = {
    BusinessShortCode: code,
    Password: btoa(code + env("MPESA_PASSKEY") + ts),
    Timestamp: ts,
    TransactionType: env("MPESA_TXN_TYPE") || "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: code,
    PhoneNumber: phone,
    CallBackURL: `${env("SUPABASE_URL")}/functions/v1/mpesa-callback?k=${env("MPESA_CALLBACK_KEY")}`,
    AccountReference: env("MPESA_ACCOUNT") || "40722",
    TransactionDesc: "Aziel tuition",
  };
  const r = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  if (j.ResponseCode !== "0") {
    return out({ error: j.CustomerMessage || j.errorMessage || "M-Pesa could not start the payment." }, 502);
  }
  await sb.from("mpesa_requests").insert({
    checkout_request_id: j.CheckoutRequestID, merchant_request_id: j.MerchantRequestID,
    student_id: st.id, amount, phone,
  });
  return out({ ok: true, checkout_request_id: j.CheckoutRequestID });
});
