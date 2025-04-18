"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useCommunities } from "./hooks/usecommunities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/AuthContext";
import { getAuth } from "firebase/auth";
import "./community.css";
import "./all.css";
import "./tag.css";
import "./logup.css";

// Define a type for cuisine strings
type Cuisine = string;

const cuisines: Cuisine[] = [
  "Mexican",
  "Italian",
  "Chinese",
  "Japanese",
  "Indian",
  "Greek",
  "French",
  "Spanish",
  "Turkish",
  "Lebanese",
  "Vietnamese",
  "Korean",
  "Argentinian",
  "Peruvian",
  "Ethiopian",
  "Nigerian",
  "German",
  "British",
  "Irish",
];

export default function CommunityPage() {
  const { communities, loading, error } = useCommunities();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { user, logout } = useAuth();
  const [selectedCuisines, setSelectedCuisines] = useState<Cuisine[]>([]);
  const [mounted, setMounted] = useState(false);

  // State to control visibility of the promo card
  const [showPromoCard, setShowPromoCard] = useState(true);
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
  


  // State for user promotion info: last promotion time and how many boosts used today.
  const [userPromoInfo, setUserPromoInfo] = useState<{
    userLastPromotion: string | null;
    dailyPromotionCount: number;
  }>({ userLastPromotion: null, dailyPromotionCount: 0 });

  // State for community promotions info: a mapping from community id to its last promotion time.
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
  // Expected to receive a JSON response such as:
  // { userLastPromotion: "2025-04-16T12:34:56Z", dailyPromotionCount: 2 }
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
  // Expected JSON: { promotions: [ { community_id: number, promoted_at: string }, ... ] }
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
  // For a given baseTime (from the backend) and a duration (in ms), it returns an object with hours, minutes, seconds.
  // Returns null if the cooldown is over.
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

// …

// Handle promote button clicks.
const handlePromote = async (community_id: number) => {
  try {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      // no alert here
      return;
    }

    // optional 6‑hour check...
    if (userPromoInfo.userLastPromotion) {
      const userCooldown = getCountdown(userPromoInfo.userLastPromotion, 6 * 60 * 60 * 1000);
      if (userCooldown) {
        // silently bail out
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
      // you could set an inline error state here instead of alert()
      console.error("Promotion error:", data.error);
      return;
    }

    // on success, update your UI state without any alert
    const nowISO = new Date().toISOString();
    setCommunityPromotions((prev) => ({ ...prev, [community_id]: nowISO }));
    setUserPromoInfo((prev) => ({
      userLastPromotion: nowISO,
      dailyPromotionCount: prev.dailyPromotionCount + 1,
    }));

  } catch (err) {
    console.error("Unexpected error promoting:", err);
    // no alert here either
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

  // Reset page number when search term or selected cuisines change.
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCuisines]);

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

  const toggleCuisine = (cuisine: Cuisine) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  // Filter communities by search term and selected cuisines.
  const filteredCommunities = communities.filter((server) => {
    const matchesSearch =
      searchTerm === "" ||
      server.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      server.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisines =
      selectedCuisines.length === 0 ||
      selectedCuisines.some((cuisine) =>
        server.tags.some((tag) => tag.toLowerCase() === cuisine.toLowerCase())
      );
    return matchesSearch && matchesCuisines;
  });

  // Pagination calculation.
  const serversPerPage = 24;
  const totalPages = Math.ceil(filteredCommunities.length / serversPerPage);
  const startIndex = (currentPage - 1) * serversPerPage;
  const currentServers = filteredCommunities.slice(startIndex, startIndex + serversPerPage);

  const handlePostCommunity = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login?redirect=/dashboard");
    }
  };

  if (!mounted) {
    return null;
  }
  
  // Calculate the user’s 6‑hour cooldown and the number of promotions left today.
  const userCooldown = userPromoInfo.userLastPromotion
    ? getCountdown(userPromoInfo.userLastPromotion, 6 * 60 * 60 * 1000)
    : null;
  const dailyPromosLeft = 4 - (userPromoInfo.dailyPromotionCount || 0);

  return (
    <div
      className="community-page"
      style={{ position: "relative", width: "100%", margin: 0, padding: 0 }}
    >
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Logo SVG */}
          <div
            style={{ width: "50px", height: "auto" }}
            dangerouslySetInnerHTML={{
              __html: `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 548.62 583"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M1000.34,702.68c-11.44-10.48-22.58-20.76-33.8-31-4.9-4.46-5.27-4.26-10.15.33C922,704.34,887.08,736,848,762.66c-21.8,14.87-44.34,28.47-70.2,35.23-14.62,3.83-29.45,5.53-44.34,1.37-23.41-6.52-42.93-30.21-46-54.14-2.89-22.77,2.93-43.91,10.74-64.71,12.21-32.52,30.34-61.82,50.29-90a849.21,849.21,0,0,1,60.26-75.23c3.18-3.56,3-5.77-.09-9.18-26.83-29.69-52.35-60.47-74.41-93.93-17.47-26.48-33.19-53.92-42-84.69-6.08-21.29-8.2-42.83-.68-64.23,8.33-23.72,24.56-39.11,49.78-43,15.72-2.44,31.14,1.11,46.1,6.07,30,10,56.76,26.19,82.36,44.43,31,22.1,59.29,47.44,86.32,74.2,5.22,5.17,5.49,5.24,10.68,0,29.26-29.73,60-57.82,94.51-81.41,24.86-17,50.72-32,80-40.13,13.86-3.83,27.93-6.23,42.32-3,27.11,6.12,42.38,24.19,48.4,50.16,6.2,26.71.61,52.5-9.28,77.53-15.33,38.81-38,73.19-63.64,105.83-14.3,18.24-29.57,35.64-45.15,52.78-4.17,4.58-4.19,5.39-.16,10,31,35.15,60.56,71.42,84.7,111.74,15.2,25.37,28.14,51.79,34.23,81,4,19.29,3.81,38.23-4.29,56.68-9.12,20.77-25.61,31-47.33,34.46-27.54,4.38-51.4-5.77-74.48-18.67-35.8-20-67.81-45.29-98.6-72.19-2.51-2.19-5-4.4-7.77-6.84m-159-261.5c32.22,38.67,66.21,75.76,101.2,111.92,2.51,2.6,3.66,4.57.4,7.31-10.5,8.8-19.6,19-29.44,28.5-4.64,4.46-9.18,9-14,13.76l-34.92-37.26c-6.78-7.23-6.91-7.34-13.36.19A917,917,0,0,0,779.41,661c-10.11,15.49-19.64,31.35-26.71,48.53-2.46,6-5.07,12-5.32,18.6-.29,7.6,3.65,10.63,11,9a73.78,73.78,0,0,0,16.31-6.15c24.69-12.19,46.18-29.09,67.37-46.36,36.59-29.82,70.47-62.62,103.87-95.92,50.28-50.11,99.83-100.91,144.88-155.87,24.21-29.54,46.86-60.21,65.67-93.52,8.17-14.47,16-29.2,18.85-46,1.49-8.79-4-14.35-12.76-12.39-18.2,4.09-33.94,13.49-49.34,23.45-25.13,16.24-48,35.36-69.83,55.73-42.76,39.93-83.25,82.11-122.72,125.29-1.29,1.41-2.2,3.39-4.84,3.68-14-14-27.45-28.79-40.67-43.76-2.44-2.76-.58-4.45,1.14-6.35q17.46-19.25,34.89-38.51c4.17-4.62,4.18-5.47-.22-9.89-30.16-30.28-61.89-58.73-97.47-82.57C797,296.9,780,286.75,760.37,282c-9.86-2.38-14.56,2.47-12.56,12.57,2.3,11.59,7.14,22.18,12.74,32.4,22.43,40.95,50.39,78,80.79,114.19M1153,675.45c-14.11-23.63-30.09-45.94-47-67.6-11.28-14.43-22.59-28.84-35-42.35-4.06-4.42-6.16-4.42-9.92-.55q-23.32,24-46.6,48c-5.25,5.42-5.15,7,.34,12.23,17.16,16.27,34.49,32.35,52.56,47.6,23,19.46,46.56,38.28,72.76,53.42,8.24,4.76,16.82,8.79,26.14,11,6,1.41,10.74-2.83,9.84-8.88a67,67,0,0,0-2.15-9.71C1169.29,703.4,1161.42,689.69,1153,675.45Z" transform="translate(-686.74 -218.68)"/>`,
            }}
          />
          {/* Text SVG */}
          <div style={{ width: "150px", height: "auto" }}
            dangerouslySetInnerHTML={{
              __html: `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800.11 213.36"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M709.65,519V401.55c0-6.6,0-6.62,6.63-6.59,17.82.07,35.65-.44,53.44.72,26.31,1.73,46.95,19.11,49.84,45.12,1,8.9,1.11,17.57-1.32,26.17A43.91,43.91,0,0,1,804,489.34c-2.4,2-4.67,4.12-7.64,6.77,7.4,3.3,13.22,7.51,17.72,13.49,9.21,12.25,11.65,26.21,10.66,41a71.26,71.26,0,0,1-1.88,12.78c-4.84,19.05-23.53,34.9-43.39,36.92-21.93,2.23-43.92.51-65.88,1-4.16.1-3.86-2.71-3.86-5.4q0-30,0-60V519m38.62-2q0,19,0,37.94c0,13.74,0,13.74,13.89,12.7,13.38-1,20.76-6.9,23-20,2.38-14-1.52-26.24-14.79-31.35a43.08,43.08,0,0,0-17.56-3c-2.07.09-4.13,0-4.51,3.68M779.66,441c-2.52-6.06-7.18-9.46-13.48-10.63-4.07-.76-8.2-1.24-12.29-1.86s-5.69.85-5.62,5.15q.3,21,0,41.95c0,3.9,1.19,5.6,5.14,5.11,1.15-.15,2.35.1,3.49-.06,15.23-2.08,21.52-4.2,24.42-19.26A35.78,35.78,0,0,0,779.66,441Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M1286.89,601.35c-15.32,0-30.15-.14-45,.1-4.65.08-6.37-1.12-6.36-6.09q.26-97.5.09-195c0-4.29,1.16-5.87,5.63-5.79,14.67.23,29.34-.17,44,.15,30.42.65,52.4,14.22,64.16,42.91a133.71,133.71,0,0,1,9.88,49.06c.18,11.49.49,23-.07,34.47-.8,16.26-4.29,32-12.74,46.17-13.31,22.36-33.52,32.93-59.61,34m-11.59-42,0,5c0,2.29,1.09,3.29,3.44,3.15,19-1.11,32.75-7,38.06-30.89,3.51-15.8,2.7-31.75,2.81-47.68a113.15,113.15,0,0,0-4.21-31c-5-18.12-17.57-28.39-33.89-28.66-5.3-.08-6.33,1.88-6.31,6.7C1275.38,476.76,1275.3,517.57,1275.3,559.34Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M953.58,570.45c-8.8,17.54-21.17,30.54-40.89,34-25.82,4.52-48.4-3.73-62.79-26.8-8.94-14.32-13.54-30.24-16.27-46.8-2.5-15.2-2.54-30.54-1.82-45.81,1-20.35,4.47-40.33,13.59-58.85,10.06-20.43,26.15-31.95,49.29-33.69,24.56-1.85,43,7.68,55.9,28.32,7.06,11.29,10.92,23.81,13.76,36.71,4.26,19.34,4.71,39,3.81,58.57a129.66,129.66,0,0,1-14.58,54.37m-80.33-78.93c0,9.82-.4,19.67.24,29.44.69,10.73,1.46,21.54,5.51,31.74s12.45,17.3,20.84,16.82c10.48-.6,16.28-7.39,19.83-16.52a106.45,106.45,0,0,0,6.8-35c.61-17.75,1.13-35.58-1.84-53.24-1.51-9-2.81-18.11-7.5-26.17-7.79-13.38-24.74-13.69-33.18-.71a40.05,40.05,0,0,0-4.67,10.43A150.58,150.58,0,0,0,873.25,491.52Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M1211,601.36c-7.5,0-14.5-.2-21.49.07-3.81.15-5.61-1.2-6.8-4.81-6.93-21-14.23-41.9-21-62.94-1.63-5-4-6.85-9.29-6.47-4,.29-5.1,1.74-5.07,5.49.12,19.16,0,38.32,0,57.49,0,11.17,0,11.17-11,11.16h-21c-6.65,0-6.68,0-6.68-6.53q0-42.24,0-84.48v-109c0-6.67,0-6.69,6.48-6.7,15.5,0,31-.37,46.49.1,18.35.56,35.19,5.27,47.58,20.22,7,8.5,10.16,18.66,11.8,29.24,2.33,15.1,1.81,30.17-2.64,44.92-3.54,11.77-10.1,21.35-21,27.47-3.34,1.87-3.73,3.79-2.34,7.21,9.27,22.81,18.37,45.69,27.49,68.56,1,2.59,2.51,5,2.7,8.38-4.59,1.19-9.22.3-14.25.6m-30.94-160.83c-5.41-11.4-21.55-12.88-29.63-12.12-2.24.21-2.38,2.1-2.4,3.77-.24,19.15-.42,38.3-.66,57.45,0,2.91,1.1,4.37,4.18,4,3.63-.4,7.32-.46,10.9-1.12,9.16-1.68,16.18-6.3,18.88-15.67C1184.77,464.93,1185.11,453,1180.05,440.53Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M664,523.16c12.29,25.82,24.6,51.22,35.74,76.91-2,1.66-3.52,1.28-5,1.28-11.5,0-23-.09-34.49.08-3.48.05-5.33-1-6.74-4.37-7.39-17.47-15.06-34.83-22.62-52.22-.73-1.66-1.19-3.46-3.17-5.26-3.78,8.52-7.48,16.78-11.12,25.08q-7.22,16.47-14.34,33c-.8,1.85-1.41,3.73-4,3.72-12.81,0-25.61,0-38.22,0-1.2-2-.15-3.24.44-4.52,14.17-30.69,28.27-61.41,42.66-92,2-4.18,2-7.47.16-11.64-13.72-30.51-27.22-61.12-40.77-91.71-.65-1.48-1.16-3-1.63-4.3,1.13-1.83,2.58-1.48,3.84-1.5,12-.22,24-.1,36-.7,5.36-.27,7.61,1.85,9.4,6.54,5.69,14.92,11.8,29.69,17.78,44.5.74,1.83,1.64,3.6,2.64,5.77,2.44-1.8,3.06-4.27,3.94-6.48q9.21-23.21,18.28-46.46c.8-2.06,1.53-4.08,4.34-4.06,12.33.08,24.66.09,37,.17a6.22,6.22,0,0,1,1.82.59c.27,3-1.2,5.32-2.21,7.71C681,433,668,462.54,654.43,491.84c-2,4.3-2.29,7.86.14,12.14C658,510.05,660.75,516.53,664,523.16Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M1007.78,571.64c-1.62,8.89-3.11,17.39-4.6,25.88-.47,2.71-2,3.87-4.83,3.83q-14.75-.18-29.48,0c-3.74,0-4.45-1.53-3.72-5q9.2-43.34,18.16-86.69c7.46-35.89,15-71.76,22.25-107.69,1-4.78,2.67-6.57,7.73-6.43,12.81.38,25.64.27,38.46.05,4.06-.07,5.88,1.2,6.74,5.29,7.83,37.16,15.86,74.28,23.82,111.41q8.87,41.36,17.69,82.72c.38,1.76.6,3.56.93,5.55-2.62,1.35-5.3.77-7.87.79-8.82.07-17.65-.13-26.48.1-3.75.1-5.33-1.33-6-4.93-1.82-9.94-4.06-19.81-5.81-29.77-.59-3.4-2.18-4.44-5.34-4.42-11.83.07-23.65.1-35.48,0-6.74-.06-4.63,5.57-6.18,9.35m24.51-121.07c-1.37,0-.91,1.18-1,1.84q-4.5,24-8.91,48c-1.61,8.77-3.13,17.56-4.82,27.13,9.65,0,18.58.12,27.51-.08,2.39-.06,2.48-2,2.06-4.15C1042.2,499.21,1037.39,475.13,1032.29,450.57Z" transform="translate(-559.45 -392.26)"/></svg>`,
            }}
          />
        </div>

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
{/* Floating Promo Status Card */}
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
      <div style={{ paddingTop: "1rem" }}>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

<div className="server-list">
  {loading ? (
    <p>Loading...</p>
  ) : error ? (
    <p>Error: {error}</p>
  ) : filteredCommunities.length === 0 ? (
    <p>No communities found.</p>
  ) : (
    currentServers.map((server) => {
      // If the community was promoted recently, calculate its 24‑hour cooldown
      const communityCooldown = communityPromotions[server.id]
        ? getCountdown(communityPromotions[server.id], 24 * 60 * 60 * 1000)
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
        <div
          key={server.id}
          className="server-card"
          onClick={() => router.push(`/community/${server.id}`)}
          style={{ position: "relative", display: "flex", flexDirection: "column" }}
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
            {/* Title with enough right padding to make room for button */}
            <h3 style={{ 
              margin: 0, 
              wordWrap: "break-word"
            }}>{server.name}</h3>
            
            {/* Boost Button with Adjustable Position */}
            <div
              style={{
                position: "absolute",
                top: buttonTop,
                right: buttonRight,
              }}
            >
              <div className="promote-button-container" style={{ position: "relative" }}>
                <button
                  className={`promote-button ${isPromoted ? 'promote-button-promoted' : ''}`}
                  style={{
                    padding: "0.5rem 1rem",
                    background: isPromoted ? "#333" : "white",
                    border: isPromoted ? "1px solid rgba(180, 180, 180, 0.6)" : "none",
                    borderRadius: "999px",
                    cursor: disableButton ? "not-allowed" : "pointer",
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
                    if (!disableButton) {
                      handlePromote(server.id);
                    }
                  }}
                  disabled={disableButton}                >
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
          </div>

          <p>{server.description}</p>
          <div className="tags">
            {server.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>

          {/* Container to push the Join button to the bottom */}
          <div style={{ flex: "1" }}></div>

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

{/* Add the necessary CSS animations with scoped names */}
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
  
  .promote-button-promoted {
    animation: promote-button-pulse 2.5s infinite ease-in-out;
  }
  
  .promote-button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`}</style>
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div
            className="pagination"
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "2rem",
              gap: "0.5rem",
            }}
          >
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-arrow"
            >
              &laquo;
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`pagination-number ${currentPage === index + 1 ? "active" : ""}`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="pagination-arrow"
            >
              &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
