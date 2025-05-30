"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Community = {
  name: string;
  tier: "normal" | "silver" | "gold";
};


export default function UpgradeTierPage() {
  const { id } = useParams();
  const router = useRouter();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const key = "refreshed-login-page";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "true");
      window.location.replace(window.location.href);
    }
    return () => sessionStorage.removeItem(key);
  }, []);

  useEffect(() => {
    const fetchCommunity = async () => {
      const res = await fetch(`/api/communities/${id}`);
      const data = await res.json();
      setCommunity(data);
      setLoading(false);
    };
    fetchCommunity();
  }, [id]);

  if (loading) return null;
  if (!community) return <div className="text-white p-10">Community not found.</div>;

  const tierOrder = { normal: 0, silver: 1, gold: 2 };
  const currentTier = community.tier || "normal";

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white font-sans px-6 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-300 hover:text-white mb-6"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Header */}
        <h1 className="text-4xl font-bold mb-2 tracking-tight">Upgrade Tier</h1>
        <p className="text-gray-400 text-lg mb-10">
          Boost <span className="text-white font-medium">{community.name}</span> by upgrading its tier and reducing its promotion cooldown.
        </p>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Normal Tier */}
          <div className="rounded-2xl border border-gray-700 bg-[#1a1a1a] p-6 opacity-60">
            <h2 className="text-xl font-semibold mb-2">Normal</h2>
            <p className="text-sm text-gray-400 mb-4">24h Cooldown</p>
            <button
              disabled
              className="w-full py-2 rounded-md bg-gray-700 text-white font-medium"
            >
              {currentTier === "normal" ? "Current Tier" : "Downgrade Not Allowed"}
            </button>
          </div>

          {/* Silver Tier */}
          <div className={`rounded-2xl border ${currentTier === "silver" ? "border-slate-300" : "border-slate-500"} bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow hover:shadow-xl transition-shadow`}>
            <h2 className="text-xl font-semibold mb-2 text-slate-100">Silver</h2>
            <p className="text-sm text-gray-400 mb-4">12h Cooldown</p>
            {tierOrder[currentTier] >= tierOrder["silver"] ? (
              <button
                disabled
                className="w-full py-2 rounded-md bg-gray-700 text-white font-medium"
              >
                {currentTier === "silver" ? "Current Tier" : "Downgrade Not Allowed"}
              </button>
            ) : (
              <button
                onClick={() => router.push(`/community/${id}/upgrade/pay?plan=silver`)}
                className="w-full py-2 rounded-md bg-gradient-to-r from-slate-300 to-slate-100 text-black font-semibold cursor-pointer transition-transform"
              >
                Upgrade for $5/mo
              </button>
            )}
          </div>

          {/* Gold Tier */}
          <div className={`rounded-2xl border ${currentTier === "gold" ? "border-yellow-300" : "border-yellow-400"} bg-gradient-to-br from-yellow-900 via-yellow-800 to-[#1a1a1a] p-6 shadow-lg hover:shadow-2xl transition-shadow`}>
            <h2 className="text-xl font-semibold mb-2 text-yellow-300">Gold</h2>
            <p className="text-sm text-yellow-200 mb-4">6h Cooldown</p>
            {tierOrder[currentTier] >= tierOrder["gold"] ? (
              <button
                disabled
                className="w-full py-2 rounded-md bg-gray-700 text-white font-medium"
              >
                {currentTier === "gold" ? "Current Tier" : "Downgrade Not Allowed"}
              </button>
            ) : (
              <button
                onClick={() => router.push(`/community/${id}/upgrade/pay?plan=gold`)}
                className="w-full py-2 rounded-md bg-yellow-400 text-black font-semibold cursor-pointer transition-transform"
              >
                Upgrade for $15/mo
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-12">
          Cancel anytime. Your subscription will renew monthly.
        </p>
      </div>
    </div>
  );
}
