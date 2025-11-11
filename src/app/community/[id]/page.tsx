"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "@/app/communityPage.css";
import "@/app/logup.css";
import { useAuth } from "@/app/hooks/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { getAuth } from "firebase/auth";
import { Check, AlertCircle, X } from "lucide-react";
import "@/app/all.css";
import ReactDOM from "react-dom";

export default function CommunityDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  // ===== Hooks MUST be inside the component and before they're used =====
  const modalHostRef = useRef<HTMLDivElement | null>(null);
  const [shadowRootEl, setShadowRootEl] = useState<ShadowRoot | null>(null);

  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showPromoCard, setShowPromoCard] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [buttonShaking, setButtonShaking] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  // NEW: track viewport width to scale the floating promo card under 585px
  const [vw, setVw] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Progressive scale: 1 at 585px → 0.74 at 320px (linear)
  const cardScale =
    vw >= 585
      ? 1
      : vw <= 320
      ? 0.74
      : 0.74 + ((vw - 320) * (1 - 0.74)) / (585 - 320);
  const cardRightPx = vw >= 585 ? 24 : vw >= 420 ? 16 : 12; // tighten right padding on very small screens
  const cardBottomPx = vw >= 585 ? 24 : 18; // small bump so it doesn't feel cramped

  // Declare before any effect that reads it
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  // Updated toast state to support multiple toasts with types
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type: "success" | "error" | "warning" | "info";
      timeout?: NodeJS.Timeout;
    }>
  >([]);

  // ===== NEW: local displayed promotion count for live +1 with animation =====
  const [displayedPromoteCount, setDisplayedPromoteCount] = useState<number>(0);

  // ===== Unlimited hourly boosts state (mirrors the new index logic) =====
  const [userPromoInfo, setUserPromoInfo] = useState<{
    userLastPromotion: string | null;
    canBoostNow: boolean;
    secondsRemaining: number; // 0 means ready
    nextEligibleAt: string | null;
  }>({
    userLastPromotion: null,
    canBoostNow: true,
    secondsRemaining: 0,
    nextEligibleAt: null,
  });

  // State for community promotions info: a mapping from community id to its last promotion time.
  const [communityPromotions, setCommunityPromotions] = useState<{
    [key: number]: string;
  }>({});

  const buttonTop = 0; // Change this value to move button up/down
  const buttonRight = 0; // Change this value to move button left/right

  // top of file, under other consts
  const PERSONAL_COOLDOWN_MS = 60 * 60 * 1000; // 1h

  // Update "now" every second so countdowns refresh in real time.
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle header visibility based on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling up or at top of page
      if (currentScrollY < lastScrollY || currentScrollY <= 0) {
        setShowHeader(true);
      }
      // Hide header when scrolling down past a threshold
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Clean up toasts on unmount
  useEffect(() => {
    return () => {
      toasts.forEach((toast) => {
        if (toast.timeout) clearTimeout(toast.timeout);
      });
    };
  }, [toasts]);

  // Shadow DOM setup for the signup modal (safe: showSignupPrompt is declared earlier)
  useEffect(() => {
    if (!showSignupPrompt) return;
    const host = modalHostRef.current;
    if (!host) return;

    const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    setShadowRootEl(root);

    // Optional: add a tiny reset so browser default styles are consistent
    if (!root.getElementById("modal-reset")) {
      const style = document.createElement("style");
      style.id = "modal-reset";
      style.textContent = `
        *, *::before, *::after { box-sizing: border-box; }
        :host, html, body { margin: 0; padding: 0; }
        .fixed { position: fixed; }
        .inset-0 { top:0; right:0; bottom:0; left:0; }
      `;
      root.appendChild(style);
    }
  }, [showSignupPrompt]);

  // Fetch user promotion info if logged in. (mirrors index behavior with nextEligibleAt, canBoostNow, secondsRemaining)
  useEffect(() => {
    const fetchUserPromotionInfo = async () => {
      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/user-promotion-info", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.error("Failed to fetch user promotion info");
          return;
        }
        const data = await res.json();

        const last = data.userLastPromotion ? new Date(data.userLastPromotion).getTime() : null;
        const derivedNextEligibleAtMs = last ? last + PERSONAL_COOLDOWN_MS : null;

        const nowMs = Date.now();
        const nextMs = (data.nextEligibleAt ? new Date(data.nextEligibleAt).getTime() : derivedNextEligibleAtMs) as number | null;
        const derivedSecondsRemaining = nextMs ? Math.max(0, Math.floor((nextMs - nowMs) / 1000)) : 0;

        setUserPromoInfo({
          userLastPromotion: data.userLastPromotion ?? null,
          canBoostNow: nextMs ? nowMs >= nextMs : true,
          secondsRemaining: typeof data.secondsRemaining === "number" ? data.secondsRemaining : derivedSecondsRemaining,
          nextEligibleAt: nextMs ? new Date(nextMs).toISOString() : null,
        });
      } catch (err) {
        console.error("Error fetching user promotion info:", err);
      }
    };
    if (user) {
      fetchUserPromotionInfo();
    }
  }, [user]);

  // Fetch the community promotions info.
  useEffect(() => {
    const fetchCommunityPromotions = async () => {
      try {
        const res = await fetch("/api/community-promotions-info");
        if (!res.ok) {
          console.error("Failed to fetch community promotions info");
          return;
        }
        const data = await res.json();
        const promoMap: { [key: number]: string } = {};
        data.promotions.forEach(
          (promo: { community_id: number; promoted_at: string }) => {
            promoMap[promo.community_id] = promo.promoted_at;
          }
        );
        setCommunityPromotions(promoMap);
      } catch (err) {
        console.error("Error fetching community promotions info:", err);
      }
    };
    fetchCommunityPromotions();
  }, []);

  // A helper function to compute the countdown timer.
  const getCountdown = (baseTimeISO: string, duration: number) => {
    const baseTime = new Date(baseTimeISO).getTime();
    theCooldownEnd: {
      /* label just to make intent obvious; no-op */
    }
    const cooldownEnd = baseTime + duration;
    const remaining = cooldownEnd - now;
    if (remaining <= 0) return null;
    const seconds = Math.floor((remaining / 1000) % 60);
    const minutes = Math.floor((remaining / (1000 * 60)) % 60);
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    return { hours, minutes, seconds };
  };

  // Updated toast function to support multiple toasts with types
  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setToasts((prev) => {
      // 1) If an ERROR toast already exists, update its text & reset its timer (no stacking)
      if (type === "error") {
        const existingError = prev.find((t) => t.type === "error");
        if (existingError) {
          if (existingError.timeout) clearTimeout(existingError.timeout);
          const newTimeout = setTimeout(() => {
            setToasts((curr) => curr.filter((t) => t.id !== existingError.id));
          }, 3000);
          return prev.map((t) =>
            t.id === existingError.id ? { ...t, message, timeout: newTimeout } : t
          );
        }
      }

      // 2) De-dupe: if same type+message exists, just reset its timer
      const duplicate = prev.find((t) => t.type === type && t.message === message);
      if (duplicate) {
        if (duplicate.timeout) clearTimeout(duplicate.timeout);
        const newTimeout = setTimeout(() => {
          setToasts((curr) => curr.filter((t) => t.id !== duplicate.id));
        }, 3000);
        return prev.map((t) =>
          t.id === duplicate.id ? { ...t, timeout: newTimeout } : t
        );
      }

      // 3) Otherwise, add a new toast
      const id = Date.now().toString();
      const timeout = setTimeout(() => {
        setToasts((curr) => curr.filter((t) => t.id !== id));
      }, 3000);
      return [...prev, { id, message, type, timeout }];
    });
  };

  // Handle button shake animation
  const shakeButton = () => {
    setButtonShaking(true);
    setTimeout(() => {
      setButtonShaking(false);
    }, 500);
  };

  // Handle Post Community button click
  const handlePostCommunity = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/signup?redirect=/dashboard");
    }
  };

  // ===== Promote (unlimited hourly, mirrors index logic) =====
  const handlePromote = async (community_id: number) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        shakeButton();
        showToast("Create an account to promote communities", "error");
        setTimeout(() => setShowSignupPrompt(true), 600);
        return;
      }

      // Live eligibility from nextEligibleAt (survives refresh)
      const canBoostNow = userPromoInfo.nextEligibleAt
        ? now >= new Date(userPromoInfo.nextEligibleAt).getTime()
        : true;

      const secondsRemaining = userPromoInfo.nextEligibleAt
        ? Math.max(0, Math.floor((new Date(userPromoInfo.nextEligibleAt).getTime() - now) / 1000))
        : 0;

      if (!canBoostNow || secondsRemaining > 0) {
        const h = Math.floor(secondsRemaining / 3600);
        const m = Math.floor((secondsRemaining % 3600) / 60);
        showToast(`Wait ${h}h ${m}m before promoting again`, "warning");
        shakeButton();
        return;
      }

      // Check community cooldown by tier (UPDATED: normal 4h, silver 2h, gold 1h)
      const tier = community?.tier || "normal";
      let cooldownMs = 4 * 60 * 60 * 1000; // normal
      if (tier === "silver") cooldownMs = 2 * 60 * 60 * 1000;
      if (tier === "gold") cooldownMs = 1 * 60 * 60 * 1000;

      if (communityPromotions[community_id]) {
        const communityCooldown = getCountdown(communityPromotions[community_id], cooldownMs);
        if (communityCooldown) {
          showToast(`This community was already promoted. Wait ${communityCooldown.hours}h ${communityCooldown.minutes}m`, "info");
          shakeButton();
          return;
        }
      }

      const res = await fetch("/api/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ community_id }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Structured cooldown from backend (optional)
        if (res.status === 429 && data?.reason === "user_personal_cooldown") {
          setUserPromoInfo((prev) => ({
            ...prev,
            canBoostNow: false,
            secondsRemaining: typeof data.secondsRemaining === "number" ? data.secondsRemaining : prev.secondsRemaining,
            nextEligibleAt: data.nextEligibleAt ?? prev.nextEligibleAt,
          }));
          const s = data.secondsRemaining ?? 0;
          const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
          showToast(`Wait ${h}h ${m}m before promoting again`, "warning");
          shakeButton();
          return;
        }
        if (res.status === 429 && data?.reason === "community_cooldown") {
          const s = data.secondsRemaining ?? 0;
          const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
          showToast(`This community was already promoted. Wait ${h}h ${m}m`, "info");
          shakeButton();
          return;
        }
        console.error("Promotion error:", data?.error);
        showToast(data?.error || "Failed to promote community", "error");
        shakeButton();
        return;
      }

      // Success
      const nowISO = new Date().toISOString();
      setCommunityPromotions((prev) => ({ ...prev, [community_id]: nowISO }));
      setUserPromoInfo((prev) => ({
        ...prev,
        userLastPromotion: nowISO,
        canBoostNow: false,
        secondsRemaining: 60 * 60, // 1 hour
        nextEligibleAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }));

      // ===== NEW: bump the displayed count immediately with a tiny animation =====
      setDisplayedPromoteCount((prev) => prev + 1);

      showToast("Community successfully promoted!", "success");
    } catch (err) {
      console.error("Unexpected error promoting:", err);
      shakeButton();
      showToast("Something went wrong. Please try again later.", "error");
    }
  };

  useEffect(() => {
    const fetchCommunity = async () => {
      const res = await fetch(`/api/communities/${id}`);
      const data = await res.json();

      setCommunity(data);
      // ===== NEW: initialize displayed count from fetched data =====
      setDisplayedPromoteCount((data?.promote_count as number) || 0);
      setLoading(false);
    };
    fetchCommunity();
  }, [id]);

  // ===== NEW: keep displayed count in sync if community updates from elsewhere =====
  useEffect(() => {
    if (community && typeof community.promote_count === "number") {
      setDisplayedPromoteCount(community.promote_count);
    }
  }, [community?.promote_count]);

  // Components for the status UI
  const FlameIcon = () => (
    <svg
      width="24"
      height="27"
      viewBox="0 0 20 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M11.1758045,11.5299649 C11.7222481,10.7630248 11.6612694,9.95529555 11.2823626,8.50234466 C10.5329929,5.62882187 10.8313891,4.05382867 13.4147321,2.18916004 L14.6756139,1.27904986 L14.9805807,2.80388386 C15.3046861,4.42441075 15.8369398,5.42670671 17.2035766,7.35464078 C17.2578735,7.43122022 17.2578735,7.43122022 17.3124108,7.50814226 C19.2809754,10.2854144 20,11.9596204 20,15 C20,18.6883517 16.2713564,22 12,22 C7.72840879,22 4,18.6888043 4,15 C4,14.9310531 4.00007066,14.9331427 3.98838852,14.6284506 C3.89803284,12.2718054 4.33380946,10.4273676 6.09706666,8.43586022 C6.46961415,8.0150872 6.8930834,7.61067534 7.36962714,7.22370749 L8.42161802,6.36945926 L8.9276612,7.62657706 C9.30157948,8.55546878 9.73969716,9.28566491 10.2346078,9.82150804 C10.6537848,10.2753538 10.9647401,10.8460665 11.1758045,11.5299649 Z M7.59448531,9.76165711 C6.23711779,11.2947332 5.91440928,12.6606068 5.98692012,14.5518252 C6.00041903,14.9039019 6,14.8915108 6,15 C6,17.5278878 8.78360021,20 12,20 C15.2161368,20 18,17.527472 18,15 C18,12.4582072 17.4317321,11.1350292 15.6807305,8.66469725 C15.6264803,8.58818014 15.6264803,8.58818014 15.5719336,8.51124844 C14.5085442,7.0111098 13.8746802,5.96758691 13.4553336,4.8005211 C12.7704786,5.62117775 12.8107447,6.43738988 13.2176374,7.99765534 C13.9670071,10.8711781 13.6686109,12.4461713 11.0852679,14.31084 L9.61227259,15.3740546 L9.50184911,13.5607848 C9.43129723,12.4022487 9.16906461,11.6155508 8.76539217,11.178492 C8.36656566,10.7466798 8.00646835,10.2411426 7.68355027,9.66278925 C7.65342985,9.69565638 7.62374254,9.72861259 7.59448531,9.76165711 Z"
      />
    </svg>
  );

  const ClockIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  // ===== Live remaining seconds based on nextEligibleAt (exactly like index) =====
  const secondsLeft =
    userPromoInfo.nextEligibleAt
      ? Math.max(0, Math.floor((new Date(userPromoInfo.nextEligibleAt).getTime() - now) / 1000))
      : Math.max(0, userPromoInfo.secondsRemaining || 0);

  const userCooldown = secondsLeft > 0
    ? {
        hours: Math.floor(secondsLeft / 3600),
        minutes: Math.floor((secondsLeft % 3600) / 60),
        seconds: secondsLeft % 60,
      }
    : null;

  if (loading) return null;
  if (!community) return <div className="community-page">Community not found.</div>;

  // Get community cooldown status from the promotions object
  const tier = community?.tier || "normal";
  // UPDATED: normal 4h, silver 2h, gold 1h
  let cooldownMs = 4 * 60 * 60 * 1000;
  if (tier === "silver") cooldownMs = 2 * 60 * 60 * 1000;
  if (tier === "gold") cooldownMs = 1 * 60 * 60 * 1000;

  const communityCooldown = communityPromotions[Number(id)]
    ? getCountdown(communityPromotions[Number(id)], cooldownMs)
    : null;

  const isPromoted = communityCooldown !== null;

  // Format countdown timer for community badge
  const formattedCountdown = communityCooldown
    ? `${communityCooldown.hours.toString().padStart(2, "0")}:${communityCooldown.minutes
        .toString()
        .padStart(2, "0")}:${communityCooldown.seconds
        .toString()
        .padStart(2, "0")}`
    : "";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // ------- Title class based on tier (adds the gradient text color) -------
  const titleClass =
    "community-title " +
    (tier === "silver"
      ? "community-title--silver"
      : tier === "gold"
      ? "community-title--gold"
      : "community-title--normal");

  // ===== Floating promo card: same look/logic as index (progress + Ready) =====
  const totalSeconds = Math.floor(PERSONAL_COOLDOWN_MS / 1000);
  const progress = userCooldown
    ? Math.min(1, Math.max(0, (totalSeconds - secondsLeft) / totalSeconds))
    : 1;

  // ===== Keep original sizes for the button (used in modern button's animate) =====
  const targetWidth = isMobile
    ? (isPromoted ? "136px" : "112px") // +16px when promoted on mobile
    : (isPromoted ? "140px" : "120px");

  const targetHeight = isMobile ? (isPromoted ? "45px" : "50px") : "50px";

  return (
    <div className="community-page">
      {/* Sticky Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "black",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 1rem",
          borderBottomLeftRadius: "15px",
          borderBottomRightRadius: "15px",
          border: "1px solid #333",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          transform: showHeader ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >

        </Link>

        {/* "Post your Community" Button */}
        <button
          id="postabutton"
          className="postabutton"
          onClick={handlePostCommunity}
          style={{ position: "relative", width: "fit-content" }}
        >
          <span>Post your Community</span>
        </button>
      </header>

      {/* Toast Container - New Implementation */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: "90vw",
          width: "min(560px, 92vw)",
          alignItems: "center",
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                background:
                  toast.type === "success"
                    ? "rgba(34, 197, 94, 0.9)"
                    : toast.type === "error"
                    ? "rgba(239, 68, 68, 0.9)"
                    : toast.type === "warning"
                    ? "rgba(245, 158, 11, 0.9)"
                    : "rgba(59, 130, 246, 0.9)",
                color: "white",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.9rem",
                fontWeight: "500",
                width: "100%",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem",flex: 1,
                  minWidth: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                   }}
              >
                {toast.type === "success" && <Check size={18} />}
                {toast.type === "error" && <AlertCircle size={18} />}
                {toast.type === "warning" && <AlertCircle size={18} />}
                {toast.type === "info" && <Check size={18} />}
                {toast.message}
              </div>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Shadow DOM modal mount */}
      {showSignupPrompt &&
        shadowRootEl &&
        ReactDOM.createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{
                zIndex: 100000,
                backgroundColor: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(6px)",
              }}
              onClick={() => setShowSignupPrompt(false)}
            />

            {/* Centered wrapper */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100001,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
                animation: "fadeIn 0.2s ease-out",
              }}
            >
              {/* Modal */}
              <div
                style={{
                  width: "100%",
                  maxWidth: "420px",
                  borderRadius: "16px",
                  background: "rgba(10,10,10,0.95)",
                  border: "1px solid rgba(120,120,120,0.2)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
                  padding: "24px",
                  transform: "scale(1)",
                  animation: "scaleIn 0.2s ease-out",
                  color: "#e5e7eb",
                  fontFamily:
                    "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(120,120,120,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: "8px",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>

                  {/* Text */}
                  <div style={{ textAlign: "center" }}>
                    <h2
                      style={{
                        color: "white",
                        fontSize: "22px",
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Sign up to continue
                    </h2>
                    <p
                      style={{
                        color: "#9CA3AF",
                        fontSize: "14px",
                        margin: "6px 0 0",
                      }}
                    >
                      Create an account to promote and post communities.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <button
                      onClick={() => {
                        const redirect =
                          typeof window !== "undefined"
                            ? encodeURIComponent(
                                window.location.pathname +
                                  window.location.search
                              )
                            : "%2F";
                        router.push(`/signup?redirect=${redirect}`);
                      }}
                      style={{
                        width: "100%",
                        background: "white",
                        color: "black",
                        fontWeight: 600,
                        padding: "12px",
                        borderRadius: "12px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Sign Up
                    </button>

                    <button
                      onClick={() => setShowSignupPrompt(false)}
                      style={{
                        width: "100%",
                        background: "rgba(30,30,30,1)",
                        color: "#e5e7eb",
                        fontWeight: 600,
                        padding: "12px",
                        borderRadius: "12px",
                        border: "1px solid rgba(120,120,120,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Keyframes local to shadow DOM */}
                <style>{`
                  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                  @keyframes scaleIn { 0% { transform: scale(0.98) } 100% { transform: scale(1) } }
                `}</style>
              </div>
            </div>
          </>,
          shadowRootEl
        )}
      <div ref={modalHostRef} />

      {user && (
        <>
          {/* Floating Promo Card (same as index) */}
          {(() => {
            return (
              <div
                style={{
                  position: "fixed",
                  bottom: showPromoCard ? `${cardBottomPx}px` : "-6rem",
                  right: `${cardRightPx}px`,
                  zIndex: 10000,
                  backdropFilter: "blur(12px)",
                  background: "rgba(18,18,20,0.9)",
                  borderRadius: "16px",
                  padding: "14px",
                  width: "320px",
                  color: "#fff",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  transition: "all 0.4s ease, transform 0.25s ease",
                  opacity: showPromoCard ? 1 : 0,
                  fontFamily: "Inter, ui-sans-serif, system-ui",
                  transform: `scale(${cardScale})`,
                  transformOrigin: "bottom right",
                  pointerEvents: showPromoCard ? "auto" : "none",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <FlameIcon />
                    </div>
                    <span>Promotional Boosts</span>
                  </div>

                  <button
                    onClick={() => setShowPromoCard(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "#fff",
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Hide
                  </button>
                </div>

                {/* Status / Timer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      flexShrink: 0,
                    }}
                  >
                    <ClockIcon />
                  </div>

                  <div style={{ display: "grid", gap: 2, flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {userCooldown ? "Next boost in" : "Ready to boost"}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {userCooldown
                        ? `${userCooldown.hours.toString().padStart(2, "0")}:${userCooldown.minutes
                            .toString()
                            .padStart(2, "0")}:${userCooldown.seconds.toString().padStart(2, "0")}`
                        : "00:00:00"}
                    </div>
                  </div>

                  {!userCooldown && (
                    <div
                      style={{
                        padding: "4px 8px",
                        fontSize: 12,
                        borderRadius: 999,
                        background: "rgba(46, 204, 113, 0.18)",
                        border: "1px solid rgba(46, 204, 113, 0.35)",
                        color: "rgb(171, 243, 191)",
                        fontWeight: 600,
                      }}
                    >
                      Ready
                    </div>
                  )}
                </div>

                {/* Cooldown Progress */}
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      height: 8,
                      width: "100%",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.06)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round(progress * 100)}%`,
                        height: "100%",
                        borderRadius: 999,
                        background:
                          "linear-gradient(90deg, rgba(255,138,0,0.9), rgba(255,73,28,0.95))",
                        transition: "width 0.9s linear",
                      }}
                    />
                    {/* NOTE: inner styled-jsx removed — sheen CSS moved to global block below */}
                    <div className="cooldown-sheen" />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      opacity: 0.65,
                      marginTop: 6,
                    }}
                  >
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: 13,
                    color: "rgb(230,230,233)",
                    marginTop: 12,
                    marginBottom: 0,
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  Promote your community to increase its visibility!
                </p>
              </div>
            );
          })()}

          {/* Mini floating icon button */}
          {!showPromoCard && (
            <button
              onClick={() => setShowPromoCard(true)}
              aria-label="Show Boosts"
              style={{
                position: "fixed",
                bottom: `${cardBottomPx}px`,
                right: `${cardRightPx}px`,
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(18,18,20,0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 6px 22px rgba(0, 0, 0, 0.35)",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                zIndex: 10002,
                pointerEvents: "auto",
                transform: `scale(${cardScale})`,
                transformOrigin: "bottom right",
                transition: "transform 0.25s ease, right 0.25s ease, bottom 0.25s ease",
              }}
              role="button"
            >
              <FlameIcon />
            </button>
          )}

          {/* Edge tab */}
          {!showPromoCard && (
            <div
              onClick={() => setShowPromoCard(true)}
              style={{
                position: "fixed",
                bottom: 0,
                right: `${cardRightPx}px`,
                background: "rgba(18,18,20,0.92)",
                color: "#fff",
                padding: "6px 12px",
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                fontSize: 13,
                cursor: "pointer",
                zIndex: 10001,
                border: "1px solid rgba(255,255,255,0.08)",
                borderBottom: "none",
                pointerEvents: "auto",
                transform: `scale(${cardScale})`,
                transformOrigin: "bottom right",
                transition: "transform 0.25s ease, right 0.25s ease",
              }}
            >
              Show Boosts
            </div>
          )}
        </>
      )}

      <div className="image-banner">
        <img src={community.image_url} alt={community.name} />
      </div>

      <div className="community-info">
        {community?.tier === "normal" && (
          <button
            onClick={() => router.push(`/community/${id}/upgrade`)}
            className="tier-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path fill="none" d="M0 0h24v24H0z"></path>
              <path
                fill="currentColor"
                d="M5 13c0-5.088 2.903-9.436 7-11.182C16.097 3.564 19 7.912 19 13c0 .823-.076 1.626-.22 2.403l1.94 1.832a.5.5 0 0 1 .095.603l-2.495 4.575a.5.5 0 0 1-.793.114l-2.234-2.234a1 1 0 0 0-.707-.293H9.414a1 1 0 0 0-.707.293l-2.234 2.234a.5.5 0 0 1-.793-.114l-2.495-4.575a.5.5 0 0 1 .095-.603l1.94-1.832C5.077 14.626 5 13.823 5 13zm1.476 6.696l.817-.817A3 3 0 0 1 9.414 18h5.172a3 3 0 0 1 2.121.879l.817.817.982-1.8-1.1-1.04a2 2 0 0 1-.593-1.82c.124-.664.187-1.345.187-2.036 0-3.87-1.995-7.3-5-8.96C8.995 5.7 7 9.13 7 13c0 .691.063 1.372.187 2.037a2 2 0 0 1-.593 1.82l-1.1 1.039.982 1.8zM12 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
              ></path>
            </svg>
            <span>Upgrade tier</span>
          </button>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          {/* Title with tier-based gradient text */}
          <h1
            className={titleClass}
            style={{ fontSize: isMobile ? "2.6rem" : "3rem", marginBottom: "1.2rem" }}
          >
            {community.name}
          </h1>

          {/* Promote button */}
          <div
            className="promote-button-container"
            style={{ position: "relative" }}
          >
            {/* Promote count */}
            <div
              className="promote-count-badge"
              style={{
                fontSize: "1.2rem",
                color: "white",
                textAlign: "center",
                position: "absolute",
                top: isMobile ? "70px" : "85px",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "3px 10px",
                borderRadius: "10px",
                minWidth: "70px",
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.3)",
              }}
            >
              <span
                style={{ fontWeight: "bold", fontSize: "1.9rem", display: "block" }}
              >
                {/* ===== animated number change ===== */}
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={displayedPromoteCount}
                    initial={{ y: 8, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -6, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ display: "inline-block" }}
                  >
                    {displayedPromoteCount}
                  </motion.span>
                </AnimatePresence>
              </span>
              Promotions
            </div>

            {/* Subtle month-end reset note (requested) */}
            <div
              className="promo-reset-hint"
              style={{
                position: "absolute",
                top: isMobile ? "112px" : "128px",
                left: "50%",
                transform: "translateX(-50%)",
                maxWidth: 240,
                textAlign: "center",
                fontSize: "10.5px",
                lineHeight: 1.25,
                color: "rgba(255,255,255,0.65)",
                opacity: 0.55,
                userSelect: "none",
                pointerEvents: "auto",
                padding: "4px 6px",
                borderRadius: 8,
                backdropFilter: "blur(0px)",
                transition: "opacity .2s ease",
                whiteSpace: "nowrap",
              }}
              title="Resets monthly to keep things fair"
            >
            </div>

            {/* ======== MODERN PROMOTE BUTTON (exact look, same size) ======== */}
            <motion.button
              className={`modern-promote-button ${buttonShaking ? "button-shake" : ""}`}
              layout
              initial={false}
              animate={{
                width: targetWidth,
                height: targetHeight,
                padding: "0.5rem 1rem",
                background: isPromoted
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)"
                  : "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
                color: isPromoted ? "rgb(16, 185, 129)" : "#1a1a1a",
                boxShadow: isPromoted
                  ? "0 0 20px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  : "0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
                border: isPromoted ? "1.5px solid rgba(16, 185, 129, 0.4)" : "1.5px solid transparent",
                marginBottom: isPromoted ? 20 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8,
              }}
              style={{
                cursor: "pointer",
                fontSize: "1.15rem",
                fontWeight: 500,
                borderRadius: "14px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                backdropFilter: isPromoted ? "blur(10px)" : "none",
                transformOrigin: "center center",
                width: targetWidth,
                height: targetHeight,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePromote(Number(id));
              }}
              whileHover={
                !isPromoted
                  ? {
                      scale: 1.03,
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
                    }
                  : {}
              }
              whileTap={!isPromoted ? { scale: 0.97 } : {}}
            >
              <AnimatePresence mode="wait">
                {isPromoted ? (
                  <motion.span
                    key="promoted"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))" }}
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span style={{ textShadow: "0 0 8px rgba(16, 185, 129, 0.5)" }}>
                      Promoted
                    </span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="promote"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    style={{ position: "relative", zIndex: 1 }}
                  >
                    Promote
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Shimmer / glow when promoted */}
              {isPromoted && (
                <>
                  <div
                    className="modern-promote-shimmer"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)",
                      animation: "modern-shimmer 6s infinite",
                      zIndex: 1,
                    }}
                  />
                  <div
                    className="modern-promote-glow"
                    style={{
                      position: "absolute",
                      inset: "1px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3))",
                      filter: "blur(8px)",
                      opacity: 0.6,
                      zIndex: 0,
                      animation: "modern-pulse 9s infinite",
                    }}
                  />
                </>
              )}
            </motion.button>

            {/* Timer that appears when promoted (kept as before) */}
            {isPromoted && (
              <div
                className="promote-timer-badge"
                style={{
                  position: "absolute",
                  bottom: "-1px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: ".9rem",
                  background: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  padding: "1px 8px",
                  borderRadius: "10px",
                  whiteSpace: "nowrap",
                  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.3)",
                  width: "auto",
                  minWidth: "80px",
                  textAlign: "center",
                  fontWeight: "500",
                  animation: "promote-timer-popIn 0.3s forwards",
                }}
              >
                {formattedCountdown}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div
          className="tags"
          style={{
            textAlign: "left",
            marginRight: "1rem",
            justifyContent: "flex-start",
            paddingRight: "100px",
            ...(isMobile ? { marginBottom: "1rem" } : {}),
          }}
        >
          {community.tags.map((tag: string, index: number) => (
            <span
              className="tag"
              style={{
                marginTop: "1rem",
                fontSize: isMobile ? "1rem" : "1.3rem",
              }}
              key={index}
            >
              {tag}
            </span>
          ))}
        </div>

        <Link
          href={community.invite_link || "#"}
          target="_blank"
          className="join-button"
          style={{
            marginTop: community.tags.length === 0 ? "6rem" : "2rem",
          }}
        >
          Join 
        </Link>
{/* Month-end reset note (subtle) */}
<div
  style={{
    marginBottom: "-1.75rem",
    marginTop: "0.9rem",
    color: "#9CA3AF",       // grey
    fontSize: "0.8rem",    // small
    textAlign: "center",
  }}
>
  ⓘ promotions refresh at the end of the month to keep the listing fair.
</div>

        {/* Share section */}
        <div className="share" style={{ marginTop: "2rem" }}>
          <div
            style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}
          >
            Share
          </div>
          {/* Encourage others */}
          <div
            style={{
              marginTop: "-1rem",
              fontSize: "1.2rem",
              color: "#9CA3AF",
              marginBottom: "1rem",
            }}
          >
            Encourage others to promote this community!
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  "Support this community by promoting it!"
                )}&url=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#000",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {/* X logo */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="35"
                  height="35"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5549 21H20.7996L13.6818 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
                </svg>
              </a>
              <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>X</div>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#1877F2",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src="https://www.facebook.com/images/fb_icon_325x325.png"
                  alt="Facebook logo"
                  style={{ width: "48px", height: "48px", borderRadius: "4px" }}
                />
              </a>
              <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Facebook</div>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <a
                href={`https://www.reddit.com/submit?url=${encodeURIComponent(
                  typeof window !== "undefined" ? window.location.href : ""
                )}&title=${encodeURIComponent(
                  "Support this community by sharing it."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#FF4500",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src="https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png"
                  alt="Reddit logo"
                  style={{ width: "48px", height: "48px", borderRadius: "4px" }}
                />
              </a>
              <div style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>Reddit</div>
            </div>
          </div>
          <div
            style={{
              marginTop: "1.5rem",
              border: "1px solid #3A3E44",
              borderRadius: "0.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem 1rem",
              background: "#2A2E33",
            }}
          >
            <div
              style={{ color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {typeof window !== "undefined" ? window.location.href : ""}
            </div>
            <button
              onClick={() => {
                if (typeof window === "undefined") return;
                navigator.clipboard.writeText(window.location.href);
                const copyText = document.getElementById("copyText");
                const copyIcon = document.getElementById("copyIcon");
                const checkIcon = document.getElementById("checkIcon");
                if (copyText) (copyText as HTMLElement).innerText = "Copied";
                if (copyIcon) (copyIcon as HTMLElement).style.display = "none";
                if (checkIcon) (checkIcon as HTMLElement).style.display = "inline";
                setTimeout(() => {
                  if (copyText) (copyText as HTMLElement).innerText = "Copy";
                  if (copyIcon) (copyIcon as HTMLElement).style.display = "inline";
                  if (checkIcon) (checkIcon as HTMLElement).style.display = "none";
                }, 2000);
              }}
              id="copyButton"
              style={{
                background: "#6366F1",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <span id="copyText">Copy</span>
              <svg
                id="copyIcon"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginLeft: "0.5rem" }}
              >
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
              <svg
                id="checkIcon"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginLeft: "0.5rem", display: "none" }}
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Long description */}
        <div className="about " style={{ marginTop: "2rem" }}>
          <h4> About this community:</h4>
        </div>

        <p className="long-description">
          {community.long_description || community.description}
        </p>
      </div>

      {/* CSS animations (GLOBAL to avoid nested styled-jsx) */}
      <style jsx global>{`
        /* Sheen used in the promo card progress bar */
        .cooldown-sheen {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 40%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.22) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: sheen 2.2s infinite;
          pointer-events: none;
        }
        @keyframes sheen {
          0% { left: -40%; }
          100% { left: 100%; }
        }

        /* Modern button effects (for promoted state) */
        @keyframes modern-shimmer {
          0% { left: -100%; }
          20% { left: 150%; }
          100% { left: 150%; }
        }
        @keyframes modern-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.98); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }

        @keyframes promote-button-shine {
          0% { left: -100%; }
          20% { left: 150%; }
          100% { left: 150%; }
        }

        @keyframes promote-button-pulse {
          0% { box-shadow: 0 0 8px rgba(120, 255, 150, 0.4); }
          50% { box-shadow: 0 0 15px rgba(120, 255, 150, 0.7); }
          100% { box-shadow: 0 0 8px rgba(120, 255, 150, 0.4); }
        }

        @keyframes promote-timer-popIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(10px) scale(0.8);
          }
          70% {
            transform: translateX(-50%) translateY(-2px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes button-shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }

        .promote-button-promoted {
          animation: promote-button-pulse 2.5s infinite ease-in-out;
        }

        .button-shake {
          animation: button-shake 0.5s ease-in-out;
        }

        .promote-button-container:hover .promo-reset-hint {
          opacity: 0.85;
        }

        .promote-button-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>
    </div>
  );
}