"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "@/app/communityPage.css";
import { useAuth } from "@/app/hooks/AuthContext";
import { getAuth } from "firebase/auth";

export default function CommunityDetails() {
  const { id } = useParams();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showPromoCard, setShowPromoCard] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [buttonShaking, setButtonShaking] = useState(false);
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: "", visible: false });
  
  // State for user promotion info: last promotion time and how many boosts used today.
  const [userPromoInfo, setUserPromoInfo] = useState<{
    userLastPromotion: string | null;
    dailyPromotionCount: number;
  }>({ userLastPromotion: null, dailyPromotionCount: 0 });

  // State for community promotions info: a mapping from community id to its last promotion time.
  const [communityPromotions, setCommunityPromotions] = useState<{ [key: number]: string }>({});
  const buttonTop = 0;  // Change this value to move button up/down
  const buttonRight = 0; // Change this value to move button left/right

  // Update "now" every second so countdowns refresh in real time.
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
        data.promotions.forEach((promo: { community_id: number; promoted_at: string }) => {
          promoMap[promo.community_id] = promo.promoted_at;
        });
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

  // Show toast notification
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Handle button shake animation
  const shakeButton = () => {
    setButtonShaking(true);
    setTimeout(() => {
      setButtonShaking(false);
    }, 500);
  };

  // Handle promote button clicks.
  const handlePromote = async (community_id: number) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        shakeButton();
        showToast("Please log in to boost communities");
        return;
      }

      // Check if user is on cooldown
      if (userPromoInfo.userLastPromotion) {
        const userCooldown = getCountdown(userPromoInfo.userLastPromotion, 6 * 60 * 60 * 1000);
        if (userCooldown) {
          shakeButton();
          showToast(`Wait ${userCooldown.hours}h ${userCooldown.minutes}m before promoting again`);
          return;
        }
      }

      // Check daily limit
      if (userPromoInfo.dailyPromotionCount >= 4) {
        shakeButton();
        showToast("You've used all 4 daily boosts");
        return;
      }

      // Check community cooldown
      if (communityPromotions[Number(id)]) {
        const communityCooldown = getCountdown(communityPromotions[Number(id)], 24 * 60 * 60 * 1000);
        if (communityCooldown) {
          shakeButton();
          showToast("This community was already boosted in the last 24h");
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
        showToast(data.error || "Failed to boost community");
        return;
      }

      // on success, update your UI state without any alert
      const nowISO = new Date().toISOString();
      setCommunityPromotions((prev) => ({ ...prev, [community_id]: nowISO }));
      setUserPromoInfo((prev) => ({
        userLastPromotion: nowISO,
        dailyPromotionCount: prev.dailyPromotionCount + 1,
      }));
      
      showToast("Community Promoted! ");

    } catch (err) {
      console.error("Unexpected error promoting:", err);
      shakeButton();
      showToast("Something went wrong. Please try again later.");
    }
  };

  useEffect(() => {
    const fetchCommunity = async () => {
      const res = await fetch(`/api/communities/${id}`);
      const data = await res.json();
      setCommunity(data);
      setLoading(false);
    };
    fetchCommunity();
  }, [id]);

  // Components for the status UI
  const FlameIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 4 8 8 16C10.5 20 12 22 12 22C12 22 13.5 20 16 16C20 8 12 2 12 2Z" />
      <path d="M12 11a1 1 0 0 1-1 1 1 1 0 0 0 0 2 3 3 0 0 0 3-3 3 3 0 0 0-1-2.24" />
    </svg>
  );
  
  const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  // Calculate the user's 6‑hour cooldown and the number of promotions left today.
  const userCooldown = userPromoInfo.userLastPromotion
    ? getCountdown(userPromoInfo.userLastPromotion, 6 * 60 * 60 * 1000)
    : null;
  const dailyPromosLeft = 4 - (userPromoInfo.dailyPromotionCount || 0);

  if (loading) return <div className="community-page">Loading...</div>;
  if (!community) return <div className="community-page">Community not found.</div>;

  // Get community cooldown status from the promotions object  
  const communityCooldown = communityPromotions[Number(id)]
    ? getCountdown(communityPromotions[Number(id)], 24 * 60 * 60 * 1000)
    : null;
  
  // Disable the Promote button if either:
  // • The community is still on a 24‑hour cooldown, or
  // • The user is on the 6‑hour cooldown
  const isPromoted = communityCooldown !== null;
  const disableButton =
    isPromoted ||
    (userPromoInfo.userLastPromotion
      ? getCountdown(userPromoInfo.userLastPromotion, 6 * 60 * 60 * 1000) !== null
      : false);
  
  // Format countdown timer for tooltip
  const formattedCountdown = communityCooldown ? 
    `${communityCooldown.hours.toString().padStart(2, "0")}:${communityCooldown.minutes.toString().padStart(2, "0")}:${communityCooldown.seconds.toString().padStart(2, "0")}` : 
    "";

  return (
    <div className="community-page">
      {/* Toast notification */}
      {toast.visible && (
        <div className="toast-notification" style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(30, 30, 30, 0.9)",
          color: "white",
          padding: "12px 20px",
          borderRadius: "8px",
          zIndex: 10000,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          animation: "toast-fade-in 0.3s ease-out forwards",
          maxWidth: "90%",
          textAlign: "center",
          fontSize: "0.95rem"
        }}>
          {toast.message}
        </div>
      )}

      {/* Floating Promo Status Card - for logged in users only */}
      {user && (
        <div
          style={{
            position: "fixed",
            bottom: showPromoCard ? "1.5rem" : "-5rem",
            right: "1.5rem",
            zIndex: 9999,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            background: "rgba(30,30,30,0.85)",
            borderRadius: "16px",
            padding: "1.2rem 1.5rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            color: "white",
            transition: "all 0.5s ease",
            opacity: showPromoCard ? 1 : 0,
            maxWidth: "90vw",
            width: "320px",
            fontSize: "0.95rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
            <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <FlameIcon /> 
              <span>Boosts Left: <strong>{dailyPromosLeft}</strong> / 4</span>
            </span>
            <button
              onClick={() => setShowPromoCard(false)}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "#eee",
                fontSize: "0.8rem",
                cursor: "pointer",
                padding: "0.3rem 0.6rem",
                borderRadius: "8px",
                transition: "all 0.2s ease",
              }}
            >
              Hide
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ 
            width: "100%", 
            height: "6px", 
            background: "rgba(255, 255, 255, 0.1)", 
            borderRadius: "3px",
            marginBottom: "0.8rem",
          }}>
            <div style={{ 
              width: `${(dailyPromosLeft / 4) * 100}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #FF6B6B, #FFB347)",
              borderRadius: "3px",
            }} />
          </div>

          {userCooldown && (
            <div style={{ 
              marginTop: "0.5rem", 
              display: "flex", 
              alignItems: "center", 
              gap: "0.6rem",
              background: "rgba(0, 0, 0, 0.2)",
              padding: "0.6rem 0.8rem",
              borderRadius: "10px"
            }}>
              <ClockIcon />
              <div>
                <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>Next boost in:</span>
                <span style={{ fontWeight: "bold", display: "block" }}>
                  {`${userCooldown.hours.toString().padStart(2, "0")}:${userCooldown.minutes
                    .toString()
                    .padStart(2, "0")}:${userCooldown.seconds.toString().padStart(2, "0")}`}
                </span>
              </div>
            </div>
          )}

          <p style={{ 
            fontSize: "0.8rem", 
            color: "#bbb", 
            marginTop: "0.8rem",
          }}>
            Boosts reset daily at midnight.
          </p>
        </div>
      )}

      {/* Minimized indicator - shows when card is hidden */}
      {user && !showPromoCard && (
        <button
          onClick={() => setShowPromoCard(true)}
          style={{
            position: "fixed",
            bottom: "40px",
            right: "1.5rem",
            zIndex: 9998,
            background: "rgba(30,30,30,0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "50%",
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            cursor: "pointer",
          }}
        >
          <FlameIcon />
          <div style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            background: "#FF6B6B",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: "bold",
            border: "2px solid rgba(30,30,30,0.85)",
          }}>
            {dailyPromosLeft}
          </div>
        </button>
      )}

      {/* Peeking Tab to Unhide Card */}
      {user && !showPromoCard && (
        <div
          onClick={() => setShowPromoCard(true)}
          style={{
            position: "fixed",
            bottom: "0",
            right: "1rem",
            zIndex: 10000,
            background: "rgba(30,30,30,0.85)",
            color: "white",
            padding: "0.3rem 1rem",
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px",
            fontSize: "1.3rem",
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        >
          Show Boosts
        </div>
      )}

      <div className="image-banner">
        <img src={community.image_url} alt={community.name} />
      </div>
      
      <div className="community-info">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1>{community.name}</h1>
          
          {/* Promote button - visible to all users */}
          <div className="promote-button-container" style={{ position: "relative" }}>
            <button
              className={`promote-button ${isPromoted ? 'promote-button-promoted' : ''} ${buttonShaking ? 'button-shake' : ''}`}
              style={{
                padding: "0.5rem 1rem",
                background: isPromoted ? "#333" : "white",
                border: isPromoted ? "1px solid rgba(180, 180, 180, 0.6)" : "none",
                borderRadius: "999px",
                cursor: "pointer", // Always show pointer cursor
                fontSize: "1.15rem",
                fontWeight: "500",
                width: isPromoted ? "140px" : "120px",
                height: isPromoted ? "50px" : "50px",
                textAlign: "center",
                color: isPromoted ? "white" : "black",
                boxShadow: isPromoted 
                  ? "0 0 8px rgba(120, 255, 150, 0.4)" 
                  : "0px 2px 4px rgba(0, 0, 0, 0.1)",
                position: "relative",
                transition: "all 0.3s ease, width 0.4s ease-in-out, background-color 0.3s, color 0.3s, box-shadow 0.4s",
                overflow: "hidden",
                marginBottom: isPromoted ? "20px" : "0px"
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePromote(Number(id));
              }}
              title={isPromoted ? `Cooldown: ${formattedCountdown}` : !user ? "Login to boost" : "Promote this community"}
            >
              {isPromoted ? (
                <>
                  <span className="promoted-text" style={{
                    position: "relative",
                    zIndex: 2,
                    textShadow: "0 0 5px rgba(120, 255, 150, 0.4)"
                  }}>
                    Promoted
                  </span>
                  <div className="promote-button-glow-effect" style={{
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "50%",
                    height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(120, 255, 150, 0.2), transparent)",
                    animation: "promote-button-shine 3s infinite",
                    zIndex: 1
                  }}></div>
                </>
              ) : (
                "Promote"
              )}
            </button>
            
            {/* Timer that appears when promoted */}
            {isPromoted && (
              <div className="promote-timer-badge" style={{
                position: "absolute",
                bottom: "-5px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "0.7rem",
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
                animation: "promote-timer-popIn 0.3s forwards"
              }}>
                {formattedCountdown}
              </div>
            )}
          </div>
        </div>
        
        <div className="tags">
          {community.tags.map((tag: string, index: number) => (
            <span className="tag" key={index}>{tag}</span>
          ))}
        </div>
        
        <p className="long-description">{community.long_description || community.description}</p>
        
        <Link href={community.invite_link || "#"} target="_blank" className="join-button">
          Join
        </Link>
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
          0% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
        
        @keyframes toast-fade-in {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
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