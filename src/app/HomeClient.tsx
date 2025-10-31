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

  // ====== Viewport width (for progressive scaling under 585px) ======
  const [vw, setVw] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // Progressive scale: at 585px => 1; at 360px => 0.78; below 360px clamp to 0.78
  const MIN_W = 360;
  const MAX_W = 585;
  const MIN_SCALE = 0.78;
  const t = Math.max(0, Math.min(1, (vw - MIN_W) / (MAX_W - MIN_W)));
  const promoCardScale = vw >= MAX_W ? 1 : MIN_SCALE + (1 - MIN_SCALE) * t;

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
  // NEW: keep one timer per toast type so spamming the same type doesn't stack
  const toastTimers = useRef<Partial<Record<ToastType, number>>>({});

  // State for button shake animation
  const [shakingButtons, setShakingButtons] = useState<{[key: number]: boolean}>({});

  // Function to add a toast notification (de-duped per type)
  const addToast = (type: ToastType, message: string) => {
    setToasts(prev => {
      const existing = prev.find(t => t.type === type);
      if (existing) {
        const updated = prev.map(t => t.type === type ? { ...t, message } : t);
        if (toastTimers.current[type]) {
          window.clearTimeout(toastTimers.current[type]!);
        }
        toastTimers.current[type] = window.setTimeout(() => {
          setToasts(curr => curr.filter(tt => tt.type !== type));
          delete toastTimers.current[type];
        }, 3000);
        return updated;
      } else {
        const id = toastIdCounter.current++;
        const next = [...prev, { id, type, message }];
        if (toastTimers.current[type]) {
          window.clearTimeout(toastTimers.current[type]!);
        }
        toastTimers.current[type] = window.setTimeout(() => {
          setToasts(curr => curr.filter(tt => tt.type !== type));
          delete toastTimers.current[type];
        }, 3000);
        return next;
      }
    });
  };

  // Function to shake a button
  const shakeButton = (communityId: number) => {
    setShakingButtons(prev => ({ ...prev, [communityId]: true }));
    setTimeout(() => {
      setShakingButtons(prev => ({ ...prev, [communityId]: false }));
    }, 500);
  };

  // State for user promotion info
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

  // Build a countdown from secondsRemaining so the UI ticks every second
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
  const PERSONAL_COOLDOWN_MS = 60 * 60 * 1000; // 1h
  
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
        minHeight: "100vh",
        display: "flex",
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
                onClick={() => {
                  setToasts(prev => prev.filter(t => t.id !== toast.id));
                  if (toastTimers.current[toast.type]) {
                    window.clearTimeout(toastTimers.current[toast.type]!);
                    delete toastTimers.current[toast.type];
                  }
                }}
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
  {/* Logo SVG */}
  <div
    style={{ width: "50px", height: "auto" }}
    dangerouslySetInnerHTML={{
      __html: `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 548.62 583"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M1000.34,702.68c-11.44-10.48-22.58-20.76-33.8-31-4.9-4.46-5.27-4.26-10.15.33C922,704.34,887.08,736,848,762.66c-21.8,14.87-44.34,28.47-70.2,35.23-14.62,3.83-29.45,5.53-44.34,1.37-23.41-6.52-42.93-30.21-46-54.14-2.89-22.77,2.93-43.91,10.74-64.71,12.21-32.52,30.34-61.82,50.29-90a849.21,849.21,0,0,1,60.26-75.23c3.18-3.56,3-5.77-.09-9.18-26.83-29.69-52.35-60.47-74.41-93.93-17.47-26.48-33.19-53.92-42-84.69-6.08-21.29-8.2-42.83-.68-64.23,8.33-23.72,24.56-39.11,49.78-43,15.72-2.44,31.14,1.11,46.1,6.07,30,10,56.76,26.19,82.36,44.43,31,22.1,59.29,47.44,86.32,74.2,5.22,5.17,5.49,5.24,10.68,0,29.26-29.73,60-57.82,94.51-81.41,24.86-17,50.72-32,80-40.13,13.86-3.83,27.93-6.23,42.32-3,27.11,6.12,42.38,24.19,48.4,50.16,6.2,26.71.61,52.5-9.28,77.53-15.33,38.81-38,73.19-63.64,105.83-14.3,18.24-29.57,35.64-45.15,52.78-4.17,4.58-4.19,5.39-.16,10,31,35.15,60.56,71.42,84.7,111.74,15.2,25.37,28.14,51.79,34.23,81,4,19.29,3.81,38.23-4.29,56.68-9.12,20.77-25.61,31-47.33,34.46-27.54,4.38-51.4-5.77-74.48-18.67-35.8-20-67.81-45.29-98.6-72.19-2.51-2.19-5-4.4-7.77-6.84m-159-261.5c32.22,38.67,66.21,75.76,101.2,111.92,2.51,2.6,3.66,4.57.4,7.31-10.5,8.8-19.6,19-29.44,28.5-4.64,4.46-9.18,9-14,13.76l-34.92-37.26c-6.78-7.23-6.91-7.34-13.36.19A917,917,0,0,0,779.41,661c-10.11,15.49-19.64,31.35-26.71,48.53-2.46,6-5.07,12-5.32,18.6-.29,7.6,3.65,10.63,11,9a73.78,73.78,0,0,0,16.31-6.15c24.69-12.19,46.18-29.09,67.37-46.36,36.59-29.82,70.47-62.62,103.87-95.92,50.28-50.11,99.83-100.91,144.88-155.87,24.21-29.54,46.86-60.21,65.67-93.52,8.17-14.47,16-29.2,18.85-46,1.49-8.79-4-14.35-12.76-12.39-18.2,4.09-33.94,13.49-49.34,23.45-25.13,16.24-48,35.36-69.83,55.73-42.76,39.93-83.25,82.11-122.72,125.29-1.29,1.41-2.2,3.39-4.84,3.68-14-14-27.45-28.79-40.67-43.76-2.44-2.76-.58-4.45,1.14-6.35q17.46-19.25,34.89-38.51c4.17-4.62,4.18-5.47-.22-9.89-30.16-30.28-61.89-58.73-97.47-82.57C797,296.9,780,286.75,760.37,282c-9.86-2.38-14.56,2.47-12.56,12.57,2.3,11.59,7.14,22.18,12.74,32.4,22.43,40.95,50.39,78,80.79,114.19M1153,675.45c-14.11-23.63-30.09-45.94-47-67.6-11.28-14.43-22.59-28.84-35-42.35-4.06-4.42-6.16-4.42-9.92-.55q-23.32,24-46.6,48c-5.25,5.42-5.15,7,.34,12.23,17.16,16.27,34.49,32.35,52.56,47.6,23,19.46,46.56,38.28,72.76,53.42,8.24,4.76,16.82,8.79,26.14,11,6,1.41,10.74-2.83,9.84-8.88a67,67,0,0,0-2.15-9.71C1169.29,703.4,1161.42,689.69,1153,675.45Z" transform="translate(-686.74 -218.68)"/>`,
    }}
  />
  {/* Text SVG */}
  <div
    style={{ width: "150px", height: "auto" }}
    dangerouslySetInnerHTML={{
      __html: `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800.11 213.36"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M709.65,519V401.55c0-6.6,0-6.62,6.63-6.59,17.82.07,35.65-.44,53.44.72,26.31,1.73,46.95,19.11,49.84,45.12,1,8.9,1.11,17.57-1.32,26.17A43.91,43.91,0,0,1,804,489.34c-2.4,2-4.67,4.12-7.64,6.77,7.4,3.3,13.22,7.51,17.72,13.49,9.21,12.25,11.65,26.21,10.66,41a71.26,71.26,0,0,1-1.88,12.78c-4.84,19.05-23.53,34.9-43.39,36.92-21.93,2.23-43.92.51-65.88,1-4.16.1-3.86-2.71-3.86-5.4q0-30,0-60V519m38.62-2q0,19,0,37.94c0,13.74,0,13.74,13.89,12.7,13.38-1,20.76-6.9,23-20,2.38-14-1.52-26.24-14.79-31.35a43.08,43.08,0,0,0-17.56-3c-2.07.09-4.13,0-4.51,3.68M779.66,441c-2.52-6.06-7.18-9.46-13.48-10.63-4.07-.76-8.2-1.24-12.29-1.86s-5.69.85-5.62,5.15q.3,21,0,41.95c0,3.9,1.19,5.6,5.14,5.11,1.15-.15,2.35.1,3.49-.06,15.23-2.08,21.52-4.2,24.42-19.26A35.78,35.78,0,0,0,779.66,441Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M1286.89,601.35c-15.32,0-30.15-.14-45,.1-4.65.08-6.37-1.12-6.36-6.09q.26-97.5.09-195c0-4.29,1.16-5.87,5.63-5.79,14.67.23,29.34-.17,44,.15,30.42.65,52.4,14.22,64.16,42.91a133.71,133.71,0,0,1,9.88,49.06c.18,11.49.49,23-.07,34.47-.8,16.26-4.29,32-12.74,46.17-13.31,22.36-33.52,32.93-59.61,34m-11.59-42,0,5c0,2.29,1.09,3.29,3.44,3.15,19-1.11,32.75-7,38.06-30.89,3.51-15.8,2.7-31.75,2.81-47.68a113.15,113.15,0,0,0-4.21-31c-5-18.12-17.57-28.39-33.89-28.66-5.3-.08-6.33,1.88-6.31,6.7C1275.38,476.76,1275.3,517.57,1275.3,559.34Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M953.58,570.45c-8.8,17.54-21.17,30.54-40.89,34-25.82,4.52-48.4-3.73-62.79-26.8-8.94-14.32-13.54-30.24-16.27-46.8-2.5-15.2-2.54-30.54-1.82-45.81,1-20.35,4.47-40.33,13.59-58.85,10.06-20.43,26.15-31.95,49.29-33.69,24.56-1.85,43,7.68,55.9,28.32,7.06,11.29,10.92,23.81,13.76,36.71,4.26,19.34,4.71,39,3.81,58.57a129.66,129.66,0,0,1-14.58,54.37m-80.33-78.93c0,9.82-.4,19.67.24,29.44.69,10.73,1.46,21.54,5.51,31.74s12.45,17.3,20.84,16.82c10.48-.6,16.28-7.39,19.83-16.52a106.45,106.45,0,0,0,6.8-35c.61-17.75,1.13-35.58-1.84-53.24-1.51-9-2.81-18.11-7.5-26.17-7.79-13.38-24.74-13.69-33.18-.71a40.05,40.05,0,0,0-4.67,10.43A150.58,150.58,0,0,0,873.25,491.52Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M1211,601.36c-7.5,0-14.5-.2-21.49.07-3.81.15-5.61-1.2-6.8-4.81-6.93-21-14.23-41.9-21-62.94-1.63-5-4-6.85-9.29-6.47-4,.29-5.1,1.74-5.07,5.49.12,19.16,0,38.32,0,57.49,0,11.17,0,11.17-11,11.16h-21c-6.65,0-6.68,0-6.68-6.53q0-42.24,0-84.48v-109c0-6.67,0-6.69,6.48-6.7,15.5,0,31-.37,46.49.1,18.35.56,35.19,5.27,47.58,20.22,7,8.5,10.16,18.66,11.8,29.24,2.33,15.1,1.81,30.17-2.64,44.92-3.54,11.77-10.1,21.35-21,27.47-3.34,1.87-3.73,3.79-2.34,7.21,9.27,22.81,18.37,45.69,27.49,68.56,1,2.59,2.51,5,2.7,8.38-4.59,1.19-9.22.3-14.25.6m-30.94-160.83c-5.41-11.4-21.55-12.88-29.63-12.12-2.24.21-2.38,2.1-2.4,3.77-.24,19.15-.42,38.3-.66,57.45,0,2.91,1.1,4.37,4.18,4,3.63-.4,7.32-.46,10.9-1.12,9.16-1.68,16.18-6.3,18.88-15.67C1184.77,464.93,1185.11,453,1180.05,440.53Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M664,523.16c12.29,25.82,24.6,51.22,35.74,76.91-2,1.66-3.52,1.28-5,1.28-11.5,0-23-.09-34.49.08-3.48.05-5.33-1-6.74-4.37-7.39-17.47-15.06-34.83-22.62-52.22-.73-1.66-1.19-3.46-3.17-5.26-3.78,8.52-7.48,16.78-11.12,25.08q-7.22,16.47-14.34,33c-.8,1.85-1.41,3.73-4,3.72-12.81,0-25.61,0-38.22,0-1.2-2-.15-3.24.44-4.52,14.17-30.69,28.27-61.41,42.66-92,2-4.18,2-7.47.16-11.64-13.72-30.51-27.22-61.12-40.77-91.71-.65-1.48-1.16-3-1.63-4.3,1.13-1.83,2.58-1.48,3.84-1.5,12-.22,24-.1,36-.7,5.36-.27,7.61,1.85,9.4,6.54,5.69,14.92,11.8,29.69,17.78,44.5.74,1.83,1.64,3.6,2.64,5.77,2.44-1.8,3.06-4.27,3.94-6.48q9.21-23.21,18.28-46.46c.8-2.06,1.53-4.08,4.34-4.06,12.33.08,24.66.09,37,.17a6.22,6.22,0,0,1,1.82.59c.27,3-1.2,5.32-2.21,7.71C681,433,668,462.54,654.43,491.84c-2,4.3-2.29,7.86.14,12.14C658,510.05,660.75,516.53,664,523.16Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M1007.78,571.64c-1.62,8.89-3.11,17.39-4.6,25.88-.47,2.71-2,3.87-4.83,3.83q-14.75-.18-29.48,0c-3.74,0-4.45-1.53-3.72-5q9.2-43.34,18.16-86.69c7.46-35.89,15-71.76,22.25-107.69,1-4.78,2.67-6.57,7.73-6.43,12.81.38,25.64.27,38.46.05,4.06-.07,5.88,1.2,6.74,5.29,7.83,37.16,15.86,74.28,23.82,111.41q8.87,41.36,17.69,82.72c.38,1.76.6,3.56.93,5.55-2.62,1.35-5.3.77-7.87.79-8.82.07-17.65-.13-26.48.1-3.75.1-5.33-1.33-6-4.93-1.82-9.94-4.06-19.81-5.81-29.77-.59-3.4-2.18-4.44-5.34-4.42-11.83.07-23.65.1-35.48,0-6.74-.06-4.63,5.57-6.18,9.35m24.51-121.07c-1.37,0-.91,1.18-1,1.84q-4.5,24-8.91,48c-1.61,8.77-3.13,17.56-4.82,27.13,9.65,0,18.58.12,27.51-.08,2.39-.06,2.48-2,2.06-4.15C1042.2,499.21,1037.39,475.13,1032.29,450.57Z" transform="translate(-559.45 -392.26)"/></svg>`,
    }}
  />
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
    {/* Floating Promo Card (progressively scales down under 585px) */}
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
            pointerEvents: showPromoCard ? "auto" : "none",
            // 👇 Progressive shrink under 585px
            transform: `scale(${promoCardScale})`,
            transformOrigin: "right bottom",
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
            style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}
            >
              <ClockIcon />
            </div>

            <div style={{ display: "grid", gap: 2, flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {userCooldown ? "Next boost in" : "Ready to boost"}
              </div>
              <div
                style={{ fontWeight: 700, letterSpacing: 0.4, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
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
                  transition: "width 0.9s linear",
                }}
              />
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

    {/* Mini floating icon button (also scales a bit under 585px) */}
    {!showPromoCard && (
      <button
        onClick={() => setShowPromoCard(true)}
        aria-label="Show boosts"
        title="Show boosts"
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
          zIndex: 10002,
          pointerEvents: "auto",
          transform: `scale(${Math.max(0.85, promoCardScale)})`,
          transformOrigin: "right bottom",
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
          transform: `scale(${Math.max(0.9, promoCardScale)})`,
          transformOrigin: "right bottom",
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
<h1
  style={{ display: "flex", alignItems: "center", justifyContent: "center" ,     flexWrap: "wrap",
  }}
>
  <span style={{ fontSize: "3rem", fontWeight: "bold" }}>Discover </span>
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    style={{ width: "3rem", height: "3rem", margin: "0 0.5rem", fill: "currentColor" }}
  >
    <g>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </g>
  </svg>
  <span style={{ fontSize: "3rem", fontWeight: "bold" }}> Communities</span>
</h1>
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
            Search by name or tag
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
                  className={`cuisine-chip ${isSelected ? "cuisine-chip-selected" : "cuisine-chip-unselected"}`}
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
                    
                    {/* Modern Promote Button */}
                    <div
                      style={{
                        position: "absolute",
                        top: buttonTop,
                        right: buttonRight,
                      }}
                    >
                      <div className="promote-button-container" style={{ position: "relative", minHeight: "56px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <motion.button
                          className={`modern-promote-button ${isShaking ? 'button-shake' : ''}`}
                          layout
                          initial={false}
                          animate={{
                            width: isPromoted ? "115px" : "95px",
                            padding: isPromoted ? "0.45rem 1.1rem" : "0.5rem 1.2rem",
                            marginTop: isPromoted ? "0.6rem" : "1rem",
                            background: isPromoted 
                              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)"
                              : "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
                            color: isPromoted ? "rgb(16, 185, 129)" : "#1a1a1a",
                            boxShadow: isPromoted 
                              ? "0 0 20px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                              : "0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
                            border: isPromoted ? "1.5px solid rgba(16, 185, 129, 0.4)" : "1.5px solid transparent",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            mass: 0.8,
                          }}
                          style={{
                            marginRight: ".8rem",
                            marginBottom: isPromoted ? "22px" : "0px",
                            borderRadius: "14px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            textAlign: "center",
                            position: "relative",
                            overflow: "hidden",
                            backdropFilter: isPromoted ? "blur(10px)" : "none",
                            transformOrigin: "center center",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromote(server.id);
                          }}
                          whileHover={!isPromoted ? {
                            scale: 1.03,
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
                          } : {}}
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
                                  gap: "4px",
                                  position: "relative",
                                  zIndex: 2,
                                }}
                              >
                                <svg 
                                  width="14" 
                                  height="14" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="3" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                  style={{
                                    filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))"
                                  }}
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
                          
                          {isPromoted && (
                            <>
                              <div className="modern-promote-shimmer" style={{
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "100%",
                                height: "100%",
                                background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)",
                                animation: "modern-shimmer 6s infinite",
                                zIndex: 1
                              }}></div>
                              <div className="modern-promote-glow" style={{
                                position: "absolute",
                                inset: "1px",
                                borderRadius: "12px",
                                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3))",
                                filter: "blur(8px)",
                                opacity: 0.6,
                                zIndex: 0,
                                animation: "modern-pulse 9s infinite",
                              }}></div>
                            </>
                          )}
                        </motion.button>
                        
                        {/* Modern Timer Badge with AnimatePresence */}
                        <AnimatePresence>
                          {isPromoted && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.85 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.85 }}
                              transition={{ type: "spring", stiffness: 400, damping: 22 }}
                              style={{
                                fontSize: "0.7rem",
                                background: "linear-gradient(135deg, rgba(20, 20, 20, 0.85) 0%, rgba(20, 20, 20, 0.9) 100%)",
                                color: "rgb(16, 185, 129)",
                                padding: "3px 10px",
                                borderRadius: "8px",
                                whiteSpace: "nowrap",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4), 0 0 12px rgba(16, 185, 129, 0.2)",
                                minWidth: "75px",
                                textAlign: "center",
                                fontWeight: "600",
                                letterSpacing: "0.5px",
                                fontVariantNumeric: "tabular-nums",
                                backdropFilter: "blur(8px)",
                                marginTop: "-29px",
                                marginRight: "13px"
                              }}
                            >
                              {formattedCountdown}
                            </motion.div>
                          )}
                        </AnimatePresence>
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

        {/* Modern Promote Button Animations */}
        <style jsx>{`
          @keyframes modern-shimmer {
            0% { left: -100%; }
            20% { left: 150%; }
            100% { left: 150%; }
          }
          
          @keyframes modern-pulse {
            0%, 100% { 
              opacity: 0.4;
              transform: scale(0.98);
            }
            50% { 
              opacity: 0.7;
              transform: scale(1.02);
            }
          }
          
          @keyframes button-shake {
            0% { transform: translateX(0); }
            20% { transform: translateX(-5px); }
            40% { transform: translateX(5px); }
            60% { transform: translateX(-2px); }
            80% { transform: translateX(2px); }
            100% { transform: translateX(0); }
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
                  {"<"}
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
                  {">"}
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
