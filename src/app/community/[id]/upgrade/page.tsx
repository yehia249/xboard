// app/upgrade/[id]/page.tsx
"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  Star,
  Clock,
  ShieldCheck,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

type Community = { name: string; tier: "normal" | "silver" | "gold" };

export default function UpgradeTierPage() {
  const params = useParams();
  const router = useRouter();

  // normalize id from useParams (can be string | string[])
  const rawId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : String(params?.id ?? "");

  // ====== Paynow product IDs ======
  const PAYNOW_GOLD_PRODUCT_ID = "476427054443663360";
  const PAYNOW_SILVER_PRODUCT_ID = "476429842842124288";
  // ================================

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [paynowReady, setPaynowReady] = useState(false);

  // checkout UI state
  const [checkoutPhase, setCheckoutPhase] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutOrderId, setCheckoutOrderId] = useState("");

    // A useLayoutEffect to force a one-time page refresh on the first load.
    useLayoutEffect(() => {
      const key = "refreshed-login-page";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "true");
        window.location.replace(window.location.href);
      }
      return () => sessionStorage.removeItem(key);
    }, []);

  // seed guest
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("uid")) {
      const guestId =
        (globalThis.crypto as any)?.randomUUID?.() ||
        `guest-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("uid", guestId);
      console.info("[upgrade] seeded guest uid:", guestId);
    }
  }, []);

  // load PayNow.js
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).PayNow?.checkout) {
      setPaynowReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.paynow.gg/paynow-js/bundle.js";
    script.defer = true;
    script.onload = () => {
      if ((window as any).PayNow?.checkout) {
        setPaynowReady(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  async function getUserIdentity(): Promise<{ uid: string; email: string }> {
    let uid = "";
    let email = "";

    try {
      const { getAuth, onAuthStateChanged } = await import("firebase/auth");
      const auth = getAuth();
      const current = auth.currentUser;
      if (current) {
        uid = current.uid;
        email = (current.email || current.providerData?.[0]?.email || "").toString();
        if (uid) localStorage.setItem("firebase_uid", uid);
        if (email) localStorage.setItem("user_email", email);
      } else {
        localStorage.removeItem("firebase_uid");
        localStorage.removeItem("user_email");
        onAuthStateChanged(auth, (u) => {
          if (u) {
            const freshUid = u.uid;
            const freshEmail = (u.email || u.providerData?.[0]?.email || "").toString();
            if (freshUid) localStorage.setItem("firebase_uid", freshUid);
            if (freshEmail) localStorage.setItem("user_email", freshEmail);
          }
        });
      }
    } catch {
      // ignore
    }

    if (!uid) {
      uid =
        (typeof window !== "undefined" &&
          (localStorage.getItem("firebase_uid") || localStorage.getItem("uid"))) ||
        "";
    }
    if (!email) {
      email =
        (typeof window !== "undefined" && localStorage.getItem("user_email")) || "";
    }

    return { uid, email };
  }

  async function upsertAndGetCustomerId(userUid: string, email: string) {
    const r = await fetch("/api/paynow/upsert-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userUid, email }),
      cache: "no-store",
    });

    if (!r.ok) {
      console.error("customer-upsert failed:", await r.text());
      return "";
    }
    const data = await r.json();
    return data?.customerId || "";
  }

  async function startCheckout(productId: string, tier: "gold" | "silver") {
    const serverId = Number(rawId);

    setCheckoutPhase("loading");
    setCheckoutMessage("Preparing secure checkout…");

    const { uid, email } = await getUserIdentity();

    if (!uid || !email) {
      setCheckoutPhase("error");
      setCheckoutMessage("You need to sign in before upgrading.");
      setShowSignupPrompt(true);
      return;
    }

    const customerId = await upsertAndGetCustomerId(uid, email);
    if (!customerId) {
      setCheckoutPhase("error");
      setCheckoutMessage("Could not create customer. Try again.");
      return;
    }

    try {
      const r = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          tier,
          serverId,
          userUid: uid,
          customerId,
        }),
      });

      const payload = await r.json();

      if (!r.ok || !payload?.token) {
        console.error("Checkout failed:", payload);
        setCheckoutPhase("error");
        setCheckoutMessage(
          payload?.error || "Checkout failed. Please try again in a moment."
        );
        return;
      }

      if (!(window as any).PayNow?.checkout) {
        setCheckoutPhase("error");
        setCheckoutMessage("Payment widget is still loading. Try again.");
        return;
      }

      const paynow = (window as any).PayNow;

      paynow.checkout.on("completed", (event: any) => {
        setCheckoutOrderId(event?.orderId || "");
        setCheckoutPhase("success");
        setCheckoutMessage(
          `Successfully upgraded to ${tier} tier! Redirecting…`
        );
        paynow.checkout.close();
        // ⬇️ redirect to the community that just got upgraded
        setTimeout(() => {
          router.push(`/community/${rawId}`);
        }, 1500);
      });

      paynow.checkout.on("closed", () => {
        setTimeout(() => {
          setCheckoutPhase((prev) => (prev === "loading" ? "error" : prev));
          if (checkoutPhase === "error") {
            setCheckoutMessage("Checkout was closed.");
          }
        }, 200);
      });

      paynow.checkout.open({
        token: payload.token,
      });
      setCheckoutMessage("Opening secure checkout…");
    } catch (e: any) {
      console.error(e);
      setCheckoutPhase("error");
      setCheckoutMessage("Network error starting checkout.");
    }
  }

  // refresh behavior
  useLayoutEffect(() => {
    const key = "refreshed-login-page";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "true");
      window.location.replace(window.location.href);
    }
    return () => sessionStorage.removeItem(key);
  }, []);

  // load community
  useEffect(() => {
    const fetchCommunity = async () => {
      const res = await fetch(`/api/communities/${rawId}`, { cache: "no-store" });
      const data = await res.json();
      setCommunity(data);
      setLoading(false);
    };
    fetchCommunity();
  }, [rawId]);

  if (loading) return null;
  if (!community) return <div className="text-white p-10">Community not found.</div>;

  const TierCard = ({
    title,
    subtitle,
    price,
    gradient,
    border,
    accentText,
    badgeIcon,
    perks,
    disabledText,
    cta,
    onClick,
    active,
    isCurrent,
    disabled,
  }: {
    title: "Normal" | "Silver" | "Gold";
    subtitle: string;
    price: string;
    gradient: string;
    border: string;
    accentText: string;
    badgeIcon: React.ReactNode;
    perks: string[];
    disabledText: string;
    cta?: string;
    onClick?: () => void;
    active?: boolean;
    isCurrent?: boolean;
    disabled?: boolean;
  }) => (
    <div
      className={`group relative rounded-2xl ${border} ${gradient} p-6 shadow-xl backdrop-blur transition-all ${
        active ? "ring-1 ring-white/20" : "ring-1 ring-transparent"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/[0.03] to-transparent" />
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-200">
        {badgeIcon}
        <span className="font-medium">{title}</span>
        {!!accentText && <span className="opacity-70">• {accentText}</span>}
      </div>
      <h2
        className={`text-xl font-semibold mb-1 ${
          title === "Gold"
            ? "text-yellow-300"
            : title === "Silver"
            ? "text-slate-100"
            : "text-white"
        }`}
      >
        {title}
      </h2>
      <p className={`text-sm mb-4 ${title === "Gold" ? "text-yellow-200/90" : "text-gray-400"}`}>
        {subtitle}
      </p>
      <ul className="mb-5 space-y-2 text-sm text-slate-300/90">
        {perks.map((p) => (
          <li key={p} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            • {p}
          </li>
        ))}
      </ul>
      {disabled ? (
        <button
          disabled
          className="w-full cursor-default rounded-md bg-gray-700/70 px-4 py-2 font-medium text-white"
        >
          {isCurrent ? "Current Tier" : disabledText}
        </button>
      ) : (
        <button
          onClick={onClick}
          className={`w-full rounded-md px-4 py-2 font-semibold transition-transform active:scale-[0.99] cursor-pointer ${
            title === "Gold"
              ? "bg-yellow-400 text-black hover:brightness-105"
              : "bg-gradient-to-r from-slate-300 to-slate-100 text-black hover:from-slate-200 hover:to-white"
          }`}
        >
          {cta} {price && <span className="opacity-80">• {price}</span>}
        </button>
      )}
    </div>
  );

  const MobileTierCard = ({
    title,
    subtitle,
    price,
    gradient,
    border,
    accentText,
    badgeIcon,
    perks,
    disabledText,
    cta,
    onClick,
    isCurrent,
    disabled,
  }: {
    title: "Normal" | "Silver" | "Gold";
    subtitle: string;
    price: string;
    gradient: string;
    border: string;
    accentText?: string;
    badgeIcon: React.ReactNode;
    perks: string[];
    disabledText: string;
    cta?: string;
    onClick?: () => void;
    isCurrent?: boolean;
    disabled?: boolean;
  }) => (
    <div className={`rounded-xl ${border} ${gradient} p-4 shadow-lg`}>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-200">
        {badgeIcon}
        <span className="font-medium">{title}</span>
        {!!accentText && <span className="opacity-70">• {accentText}</span>}
      </div>

      <div className="flex items-baseline justify-between">
        <h3
          className={`text-[15px] font-semibold ${
            title === "Gold"
              ? "text-yellow-300"
              : title === "Silver"
              ? "text-slate-100"
              : "text-white"
          }`}
        >
          {title}
        </h3>
        <span className={`text-[11px] ${title === "Gold" ? "text-yellow-200/90" : "text-gray-400"}`}>
          {subtitle}
        </span>
      </div>

      <ul className="mt-2 mb-3 space-y-1.5 text-[11px] leading-snug text-slate-300/90">
        {perks.map((p) => (
          <li key={p} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
            • {p}
          </li>
        ))}
      </ul>

      {disabled ? (
        <button
          disabled
          className="w-full cursor-default rounded-md bg-gray-700/70 px-3 py-2 text-[12px] font-medium text-white"
        >
          {isCurrent ? "Current Tier" : disabledText}
        </button>
      ) : (
        <button
          onClick={onClick}
          className={`w-full rounded-md px-3 py-2 text-[12px] font-semibold ${
            title === "Gold"
              ? "bg-yellow-400 text-black"
              : "bg-gradient-to-r from-slate-300 to-slate-100 text-black"
          } active:scale-[0.99]`}
        >
          {cta} {price && <span className="opacity-80">• {price}</span>}
        </button>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-white font-sans">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-white/10 to-slate-500/10" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-slate-400/10 to-white/10" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 sm:py-12">
        <button
          onClick={() => router.push(`/community/${rawId}`)}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* STATUS CARD */}
        {checkoutPhase !== "idle" && (
          <div className="mb-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl backdrop-blur">
            <div className="text-center">
              {checkoutPhase === "loading" && (
                <>
                  <Loader2 className="mx-auto mb-3 animate-spin text-slate-200" size={36} />
                  {/* 👇 changed this line */}
                  <h2 className="text-xl font-semibold">Preparing checkout…</h2>
                  <p className="mt-1 text-sm text-gray-400">{checkoutMessage}</p>
                </>
              )}
              {checkoutPhase === "success" && (
                <>
                  <CheckCircle className="mx-auto mb-3 text-green-400" size={42} />
                  <h2 className="text-2xl font-bold">Upgrade Successful!</h2>
                  <p className="mt-1 text-gray-300">{checkoutMessage}</p>
                  {checkoutOrderId && (
                    <p className="mt-2 text-xs text-gray-500">Order ID: {checkoutOrderId}</p>
                  )}
                </>
              )}
              {checkoutPhase === "error" && (
                <>
                  <AlertCircle className="mx-auto mb-3 text-red-400" size={42} />
                  <h2 className="text-2xl font-bold">Upgrade Failed</h2>
                  <p className="mt-1 text-gray-300">{checkoutMessage}</p>
                  <button
                    onClick={() => setCheckoutPhase("idle")}
                    className="mt-5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
                  >
                    Back to tiers
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {checkoutPhase === "idle" && (
          <>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1 sm:mb-2">
              Upgrade Tier
            </h1>
            <p className="text-[13px] sm:text-lg text-gray-400 mb-4 sm:mb-10">
              Boost <span className="text-white font-medium">{community.name}</span> by
              upgrading its visibility and reducing its promotion cooldown.
            </p>

            {/* MOBILE */}
            <div className="sm:hidden">
              <div className="grid grid-cols-1 gap-3">
                <MobileTierCard
                  title="Normal"
                  subtitle="4h Cooldown"
                  price=""
                  gradient="bg-[#151515]"
                  border="border border-white/10 opacity-90"
                  accentText="base"
                  badgeIcon={<Clock size={12} className="text-slate-300" />}
                  perks={["Standard listing placement", "Default promotion speed", "Default listing"]}
                  disabledText="Downgrade Not Allowed"
                  disabled
                  isCurrent={community.tier === "normal"}
                />

                <MobileTierCard
                  title="Silver"
                  subtitle="2h Cooldown"
                  price="$10/mo"
                  gradient="bg-gradient-to-br from-slate-800 to-slate-900"
                  border={community.tier === "silver" ? "border border-slate-300" : "border border-slate-500"}
                  badgeIcon={<Star size={12} className="text-slate-200" />}
                  perks={["Better listing priority", "2 hour promotion cooldown", "Silver highlighted listing"]}
                  disabledText="Downgrade Not Allowed"
                  disabled={["silver", "gold"].includes(community.tier)}
                  isCurrent={community.tier === "silver"}
                  cta="Upgrade"
                  onClick={() => startCheckout(PAYNOW_SILVER_PRODUCT_ID, "silver")}
                />

                <MobileTierCard
                  title="Gold"
                  subtitle="1h Cooldown"
                  price="$14.99/mo"
                  gradient="bg-gradient-to-br from-yellow-900 via-yellow-800 to-[#1a1a1a]"
                  border={community.tier === "gold" ? "border border-yellow-300" : "border border-yellow-400"}
                  accentText="best value"
                  badgeIcon={<Crown size={12} className="text-yellow-300" />}
                  perks={["Top listing priority", "1 hour promotion cooldown", "Gold highlighted listing"]}
                  disabledText="Downgrade Not Allowed"
                  disabled={community.tier === "gold"}
                  isCurrent={community.tier === "gold"}
                  cta="Upgrade"
                  onClick={() => startCheckout(PAYNOW_GOLD_PRODUCT_ID, "gold")}
                />
              </div>

              <div className="mt-4 flex flex-col items-center justify-between gap-2 text-[12px] text-slate-400/90">
                <div className="inline-flex items-center gap-2">
                  <ShieldCheck size={14} />
                  <span>Payments handled securely via Paynow</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Zap size={14} />
                  <span>Cancel anytime • Renews monthly</span>
                </div>
              </div>
            </div>

            {/* DESKTOP */}
            <div className="hidden sm:block">
              <div className="grid gap-6 md:grid-cols-3">
                <TierCard
                  title="Normal"
                  subtitle="4h Cooldown"
                  price=""
                  gradient="bg-[#151515]"
                  border="border border-white/10 opacity-70"
                  accentText="base"
                  badgeIcon={<Clock size={14} className="text-slate-300" />}
                  perks={["Standard listing placement", "Default promotion speed", "Default listing"]}
                  disabledText="Downgrade Not Allowed"
                  disabled
                  isCurrent={community.tier === "normal"}
                />

                <TierCard
                  title="Silver"
                  subtitle="2h Cooldown"
                  price="$10/mo"
                  gradient="bg-gradient-to-br from-slate-800 to-slate-900"
                  border={community.tier === "silver" ? "border border-slate-300" : "border border-slate-500"}
                  accentText=""
                  badgeIcon={<Star size={14} className="text-slate-200" />}
                  perks={["Better listing priority", "2 hour promotion cooldown", "Silver highlighted listing"]}
                  disabledText="Downgrade Not Allowed"
                  disabled={["silver", "gold"].includes(community.tier)}
                  isCurrent={community.tier === "silver"}
                  cta="Upgrade"
                  onClick={() => startCheckout(PAYNOW_SILVER_PRODUCT_ID, "silver")}
                  active={community.tier !== "silver"}
                />

                <TierCard
                  title="Gold"
                  subtitle="1h Cooldown"
                  price="$14.99/mo"
                  gradient="bg-gradient-to-br from-yellow-900 via-yellow-800 to-[#1a1a1a]"
                  border={community.tier === "gold" ? "border border-yellow-300" : "border border-yellow-400"}
                  accentText="best value"
                  badgeIcon={<Crown size={14} className="text-yellow-300" />}
                  perks={["Top listing priority", "1 hour promotion cooldown", "Gold highlighted listing"]}
                  disabledText="Downgrade Not Allowed"
                  disabled={community.tier === "gold"}
                  isCurrent={community.tier === "gold"}
                  cta="Upgrade"
                  onClick={() => startCheckout(PAYNOW_GOLD_PRODUCT_ID, "gold")}
                  active={community.tier !== "gold"}
                />
              </div>

              <div className="mt-10 flex flex-col items-center justify-between gap-3 text-sm text-slate-400/90 sm:flex-row">
                <div className="inline-flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <span>Payments handled securely via Paynow</span>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Zap size={16} />
                  <span>Cancel anytime • Renews monthly</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Signup Prompt Modal */}
      {showSignupPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setShowSignupPrompt(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-neutral-950/95 border border-neutral-800 shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-6 z-10">
            <div className="flex flex-col items-center space-y-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 shadow-inner mt-6">
                <svg
                  className="h-6 w-6 text-neutral-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-center space-y-2 mt-2">
                <h2 className="text-white text-2xl font-semibold">Sign up to continue</h2>
                <p className="text-neutral-400 text-sm">
                  Create an account to promote and discover communities.
                </p>
              </div>
              <div className="w-full space-y-3 pt-2">
                <button
                  onClick={() => {
                    const redirect =
                      typeof window !== "undefined"
                        ? encodeURIComponent(
                            window.location.pathname + window.location.search
                          )
                        : "%2F";
                    router.push(`/signup?redirect=${redirect}`);
                  }}
                  className="w-full bg-white text-black font-medium py-3 rounded-xl transition-colors hover:bg-neutral-100 focus:ring-2 focus:ring-white/30 cursor-pointer"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setShowSignupPrompt(false)}
                  className="w-full bg-neutral-900 text-neutral-300 font-medium py-3 rounded-xl border border-neutral-800 transition-colors hover:bg-neutral-800 focus:ring-2 focus:ring-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          0% {
            transform: scale(0.98);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}