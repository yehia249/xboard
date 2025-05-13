"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function UpgradePayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params.id;
  const plan = searchParams.get("plan"); // silver or gold

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const upgradeTier = async () => {
      const auth = await import("firebase/auth");
      const token = await auth.getAuth().currentUser?.getIdToken();
      if (!token) {
        setStatus("error");
        setMessage("Login required.");
        return;
      }

      const res = await fetch("/api/upgrade-tier", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          community_id: id,
          new_tier: plan,
        }),
      });

      let result;
      try {
        result = await res.json();
      } catch {
        setStatus("error");
        setMessage("Empty or invalid server response.");
        return;
      }

      if (res.ok) {
        setStatus("success");
        setMessage(`Successfully upgraded to ${plan} tier!`);
        setTimeout(() => {
          router.push(`/community/${id}`);
        }, 2000);
      } else {
        setStatus("error");
        setMessage(result.error || "Something went wrong.");
        setTimeout(() => {
          router.push(`/community/${id}/upgrade`);
        }, 3000);
      }
    };

    if (plan === "silver" || plan === "gold") {
      upgradeTier();
    } else {
      setStatus("error");
      setMessage("Invalid plan selected.");
      setTimeout(() => {
        router.push(`/community/${id}/upgrade`);
      }, 3000);
    }
  }, [id, plan, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] text-white px-6">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="animate-spin mx-auto mb-4 text-slate-300" size={36} />
            <h2 className="text-xl font-semibold mb-2">Upgrading Tier...</h2>
            <p className="text-gray-400">Please wait while we upgrade your community to <strong>{plan}</strong>.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="text-green-400 mx-auto mb-4" size={40} />
            <h2 className="text-2xl font-bold mb-2">Upgrade Successful!</h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="text-red-400 mx-auto mb-4" size={40} />
            <h2 className="text-2xl font-bold mb-2">Upgrade Failed</h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
