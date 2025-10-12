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

  // State for user promotion info: last promotion time and how many boosts used today.
  const [userPromoInfo, setUserPromoInfo] = useState<{
    userLastPromotion: string | null;
    dailyPromotionCount: number;
  }>({ userLastPromotion: null, dailyPromotionCount: 0 });

  // State for community promotions info: a mapping from community id to its last promotion time.
  const [communityPromotions, setCommunityPromotions] = useState<{
    [key: number]: string;
  }>({});

  const buttonTop = 0; // Change this value to move button up/down
  const buttonRight = 0; // Change this value to move button left/right

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

  // Shadow DOM setup for the signup modal (now safe: showSignupPrompt is declared earlier)
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

  // Fetch user promotion info if logged in.
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
        setUserPromoInfo(data);
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
    const id = Date.now().toString();
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);

    setToasts((prev) => [...prev, { id, message, type, timeout }]);
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

  // Handle promote button clicks.
  const handlePromote = async (community_id: number) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        shakeButton();
        showToast("Create an account to promote communities", "error");
        setTimeout(() => setShowSignupPrompt(true), 600); // <== delay here
        return;
      }

      // Check if user is on cooldown
      if (userPromoInfo.userLastPromotion) {
        const userCooldown = getCountdown(
          userPromoInfo.userLastPromotion,
          6 * 60 * 60 * 1000
        );
        if (userCooldown) {
          shakeButton();
          showToast(
            `Wait ${userCooldown.hours}h ${userCooldown.minutes}m before promoting again`,
            "warning"
          );
          return;
        }
      }

      // Check daily limit
      if (userPromoInfo.dailyPromotionCount >= 4) {
        shakeButton();
        showToast("You've used all 4 daily boosts", "error");
        return;
      }

      // Check community cooldown
      if (communityPromotions[Number(id)]) {
        const tier = community?.tier || "normal";
        let cooldownMs = 24 * 60 * 60 * 1000;
        if (tier === "silver") cooldownMs = 12 * 60 * 60 * 1000;
        if (tier === "gold") cooldownMs = 6 * 60 * 60 * 1000;

        const communityCooldown = getCountdown(
          communityPromotions[Number(id)],
          cooldownMs
        );
        if (communityCooldown) {
          showToast(
            `This community was already promoted. Wait ${communityCooldown.hours}h ${communityCooldown.minutes}m`,
            "info"
          );
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
        console.error("Promotion error:", data.error);
        shakeButton();
        showToast(data.error || "Failed to promote community", "error");
        return;
      }

      // on success, update your UI state without any alert
      const nowISO = new Date().toISOString();
      setCommunityPromotions((prev) => ({ ...prev, [community_id]: nowISO }));
      setUserPromoInfo((prev) => ({
        userLastPromotion: nowISO,
        dailyPromotionCount: prev.dailyPromotionCount + 1,
      }));

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

      console.log("Fetched community:", data);

      setCommunity(data);
      setLoading(false);
    };
    fetchCommunity();
  }, [id]);

  // Components for the status UI
  const FlameIcon = () => (
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
      <path d="M12 2C12 2 4 8 8 16C10.5 20 12 22 12 22C12 22 13.5 20 16 16C20 8 12 2 12 2Z" />
      <path d="M12 11a1 1 0 0 1-1 1 1 1 0 0 0 0 2 3 3 0 0 0 3-3 3 3 0 0 0-1-2.24" />
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

  // Calculate the user's 6-hour cooldown and the number of promotions left today.
  const userCooldown = userPromoInfo.userLastPromotion
    ? getCountdown(userPromoInfo.userLastPromotion, 6 * 60 * 60 * 1000)
    : null;
  const dailyPromosLeft = 4 - (userPromoInfo.dailyPromotionCount || 0);

  if (loading) return null;
  if (!community) return <div className="community-page">Community not found.</div>;

  // Get community cooldown status from the promotions object
  const tier = community?.tier || "normal";
  let cooldownMs = 24 * 60 * 60 * 1000;
  if (tier === "silver") cooldownMs = 12 * 60 * 60 * 1000;
  if (tier === "gold") cooldownMs = 6 * 60 * 60 * 1000;

  const communityCooldown = communityPromotions[Number(id)]
    ? getCountdown(communityPromotions[Number(id)], cooldownMs)
    : null;

  // Disable the Promote button if either:
  // • The community is still on a cooldown, or
  // • The user is on the 6-hour cooldown
  const isPromoted = communityCooldown !== null;
  const disableButton =
    isPromoted ||
    (userPromoInfo.userLastPromotion
      ? getCountdown(userPromoInfo.userLastPromotion, 6 * 60 * 60 * 1000) !==
        null
      : false);

  // Format countdown timer for tooltip
  const formattedCountdown = communityCooldown
    ? `${communityCooldown.hours.toString().padStart(2, "0")}:${communityCooldown.minutes
        .toString()
        .padStart(2, "0")}:${communityCooldown.seconds
        .toString()
        .padStart(2, "0")}`
    : "";

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

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
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
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
                      Create an account to promote and discover communities.
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
          width: "320px",
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
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
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

      {user && (
        <>
          {/* Floating Promo Card */}
          <div
            style={{
              position: "fixed",
              bottom: showPromoCard ? "1.5rem" : "-6rem",
              right: "1.5rem",
              zIndex: 10000,
              backdropFilter: "blur(12px)",
              backgroundColor: "rgba(24, 24, 27, 0.9)",
              borderRadius: "1rem",
              padding: "1.25rem",
              width: "320px",
              color: "#fff",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "all 0.4s ease",
              opacity: showPromoCard ? 1 : 0,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: 600,
                }}
              >
                <FlameIcon />
                Boosts Left: <strong>{dailyPromosLeft}</strong> / 4
              </div>
              <button
                onClick={() => setShowPromoCard(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                Hide
              </button>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                height: "8px",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: `${(dailyPromosLeft / 4) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #FF6B6B, #FFB347)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {/* Cooldown */}
            {userCooldown && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  background: "rgba(255,255,255,0.05)",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                }}
              >
                <ClockIcon />
                <div>
                  <span style={{ opacity: 0.8 }}>Next boost in:</span>
                  <div style={{ fontWeight: "bold", marginTop: "0.1rem" }}>
                    {`${userCooldown.hours
                      .toString()
                      .padStart(2, "0")}:${userCooldown.minutes
                      .toString()
                      .padStart(2, "0")}:${userCooldown.seconds
                      .toString()
                      .padStart(2, "0")}`}
                  </div>
                </div>
              </div>
            )}

            <p
              style={{
                fontSize: "0.85rem",
                color: "rgb(249, 249, 249)",
                marginTop: "0.25rem",
                textAlign: "center",
              }}
            >
              Promote your favourite community using boosts to increase its
              visibility.
            </p>

            <p
              style={{
                fontSize: "0.75rem",
                color: "rgba(249, 249, 249, 0.83)",
                marginBottom: "0",
                marginTop: "-1rem",
                textAlign: "center",
              }}
            >
              Boosts reset daily at midnight
            </p>
          </div>

          {/* Mini floating icon button */}
          {!showPromoCard && (
            <button
              onClick={() => setShowPromoCard(true)}
              style={{
                position: "fixed",
                bottom: "1.5rem",
                right: "1.5rem",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(24, 24, 27, 0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 9999,
              }}
            >
              <FlameIcon />
              <div
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "#FF6B6B",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(24,24,27,0.9)",
                }}
              >
                {dailyPromosLeft}
              </div>
            </button>
          )}

          {/* Tab at bottom right edge */}
          {!showPromoCard && (
            <div
              onClick={() => setShowPromoCard(true)}
              style={{
                position: "fixed",
                bottom: 0,
                right: "1.5rem",
                background: "rgba(24, 24, 27, 0.9)",
                color: "#fff",
                padding: "0.3rem 1rem",
                borderTopLeftRadius: "10px",
                borderTopRightRadius: "10px",
                fontSize: "0.9rem",
                cursor: "pointer",
                zIndex: 10001,
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
          <h1 style={{ fontSize: isMobile ? "2.6rem" : "3rem" }}>
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
                {community.promote_count || 0}
              </span>
              Promotions
            </div>

            <button
              className={`promote-button ${
                isPromoted ? "promote-button-promoted" : ""
              } ${buttonShaking ? "button-shake" : ""}`}
              style={{
                padding: "0.5rem 1rem",
                background: isPromoted ? "#333" : "white",
                border: isPromoted ? "1px solid rgba(180, 180, 180, 0.6)" : "none",
                borderRadius: "999px",
                cursor: "pointer",
                fontSize: "1.15rem",
                fontWeight: "500",
                width: isMobile
                  ? isPromoted
                    ? "120px"
                    : "110px"
                  : isPromoted
                  ? "140px"
                  : "120px",
                height: isMobile ? (isPromoted ? "45px" : "50px") : "50px",
                color: isPromoted ? "white" : "black",
                boxShadow: isPromoted
                  ? "0 0 8px rgba(120, 255, 150, 0.4)"
                  : "0px 2px 4px rgba(0, 0, 0, 0.1)",
                position: "relative",
                transition:
                  "all 0.3s ease, width 0.4s ease-in-out, background-color 0.3s, color 0.3s, box-shadow 0.4s",
                overflow: "hidden",
                marginBottom: isPromoted ? "20px" : "0px",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePromote(Number(id));
              }}
              disabled={disableButton && !isPromoted ? true : false}
            >
              {isPromoted ? (
                <>
                  <span
                    className="promoted-text"
                    style={{
                      position: "relative",
                      zIndex: 2,
                      textShadow: "0 0 5px rgba(120, 255, 150, 0.4)",
                    }}
                  >
                    Promoted
                  </span>
                  <div
                    className="promote-button-glow-effect"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "50%",
                      height: "100%",
                      background:
                        "linear-gradient(90deg, transparent, rgba(120, 255, 150, 0.2), transparent)",
                      animation: "promote-button-shine 3s infinite",
                      zIndex: 1,
                    }}
                  ></div>
                </>
              ) : (
                "Promote"
              )}
            </button>

            {/* Timer that appears when promoted */}
            {isPromoted && (
              <div
                className="promote-timer-badge"
                style={{
                  position: "absolute",
                  bottom: "-5px",
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
              fontSize: "1rem",
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
                if (copyText) copyText.innerText = "Copied";
                if (copyIcon) (copyIcon as HTMLElement).style.display = "none";
                if (checkIcon) (checkIcon as HTMLElement).style.display = "inline";
                setTimeout(() => {
                  if (copyText) copyText.innerText = "Copy";
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

      {/* CSS animations */}
      <style jsx>{`
        @keyframes promote-button-shine {
          0% {
            left: -100%;
          }
          20% {
            left: 150%;
          }
          100% {
            left: 150%;
          }
        }

        @keyframes promote-button-pulse {
          0% {
            box-shadow: 0 0 8px rgba(120, 255, 150, 0.4);
          }
          50% {
            box-shadow: 0 0 15px rgba(120, 255, 150, 0.7);
          }
          100% {
            box-shadow: 0 0 8px rgba(120, 255, 150, 0.4);
          }
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
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-8px);
          }
          40% {
            transform: translateX(8px);
          }
          60% {
            transform: translateX(-5px);
          }
          80% {
            transform: translateX(5px);
          }
          100% {
            transform: translateX(0);
          }
        }

        .promote-button-promoted {
          animation: promote-button-pulse 2.5s infinite ease-in-out;
        }

        .button-shake {
          animation: button-shake 0.5s ease-in-out;
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
