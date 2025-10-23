"use client";

import { useState, useEffect, useRef, useLayoutEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, X } from "lucide-react";
import { useCommunities } from "./hooks/usecommunities";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "./hooks/AuthContext";
import Footer from "@/app/components/footer";
import { getAuth } from "firebase/auth";
import "./community.css";
import "./all.css";
import "./tag.css";
import "./logup.css";
import ReactDOM from "react-dom";

// Define a type for cuisine strings
type Cuisine = string;

// Define toast types
type ToastType = 'success' | 'error' | 'info' | 'warning';

// Define toast message structure
interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

const cuisines: Cuisine[] = [
  "Crypto","Memes","Fitness","Hangout","Gaming","Education","Football","Politics","Tech","Sports","Celebrities","AI","Finance","Art","Dating","Anime","NSFW", "Music","Social","Lifestyle",
];

function CommunityPageContentInner() {
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  
  // Get initial search parameters from URL
  const initialSearchTerm = searchParamsObj.get("q") || "";
  const initialTags = searchParamsObj.get("tags")?.split(",").filter(tag => tag !== "") || [];
  const initialPage = parseInt(searchParamsObj.get("page") || "1");
  
  // State to track input value separately from API query
  const [searchInputValue, setSearchInputValue] = useState(initialSearchTerm);
  const [selectedCuisines, setSelectedCuisines] = useState<Cuisine[]>(initialTags);

  // Use the custom hook with the initial parameters
  const { 
    communities, 
    loading, 
    error, 
    totalPages, 
    currentPage, 
    updateSearchParams 
  } = useCommunities({
    q: initialSearchTerm,
    tags: initialTags,
    page: initialPage
  });

  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  // State to control visibility of the promo card
  const [showPromoCard, setShowPromoCard] = useState(true);
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
    

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdCounter = useRef(0);

  // State for button shake animation
  const [shakingButtons, setShakingButtons] = useState<{[key: number]: boolean}>({});

  // Function to add a toast notification
  const addToast = (type: ToastType, message: string) => {
    const id = toastIdCounter.current++;
    setToasts(prev => [...prev, { id, type, message }]);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // Function to shake a button
  const shakeButton = (communityId: number) => {
    setShakingButtons(prev => ({ ...prev, [communityId]: true }));
    
    // Stop shaking after animation completes
    setTimeout(() => {
      setShakingButtons(prev => ({ ...prev, [communityId]: false }));
    }, 500);
  };

  

  // State for user promotion info: last promotion time and how many boosts used today.
  const [userPromoInfo, setUserPromoInfo] = useState<{
    userLastPromotion: string | null;
    canBoostNow: boolean;
    secondsRemaining: number;    // 0 means ready
    nextEligibleAt: string | null;
  }>({
    userLastPromotion: null,
    canBoostNow: true,
    secondsRemaining: 0,
    nextEligibleAt: null,
  });

  // State for community promotions
  const [communityPromotions, setCommunityPromotions] = useState<{ [key: number]: string }>({});
  const buttonTop = 0;  // Change this value to move button up/down
  const buttonRight = 0; // Change this value to move button left/right
  
  // A state to store the current time (to update our timers every second)
  const [now, setNow] = useState(Date.now());

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

        // derive nextEligibleAt if API didn't send it
        const last = data.userLastPromotion ? new Date(data.userLastPromotion).getTime() : null;
        const derivedNextEligibleAtMs = last ? last + PERSONAL_COOLDOWN_MS : null;
        
        const nowMs = Date.now();
        const nextMs = (data.nextEligibleAt ? new Date(data.nextEligibleAt).getTime() : derivedNextEligibleAtMs);
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

  // Handle promote button clicks.
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  // ===== Shadow DOM setup for modal isolation =====
  const modalHostRef = useRef<HTMLDivElement | null>(null);
  const [shadowRootEl, setShadowRootEl] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    if (!showSignupPrompt) return;
    const host = modalHostRef.current;
    if (!host) return;

    const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    setShadowRootEl(root);

    // Small reset + local keyframes
    if (!root.getElementById("modal-reset")) {
      const style = document.createElement("style");
      style.id = "modal-reset";
      style.textContent = `
        *,*::before,*::after{box-sizing:border-box;}
        :host,html,body{margin:0;padding:0;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{0%{transform:scale(0.98)}100%{transform:scale(1)}}
      `;
      root.appendChild(style);
    }
  }, [showSignupPrompt]);
  const handlePromote = async (community_id: number) => {
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        shakeButton(community_id);
        addToast("error", "Create an account to promote communities");
        setTimeout(() => setShowSignupPrompt(true), 600);
        return;
      }
  
      // ✅ FIXED: Calculate eligibility in real-time using current timestamp
      const canBoostNow = userPromoInfo.nextEligibleAt 
        ? now >= new Date(userPromoInfo.nextEligibleAt).getTime()
        : true;
  
      const secondsRemaining = userPromoInfo.nextEligibleAt
        ? Math.max(0, Math.floor((new Date(userPromoInfo.nextEligibleAt).getTime() - now) / 1000))
        : 0;
  
      // Check for user cooldown with live calculation
      if (!canBoostNow || secondsRemaining > 0) {
        const h = Math.floor(secondsRemaining / 3600);
        const m = Math.floor((secondsRemaining % 3600) / 60);
        addToast('warning', `Wait ${h}h ${m}m before promoting again`);
        shakeButton(community_id);
        return;
      }
  
      // Check if community is on cooldown
      const currentCommunity = communities.find(c => c.id === community_id);
      const tier = currentCommunity?.tier || "normal";
  
      // UPDATED: Community cooldown mapping -> normal: 4h, silver: 2h, gold: 1h
      let cooldownMs = 4 * 60 * 60 * 1000;
      if (tier === "silver") cooldownMs = 2 * 60 * 60 * 1000;
      if (tier === "gold") cooldownMs = 1 * 60 * 60 * 1000;
  
      if (communityPromotions[community_id]) {
        const communityCooldown = getCountdown(communityPromotions[community_id], cooldownMs);
        if (communityCooldown) {
          addToast('info', `This community was already promoted. Wait ${communityCooldown.hours}h ${communityCooldown.minutes}m`);
          shakeButton(community_id);
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
        // If backend sent structured cooldown info
        if (res.status === 429 && data?.reason === "user_personal_cooldown") {
          setUserPromoInfo((prev) => ({
            ...prev,
            canBoostNow: false,
            secondsRemaining: typeof data.secondsRemaining === "number" ? data.secondsRemaining : prev.secondsRemaining,
            nextEligibleAt: data.nextEligibleAt ?? prev.nextEligibleAt,
          }));
          const s = data.secondsRemaining ?? 0;
          const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
          addToast('warning', `Wait ${h}h ${m}m before promoting again`);
          shakeButton(community_id);
          return;
        }
        if (res.status === 429 && data?.reason === "community_cooldown") {
          const s = data.secondsRemaining ?? 0;
          const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
          addToast('info', `This community was already promoted. Wait ${h}h ${m}m`);
          shakeButton(community_id);
          return;
        }
        console.error("Promotion error:", data?.error);
        addToast('error', data?.error || 'Failed to promote community');
        shakeButton(community_id);
        return;
      }
  
      // on success, update your UI state
      const nowISO = new Date().toISOString();
      setCommunityPromotions((prev) => ({ ...prev, [community_id]: nowISO }));
      setUserPromoInfo((prev) => ({
        ...prev,
        userLastPromotion: nowISO,
        canBoostNow: false,
        secondsRemaining: 60 * 60, // 1 hour
        nextEligibleAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }));
  
      addToast('success', 'Community successfully promoted!');
  
    } catch (err) {
      console.error("Unexpected error promoting:", err);
      addToast('error', 'An unexpected error occurred');
      shakeButton(community_id);
    }
  };
  // A useLayoutEffect to force a one-time page refresh on the first load.
  useLayoutEffect(() => {
    const key = "refreshed-login-page";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "true");
      window.location.replace(window.location.href);
    }
    return () => sessionStorage.removeItem(key);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Manage header visibility based on scroll.
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollTop = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset;
      if (currentScrollTop < lastScrollTop.current && currentScrollTop > 0) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollTop.current = currentScrollTop;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update URL when search, tags, or page changes
  const updateUrlWithParams = (params: { 
    q?: string; 
    tags?: string[]; 
    page?: number;
  }) => {
    const newSearchParams = new URLSearchParams(searchParamsObj.toString());
    
    if (params.q !== undefined) {
      if (params.q) newSearchParams.set('q', params.q);
      else newSearchParams.delete('q');
    }
    if (params.tags !== undefined) {
      if (params.tags.length > 0) newSearchParams.set('tags', params.tags.join(','));
      else newSearchParams.delete('tags');
    }
    if (params.page !== undefined) {
      if (params.page > 1) newSearchParams.set('page', params.page.toString());
      else newSearchParams.delete('page');
    }
    
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    router.push(newUrl);
    
    updateSearchParams({
      q: params.q !== undefined ? params.q : searchParamsObj.get("q") || "",
      tags: params.tags !== undefined ? params.tags : 
        (searchParamsObj.get("tags")?.split(",").filter(tag => tag !== "") || []),
      page: params.page !== undefined ? params.page : parseInt(searchParamsObj.get("page") || "1")
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      updateUrlWithParams({ q: searchInputValue, page: 1 });
    }
  };

  const toggleCuisine = (cuisine: Cuisine) => {
    let newSelectedCuisines: string[];
    
    if (selectedCuisines.includes(cuisine)) {
      newSelectedCuisines = selectedCuisines.filter(c => c !== cuisine);
    } else {
      newSelectedCuisines = [...selectedCuisines, cuisine];
    }
    
    setSelectedCuisines(newSelectedCuisines);
    updateUrlWithParams({ tags: newSelectedCuisines, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlWithParams({ page: newPage });
  };

  const handlePostCommunity = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/signup?redirect=/dashboard");
    }
  };

  if (!mounted) {
    return null;
  }

  // Calculate the user's 6-hour cooldown and the number of promotions left today.
// Build a countdown from secondsRemaining so the UI ticks every second
// Derive remaining seconds live from nextEligibleAt (survives refresh)
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


  

  const isMobile = window.innerWidth <= 768;
  const isDesktop = window.innerWidth > 1200;

  // top of file, under other consts
const PERSONAL_COOLDOWN_MS = 60 * 60 * 1000; // 1h (use 6 * 60 * 60 * 1000 if it's 6h)
  
  // ---------- Skeleton Card (loading placeholder, no spinner) ----------
  const SkeletonCard = () => (
    <div className="server-card skeleton-card" aria-hidden="true">
      <div className="image-container">
        <div className="skeleton skeleton-image" />
      </div>

      <div className="card-content" style={{ paddingTop: 0 }}>
        <div className="skeleton skeleton-line title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />

        <div className="tags" style={{ paddingTop: 8 }}>
          <span className="skeleton skeleton-pill" />
          <span className="skeleton skeleton-pill" />
          <span className="skeleton skeleton-pill long" />
        </div>

        <a className="join-link skeleton skeleton-button" />
      </div>
    </div>
  );
  
  return (
    <div
      className="community-page"
      style={{  
        position: "relative",
        width: "100%",
        margin: 0,
        padding: 0,
        minHeight: "100vh",            // ✨ fill the viewport height
        display: "flex",               // ✨ flex column layout
        flexDirection: "column",
      }}
    >

      {/* Toast Container */}
      <div style={{
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
        alignItems: "center"
      }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backdropFilter: "blur(8px)",
                whiteSpace: "nowrap",
                WebkitBackdropFilter: "blur(8px)",
                background: toast.type === 'success' ? "rgba(34, 197, 94, 0.9)" : 
                          toast.type === 'error' ? "rgba(239, 68, 68, 0.9)" :
                          toast.type === 'warning' ? "rgba(245, 158, 11, 0.9)" : 
                          "rgba(59, 130, 246, 0.9)",
                color: "white",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.9rem",
                fontWeight: "500",
                width: "100%"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem",flex: 1,
minWidth: 0,
whiteSpace: "nowrap",
overflow: "hidden",
textOverflow: "ellipsis",
 }}>
                {toast.type === 'success' && <Check size={18} />}
                {toast.type === 'error' && <AlertCircle size={18} />}
                {toast.type === 'warning' && <AlertCircle size={18} />}
                {toast.type === 'info' && <Check size={18} />}
                {toast.message}
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "white" }}
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>

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

      {/* Shadow DOM host for the isolated signup modal */}
      <div ref={modalHostRef} />

      {/* Isolated Signup Prompt Modal (Shadow DOM) */}
      {showSignupPrompt && shadowRootEl && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 100000,
            }}
            onClick={() => setShowSignupPrompt(false)}
          />
          {/* Modal wrapper */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 100001,
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                borderRadius: 16,
                background: "rgba(10,10,10,0.95)",
                border: "1px solid rgba(120,120,120,0.2)",
                color: "#e5e7eb",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                padding: 24,
                fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                animation: "scaleIn 0.3s ease-out",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(120,120,120,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 8,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>

                <div style={{ textAlign: "center" }}>
                  <h2 style={{ color: "white", fontSize: 22, fontWeight: 600, margin: 0 }}>Sign up to continue</h2>
                  <p style={{ color: "#9CA3AF", fontSize: 14, margin: "6px 0 0" }}>
                    Create an account to promote and post communities.
                  </p>
                </div>

                <div style={{ width: "100%", marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    onClick={() => router.push(`/signup?redirect=/`)}
                    style={{
                      width: "100%",
                      background: "white",
                      color: "black",
                      fontWeight: 600,
                      padding: "12px",
                      borderRadius: 12,
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
                      borderRadius: 12,
                      border: "1px solid rgba(120,120,120,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        shadowRootEl
      )}

{user && (
  <>
    {/* Floating Promo Card */}
    {(() => {
      const totalSeconds = Math.floor(PERSONAL_COOLDOWN_MS / 1000);
      const progress = userCooldown
        ? Math.min(1, Math.max(0, (totalSeconds - secondsLeft) / totalSeconds))
        : 1;

      return (
        <div
          style={{
            position: "fixed",
            bottom: showPromoCard ? "1.5rem" : "-6rem",
            right: "1.5rem",
            zIndex: 10000,
            backdropFilter: "blur(12px)",
            background: "rgba(18,18,20,0.9)",
            borderRadius: "16px",
            padding: "14px",
            width: "320px",
            color: "#fff",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            transition: "all 0.4s ease",
            opacity: showPromoCard ? 1 : 0,
            fontFamily: "Inter, ui-sans-serif, system-ui",
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

            {/* Ready pill */}
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
                  transition: "width 0.9s linear", // smooth tick every second
                }}
              />
              {/* Animated sheen while cooling down */}
              {userCooldown && (
                <div className="cooldown-sheen" />
              )}
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

          {/* Copy */}
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
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(18,18,20,0.92)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 6px 22px rgba(0, 0, 0, 0.35)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          zIndex: 9999,
        }}
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
          right: "1.5rem",
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
        }}
      >
        Show Boosts
      </div>
    )}

    {/* Local styles for sheen animation */}
    <style jsx>{`
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
    `}</style>
  </>
)}


      {/* Navigation Container */}
      <div
        className="nav-container"
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {!user ? (
          <>
            <Link href="/signup">
              <button className="signabutton">
                <span>Sign Up</span>
              </button>
            </Link>
            <Link href="/login">
              <button className="logabutton">
                <span>Login</span>
              </button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/dashboard">
              <button className="logabuttonD" style={{ zIndex: 10 }}>
                <span>Dashboard</span>
              </button>
            </Link>
            <button onClick={logout} className="logoutbuttonD" style={{ zIndex: 10 }}>
              <span>Logout</span>
            </button>
          </>
        )}
      </div>

      {/* Main Content */}
      <div style={{ paddingTop: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          className="x-header"
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "3rem", fontWeight: "bold" }}>Discover </span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{
              width: "3rem",
              height: "3rem",
              margin: "0 0.5rem",
              fill: "currentColor",
            }}
          >
            <g>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
            </g>
          </svg>
          <span style={{ fontSize: "3rem", fontWeight: "bold" }}> Communities</span>
        </div>

        {/* Search Input */}
        <div className="input-group">
          <input
            required
            type="text"
            name="search"
            autoComplete="off"
            className="input"
            placeholder=" "
            id="search-input"
            value={searchInputValue}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
          <label htmlFor="search-input" className="user-label">
            Search by tag or name
          </label>
        </div>

        {/* Cuisine (Tag) Selector */}
        <div className="cuisine-container">
          <div className="cuisine-grid">
            {cuisines.map((cuisine) => {
              const isSelected = selectedCuisines.includes(cuisine);
              return (
                <motion.button
                  key={cuisine}
                  onClick={() => toggleCuisine(cuisine)}
                  layout
                  initial={false}
                  animate={{
                    backgroundColor: isSelected ? "#2a1711" : "rgba(39, 39, 42, 0.5)",
                  }}
                  whileHover={{
                    backgroundColor: isSelected ? "#2a1711" : "rgba(39, 39, 42, 0.8)",
                  }}
                  whileTap={{
                    backgroundColor: isSelected ? "#1f1209" : "rgba(39, 39, 42, 0.9)",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5,
                  }}
                  className={`cuisine-chip ${
                    isSelected ? "cuisine-chip-selected" : "cuisine-chip-unselected"
                  }`}
                >
                  <motion.div
                    className="cuisine-chip-content"
                    animate={{
                      width: isSelected ? "auto" : "100%",
                      paddingRight: isSelected ? "1.5rem" : "0",
                    }}
                  >
                    <span>{cuisine}</span>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            mass: 0.5,
                          }}
                          className="cuisine-check-icon"
                        >
                          <div className="cuisine-check-circle">
                            <Check className="cuisine-check-svg" />
                          </div>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Community Server List */}
        <div className="server-list" >
          {loading ? (
            // ---------- Skeleton Grid while loading ----------
            <>
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={`skeleton-${i}`} />
              ))}
            </>
          ) : error ? (
            <p>Error: {error}</p>
          ) : communities.length === 0 ? (
            <div className="error-content" style={{ display: 'flex', justifyContent: 'center',  width: isMobile ? '100%' : isDesktop ? '320%' : '200%' 
            }}>
              <h3 style={{ textAlign: 'center' }}>No results found.</h3>
            </div>
          ) : (
            communities.map((server) => {
              // Cooldown by tier
              // UPDATED: Community cooldown mapping -> normal: 4h, silver: 2h, gold: 1h
              let cooldownMs = 4 * 60 * 60 * 1000;
              if (server.tier === "silver") cooldownMs = 2 * 60 * 60 * 1000;
              if (server.tier === "gold") cooldownMs = 1 * 60 * 60 * 1000;

              const communityCooldown = communityPromotions[server.id]
                ? getCountdown(communityPromotions[server.id], cooldownMs)
                : null;	
              const isPromoted = communityCooldown !== null;
              const formattedCountdown = communityCooldown ? 
                `${communityCooldown.hours.toString().padStart(2, "0")}:${communityCooldown.minutes.toString().padStart(2, "0")}:${communityCooldown.seconds.toString().padStart(2, "0")}` : 
                "";
              const isShaking = shakingButtons[server.id] || false;

              return (
                <div
                  key={server.id}
                  className={`server-card ${server.tier === 'silver' ? 'silver-tier' : server.tier === 'gold' ? 'gold-tier' : 'normal-tier'}`}
                  onClick={() => router.push(`/community/${server.id}`)}
                  style={{ position: "relative", display: "flex", flexDirection: "column", cursor: "pointer"  }}
                >
                  <div
                    className="card-bg-blur"
                    style={{ backgroundImage: `url(${server.image_url})` }}
                  ></div>
                  <div className="image-container">
                    <img
                      src={server.image_url}
                      alt={server.name}
                      className="community-image fade-bottom"
                    />
                    <div className="image-gradient"></div>
                  </div>
                  
                  {/* Container for title with promote button */}
                  <div style={{ position: "relative", paddingRight: "110px", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, wordWrap: "break-word" }}>{server.name}</h3>
                    
                    {/* Boost Button */}
                    <div
                      style={{
                        position: "absolute",
                        top: buttonTop,
                        right: buttonRight,
                      }}
                    >
                      <div className="promote-button-container" style={{ position: "relative" }}>
                        <button
                          className={`promote-button ${isShaking ? 'button-shake' : ''} ${isPromoted ? 'promote-button-promoted' : ''}`}
                          style={{
                            marginTop: isPromoted ? "0.6rem" : "1rem",
                            marginRight: ".8rem",
                            padding: "0.5rem 1rem",
                            background: isPromoted ? "#333" : "white",
                            border: isPromoted ? "1px solid rgba(180, 180, 180, 0.6)" : "none",
                            borderRadius: "999px",
                            cursor: "pointer",
                            fontSize: "1rem",
                            fontWeight: "500",
                            width: isPromoted ? "120px" : "100px",
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
                            handlePromote(server.id);
                          }}
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
                            bottom: "5px",
                            left: "45%",
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
                  </div>

                  <p>{server.description}</p>
                  <div className="tags">
                    {server.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="tag"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectedCuisines.includes(tag)) {
                            const newTags = [...selectedCuisines, tag];
                            setSelectedCuisines(newTags);
                            updateUrlWithParams({ tags: newTags, page: 1 });
                          }
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Centered Join Button Container */}
                  <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 -5px" }}>
                    <a
                      href={server.invite_link || server.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="join-link"
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        textDecoration: "none",
                        display: "block",
                        textAlign: "center",
                        padding: "12px",
                        width: "100%",
                        maxWidth: "90%",
                        borderRadius: "999px",
                        background: "white",
                        color: "black",
                        fontWeight: "500"
                      }}
                    >
                      Join
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Scoped animations */}
        <style jsx>{`
          @keyframes promote-button-shine {
            0% { left: -100%; }
            20% { left: 150%; }
            100% { left: 150%; }
          }
          @keyframes promote-button-pulse {
            0% { box-shadow: 0 0 4px rgba(120, 255, 150, 0.4); }
            50% { box-shadow: 0 0 8px rgba(120, 255, 150, 0.7); }
            100% { box-shadow: 0 0 4px rgba(120, 255, 150, 0.4); }
          }
          @keyframes promote-timer-popIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); }
            70% { transform: translateX(-50%) translateY(-2px) scale(1.05); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          @keyframes button-shake {
            0% { transform: translateX(0); }
            20% { transform: translateX(-5px); }
            40% { transform: translateX(5px); }
            60% { transform: translateX(-2px); }
            80% { transform: translateX(2px); }
            100% { transform: translateX(0); }
          }
          .button-shake { animation: button-shake 0.5s ease-in-out; }
          .promote-button-promoted { animation: promote-button-pulse 2.5s infinite ease-in-out; }
          .promote-button-container { display: flex; flex-direction: column; align-items: center; }
        `}</style>

        {/* Pagination UI */}
        {totalPages > 1 && !loading && (
          <div
            className="pagination"
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "0rem",
              marginBottom: "2.5rem",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "20px",
                zIndex: 0,
              }}
            ></div>
            
            <div style={{ display: "flex", padding: "0.25rem", alignItems: "center" }}>
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  style={{
                    width: "40px",
                    height: "40px",
                    marginRight: "0.5rem",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    background: "#111",
                    color: "white",
                    fontWeight: "bold",
                    zIndex: 1,
                    fontSize: "1.2rem",
                  }}
                >
                  &lt;
                </button>
              )}
              
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(index + 1)}
                  style={{
                    width: "40px",
                    height: "40px",
                    margin: "0 0.25rem",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    background: currentPage === index + 1 ? "white" : "#111",
                    color: currentPage === index + 1 ? "black" : "white",
                    fontWeight: "bold",
                    zIndex: 1,
                    fontSize: "1rem",
                  }}
                >
                  {index + 1}
                </button>
              ))}
              
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  style={{
                    width: "40px",
                    height: "40px",
                    marginLeft: "0.5rem",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    background: "#111",
                    color: "white",
                    fontWeight: "bold",
                    zIndex: 1,
                    fontSize: "1.2rem",
                  }}
                >
                  &gt;
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer now outside the main content, last element of the flex column */}
      <Footer />
    </div>
  );
}

export default function HomeClient() {
  return (
    <Suspense fallback={<div></div>}>
      <CommunityPageContentInner />
    </Suspense>
  );
}
