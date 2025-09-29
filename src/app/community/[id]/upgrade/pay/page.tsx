"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CreditCard,
  Crown,
  ArrowLeft,
} from "lucide-react";

declare global {
  interface Window {
    paypal?: any;
  }
}

/** Load PayPal JS SDK on the client */
function loadPayPalScript(clientId: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject("No window");
    if (window.paypal) return resolve();

    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&vault=true&intent=subscription&components=buttons`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.head.appendChild(s);
  });
}

export default function UpgradePayPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const plan = (searchParams.get("plan") || "").toLowerCase(); // "silver" | "gold"

  // ===== HARDCODED CONFIG (Sandbox) =====
  const PAYPAL_CLIENT_ID =
    "AbrshzSFLakjisCz89feTbbQfdtWv_6QTav7ZvGAwWlKgKp5WVPW67bD6_w4VEsArdxEaDze2F48h9Mr";
  const PLAN_IDS = {
    silver: "P-5LL63795J4601824YNDIA3GQ",
    gold: "P-9S7205646N7827527NDIA3ZY",
  } as const;
  // =====================================

  const planId = PLAN_IDS[plan as keyof typeof PLAN_IDS] || "";

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  const [phase, setPhase] = useState<"loading" | "ready" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [subId, setSubId] = useState("");

  // UI helpers
  const isGold = plan === "gold";
  const accentRing =
    plan === "gold"
      ? "ring-1 ring-amber-500/40"
      : "ring-1 ring-slate-400/30";
  const badgeStyles = isGold
    ? "from-amber-400/20 to-amber-600/20 text-amber-300 border-amber-400/30"
    : "from-slate-300/10 to-slate-500/10 text-slate-200 border-slate-300/20";

  useEffect(() => {
    if (!id || (plan !== "silver" && plan !== "gold")) {
      setPhase("error");
      setMessage("Invalid plan selected.");
      return;
    }
    if (!PAYPAL_CLIENT_ID || !planId) {
      setPhase("error");
      setMessage("Payment configuration missing.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadPayPalScript(PAYPAL_CLIENT_ID);
        if (cancelled) return;

        // show UI and then render the buttons (container now exists)
        setPhase("ready");

        const el = containerRef.current;
        if (window.paypal && el && !buttonsRendered.current) {
          buttonsRendered.current = true;

          window.paypal
            .Buttons({
              style: { shape: "rect", layout: "vertical", label: "subscribe" },
              createSubscription: (_data: any, actions: any) =>
                actions.subscription.create({ plan_id: planId }),
              onApprove: async (data: { subscriptionID: string }) => {
                try {
                  setSubId(data.subscriptionID);

                  const auth = await import("firebase/auth");
                  const token = await auth.getAuth().currentUser?.getIdToken();
                  if (!token) throw new Error("Login required.");

                  const res = await fetch("/api/upgrade-tier", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      community_id: id,
                      new_tier: plan,
                      paypal_subscription_id: data.subscriptionID,
                    }),
                  });

                  const json = await res.json().catch(() => ({}));
                  if (!res.ok)
                    throw new Error(json?.error || "Failed to update tier.");

                  setPhase("success");
                  setMessage(`Successfully upgraded to ${plan} tier!`);
                  setTimeout(() => router.push(`/community/${id}`), 1600);
                } catch (err: any) {
                  setPhase("error");
                  setMessage(err?.message || "Something went wrong after payment.");
                }
              },
              onCancel: () => {
                setPhase("error");
                setMessage("Payment cancelled.");
              },
              onError: (err: unknown) => {
                console.error(err);
                setPhase("error");
                setMessage("Payment error. Please try again.");
              },
            })
            .render(el);
        }
      } catch (e: any) {
        setPhase("error");
        setMessage(e?.message || "Failed to initialize PayPal.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [PAYPAL_CLIENT_ID, id, plan, planId, router]);

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-white">
      {/* soft ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-white/10 to-slate-500/10" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-slate-400/10 to-white/10" />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 pb-16 pt-10">
        {/* top bar */}
        <div className="mb-6 flex w-full items-center justify-between">
          <button
            onClick={() => router.push(`/community/${id}/upgrade`)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${badgeStyles} bg-gradient-to-r`}
          >
            {isGold ? <Crown size={14} /> : <CreditCard size={14} />}
            <span className="capitalize">{plan}</span>
            <span className="opacity-70">• monthly</span>
          </div>
        </div>

        {/* card */}
        <div
          className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur ${accentRing}`}
        >
          {/* header */}
          <div className="mb-5 text-center">
            {phase === "loading" && (
              <>
                <Loader2 className="mx-auto mb-3 animate-spin text-slate-300" size={36} />
                <h2 className="text-xl font-semibold">Loading PayPal…</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Preparing secure checkout for <strong className="capitalize">{plan}</strong>.
                </p>
              </>
            )}

            {phase === "ready" && (
              <>
                <h1 className="text-2xl font-bold capitalize tracking-tight">
                  {plan} Subscription
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  Complete your monthly subscription via PayPal.
                </p>
              </>
            )}

            {phase === "success" && (
              <>
                <CheckCircle className="mx-auto mb-3 text-green-400" size={40} />
                <h2 className="text-2xl font-bold">Upgrade Successful!</h2>
                <p className="mt-1 text-gray-300">{message}</p>
                {subId && (
                  <p className="mt-2 text-xs text-gray-500">
                    Subscription ID: {subId}
                  </p>
                )}
              </>
            )}

            {phase === "error" && (
              <>
                <AlertCircle className="mx-auto mb-3 text-red-400" size={40} />
                <h2 className="text-2xl font-bold">Upgrade Failed</h2>
                <p className="mt-1 text-gray-300">{message}</p>
              </>
            )}
          </div>

          {/* small perks / copy to reduce emptiness */}
          {phase !== "success" && (
            <div className="mx-auto mb-5 max-w-sm text-sm text-slate-300/90">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  • Instant tier upgrade
                </li>
                <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  • Renews monthly (cancel anytime)
                </li>
                <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  • Managed securely by PayPal
                </li>
                <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  • Works on desktop & mobile
                </li>
              </ul>
            </div>
          )}

          {/* divider */}
          {phase === "ready" && (
            <div className="mb-4 flex items-center gap-3 text-xs text-slate-400/80">
              <div className="h-px flex-1 bg-white/10" />
              <span>Checkout</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          )}

          {/* PayPal buttons container (keep mounted) */}
          <div ref={containerRef} className="mt-2 flex justify-center" />

          {/* footer actions */}
          {phase === "error" && (
            <button
              onClick={() => router.push(`/community/${id}/upgrade`)}
              className="mt-6 w-full rounded-lg bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/15"
            >
              Back to Tiers
            </button>
          )}

          {/* secure footer */}
          <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-slate-400/80 sm:flex-row">
            <div className="inline-flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>Secure payments powered by PayPal</span>
            </div>
            <div className="opacity-80">No card data touches our servers.</div>
          </div>
        </div>

        {/* tiny bottom note */}
        <p className="mt-6 text-center text-xs text-slate-500">
        </p>
      </div>
    </div>
  );
}
