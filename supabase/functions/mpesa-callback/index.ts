// Safaricom calls this after the student answers the prompt. Deploy with "Verify JWT" OFF.
// Safety: the URL carries a secret key (MPESA_CALLBACK_KEY), and the request must match a pending request we created.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const ack = () => new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
  headers: { "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  const key = Deno.env.get("MPESA_CALLBACK_KEY") ?? "";
  if (!key || new URL(req.url).searchParams.get("k") !== key) return new Response("Forbidden", { status: 403 });

  const body = await req.json().catch(() => null);
  const cb = body?.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) return ack();

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: r } = await sb.from("mpesa_requests").select("*")
    .eq("checkout_request_id", cb.CheckoutRequestID).maybeSingle();
  if (!r || r.status !== "pending") return ack(); // unknown or already handled

  if (cb.ResultCode === 0) {
    const items: { Name: string; Value: unknown }[] = cb.CallbackMetadata?.Item ?? [];
    const get = (n: string) => items.find((i) => i.Name === n)?.Value;
    const amount = Number(get("Amount"));
    const receipt = String(get("MpesaReceiptNumber") ?? "");
    if (amount !== r.amount || !receipt) {
      await sb.from("mpesa_requests").update({ status: "mismatch", result_desc: "Amount or receipt did not match" }).eq("id", r.id);
      return ack();
    }
    const paidOn = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
    const ins = await sb.from("payments").insert({
      student_id: r.student_id, amount, paid_on: paidOn, reference: receipt,
    });
    // 23505 = this receipt was already recorded, which is fine
    if (ins.error && ins.error.code !== "23505") {
      await sb.from("mpesa_requests").update({ result_desc: "Could not record payment: " + ins.error.message }).eq("id", r.id);
      return new Response("Error", { status: 500 }); // ask Safaricom to retry
    }
    await sb.from("mpesa_requests").update({ status: "paid", receipt, result_desc: cb.ResultDesc }).eq("id", r.id);
  } else {
    await sb.from("mpesa_requests").update({ status: "failed", result_desc: String(cb.ResultDesc ?? "Payment was not completed") }).eq("id", r.id);
  }
  return ack();
});
