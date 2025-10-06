// app/upgrade/[id]/page.tsx
"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Crown, Star, Clock, ShieldCheck, Zap } from "lucide-react";

type Community = { name: string; tier: "normal" | "silver" | "gold" };

export default function UpgradeTierPage() {
  const { id } = useParams();
  const router = useRouter();

  // ====== Paynow product IDs ======
  const PAYNOW_GOLD_PRODUCT_ID = "478332020456427520"; // one-time product
  const PAYNOW_SILVER_PRODUCT_ID = "476429842842124288";
  // ================================

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  // Seed a stable guest identity if no auth is present (helps testing)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("uid")) {
      const guestId =
        (globalThis.crypto as any)?.randomUUID?.() ||
        `guest-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("uid", guestId);
      // also seed a guest email so the upsert API has one
      if (!localStorage.getItem("user_email")) {
        localStorage.setItem("user_email", `guest-${guestId}@example.com`);
      }
      console.info("[upgrade] seeded guest uid:", guestId);
    }
  }, []);

  /** Pull UID + email from LS; if missing, try Firebase currentUser */
  async function getUserIdentity(): Promise<{ uid: string; email: string }> {
    let uid =
      (typeof window !== "undefined" &&
        (localStorage.getItem("firebase_uid") ||
          localStorage.getItem("uid"))) ||
      "";
    let email =
      (typeof window !== "undefined" && localStorage.getItem("user_email")) ||
      "";

    if (!uid || !email) {
      try {
        const { getAuth } = await import("firebase/auth");
        const u = getAuth().currentUser;
        if (u) {
          uid = uid || u.uid;
          email =
            email || (u.email || u.providerData[0]?.email || "").toString();
          if (uid) localStorage.setItem("firebase_uid", uid);
          if (email) localStorage.setItem("user_email", email);
        }
      } catch {
        // Firebase not available on page—ignore and continue with LS
      }
    }

    return { uid, email };
  }

  /** Ensure a PayNow customer exists for this user, return customerId */
  async function upsertAndGetCustomerId(userUid: string, email: string) {
    const r = await fetch("/api/paynow/upsert-customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userUid, email }), // <-- MUST send email (not "name")
    });

    if (!r.ok) {
      console.error("upsert-customer failed:", await r.text());
      return "";
    }
    const data = await r.json();
    if (!data?.customerId) {
      console.error("upsert-customer returned no customerId:", data);
    }
    return data?.customerId || "";
  }

  /** MAIN: start checkout flow for a given tier/product */
  async function startCheckout(productId: string, tier: "gold" | "silver") {
    const serverId = Number(id);
    const { uid, email } = await getUserIdentity();

    if (!uid || !email) {
      console.error("[upgrade] Missing UID or email. Aborting.");
      alert("Please sign in again.");
      return;
    }

    // 1) Ensure PayNow customer exists (1 per user)
    const customerId = await upsertAndGetCustomerId(uid, email);
    if (!customerId) {
      alert("Could not resolve customer. Try again.");
      return;
    }

    // 2) Create checkout tied to that customer
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

      const { url, error, detail } = await r.json();
      if (!r.ok || !url) {
        console.error("Checkout failed:", error, detail);
        alert("Checkout failed. See console for details.");
        return;
      }
      window.location.href = url; // PayNow hosted checkout
    } catch (e) {
      console.error(e);
      alert("Network error starting checkout.");
    }
  }

  // keep your refresh behavior
  useLayoutEffect(() => {
    const key = "refreshed-login-page";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "true");
      window.location.replace(window.location.href);
    }
    return () => sessionStorage.removeItem(key);
  }, []);

  // load community data
  useEffect(() => {
    const fetchCommunity = async () => {
      const res = await fetch(`/api/communities/${id}`);
      const data = await res.json();
      setCommunity(data);
      setLoading(false);
    };
    fetchCommunity();
  }, [id]);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#0b0b0c] text-white">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-white/10 to-slate-500/10" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-slate-400/10 to-white/10" />
        </div>
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-6 h-4 w-24 rounded bg-white/10 animate-pulse" />
          <div className="h-9 w-48 rounded bg-white/10 animate-pulse mb-3" />
          <div className="h-4 w-80 rounded bg-white/10 animate-pulse mb-10" />
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
              >
                <div className="h-6 w-24 rounded bg-white/10 animate-pulse mb-3" />
                <div className="h-4 w-32 rounded bg-white/10 animate-pulse mb-6" />
                <div className="h-9 w-full rounded bg-white/10 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!community) return <div className="text-white p-10">Community not found.</div>;

  // ---- Tier Card ----
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
        <span className="opacity-70">• {accentText}</span>
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
      <p
        className={`text-sm mb-4 ${
          title === "Gold" ? "text-yellow-200/90" : "text-gray-400"
        }`}
      >
        {subtitle}
      </p>
      <ul className="mb-5 space-y-2 text-sm text-slate-300/90">
        {perks.map((p) => (
          <li
            key={p}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            • {p}
          </li>
        ))}
      </ul>
      {disabled ? (
        <button
          disabled
          className="w-full cursor-not-allowed rounded-md bg-gray-700/70 px-4 py-2 font-medium text-white"
        >
          {isCurrent ? "Current Tier" : disabledText}
        </button>
      ) : (
        <button
          onClick={onClick}
          className={`w-full rounded-md px-4 py-2 font-semibold transition-transform active:scale-[0.99] ${
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

  return (
    <div className="relative min-h-screen bg-[#0b0b0c] text-white font-sans">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-white/10 to-slate-500/10" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-slate-400/10 to-white/10" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-4xl font-bold tracking-tight mb-2">Upgrade Tier</h1>
        <p className="text-gray-400 text-lg mb-10">
          Boost{" "}
          <span className="text-white font-medium">{community.name}</span> by
          upgrading its tier and reducing its promotion cooldown.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <TierCard
            title="Normal"
            subtitle="24h Cooldown"
            price=""
            gradient="bg-[#151515]"
            border="border border-white/10 opacity-70"
            accentText="base"
            badgeIcon={<Clock size={14} className="text-slate-300" />}
            perks={[
              "Standard listing placement",
              "Default promotion speed",
              "Community support",
            ]}
            disabledText="Downgrade Not Allowed"
            disabled
            isCurrent={community.tier === "normal"}
          />

          <TierCard
            title="Silver"
            subtitle="12h Cooldown"
            price="$10/mo"
            gradient="bg-gradient-to-br from-slate-800 to-slate-900"
            border={
              community.tier === "silver"
                ? "border border-slate-300"
                : "border border-slate-500"
            }
            accentText=""
            badgeIcon={<Star size={14} className="text-slate-200" />}
            perks={[
              "Better listing priority",
              "Half the cooldown time",
              "Early access to new features",
            ]}
            disabledText="Downgrade Not Allowed"
            disabled={["silver", "gold"].includes(community.tier)}
            isCurrent={community.tier === "silver"}
            cta="Upgrade"
            onClick={() =>
              startCheckout(PAYNOW_SILVER_PRODUCT_ID, "silver")
            }
            active={community.tier !== "silver"}
          />

          <TierCard
            title="Gold"
            subtitle="6h Cooldown"
            price="$14.99/mo"
            gradient="bg-gradient-to-br from-yellow-900 via-yellow-800 to-[#1a1a1a]"
            border={
              community.tier === "gold"
                ? "border border-yellow-300"
                : "border border-yellow-400"
            }
            accentText="best value"
            badgeIcon={<Crown size={14} className="text-yellow-300" />}
            perks={[
              "Top listing priority",
              "Fastest promotion cooldown",
              "Priority support",
            ]}
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
    </div>
  );
}
