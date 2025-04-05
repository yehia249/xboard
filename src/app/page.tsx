"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useCommunities } from "./hooks/usecommunities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/AuthContext";
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
  "Swedish",
  "Danish",
  "Polish",
];

export default function CommunityPage() {
  const { communities, loading, error } = useCommunities();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { user, logout } = useAuth();
  const [selectedCuisines, setSelectedCuisines] = useState<Cuisine[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const serversPerPage = 24;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset page to 1 when search term or selected cuisines change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCuisines]);

  const toggleCuisine = (cuisine: Cuisine) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  // Filter communities by search term (which can match names or any tag, including country tags)
  // and by selected cuisines.
  const filteredCommunities = communities.filter((server) => {
    const matchesSearch =
      searchTerm === "" ||
      server.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      server.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCuisines =
      selectedCuisines.length === 0 ||
      selectedCuisines.some((cuisine) =>
        server.tags.some(
          (tag) => tag.toLowerCase() === cuisine.toLowerCase()
        )
      );

    return matchesSearch && matchesCuisines;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCommunities.length / serversPerPage);
  const startIndex = (currentPage - 1) * serversPerPage;
  const currentServers = filteredCommunities.slice(
    startIndex,
    startIndex + serversPerPage
  );

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

  return (
    <div className="container" style={{ position: "relative" }}>
      {/* Brand Header at Top Left */}
      <div
        className="brand-header"
        style={{
          position: "fixed",
          top: "1rem",
          left: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          zIndex: 1000,
          backgroundColor: "black",
          padding: "0.5rem",
          borderRadius: "8px",
        }}
      >
        {/* Logo SVG */}
        <div
          className="logo-svg"
          style={{
            width: "50px",
            height: "auto",
          }}
          dangerouslySetInnerHTML={{
            __html: `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 534.31 533.74"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M1016,687c-29-20-56.08-41.84-82.29-64.81a1018.06,1018.06,0,0,1-83.72-83c-34.84-38.54-66.54-79.43-93.06-124.17-14.46-24.4-27.32-49.64-34.69-77.23-3.4-12.71-5.86-25.58-4.57-39,2.13-22.14,17.31-36.32,39.56-37.21,25.27-1,48.26,7.11,70.69,17.21,49.77,22.42,93.82,53.75,135.68,88.37q11.17,9.22,22,18.9c2.43,2.19,4.2,2.45,6.84.44A567.75,567.75,0,0,1,1051,347.42c29.51-17.11,59.85-32.29,94-37.92a76.17,76.17,0,0,1,23.92-.23c21.27,3.28,33.82,18.2,34.45,40.05.63,21.65-5.5,41.8-13.64,61.44-12.43,30-28.75,57.83-47.06,84.54-6.68,9.76-13.58,19.37-20.59,28.88-2.1,2.85-2.39,4.91-.13,7.88,19.8,26,37.79,53.24,53.06,82.19,10.89,20.65,20.61,41.84,25.58,64.82,2.79,12.88,4.44,25.89,1.11,39-4,16-15.52,26.34-31.88,29.11-13.5,2.29-26.55.21-39.5-3.23-37.34-9.93-70.49-28.66-102.66-49.37C1023.83,692.18,1020.08,689.7,1016,687Z" transform="translate(-669.2 -261.53)"/><path class="cls-1" d="M731.57,435.47c24.84,42.25,54.09,80.82,86.07,117.39,45.24,51.72,95,98.53,150.23,139.51,30.27,22.48,61.86,42.94,96.14,58.89,17.69,8.24,35.88,15.22,55.41,17.86,14.57,2,28.92,2.33,41.9-6.32a1.41,1.41,0,0,1,1.89,0c.56,1.35-.56,2.1-1.32,2.85-6.6,6.59-12.88,13.57-20,19.59-11.63,9.85-25.75,11-40.17,9.4-24.53-2.7-47-11.77-69-22.51-31.68-15.53-61-34.88-89.29-55.8-7-5.15-7-5.28-13.87-.2-30.41,22.3-61.74,43.1-96,59.05-20,9.29-40.52,17.14-62.67,19.5-14.08,1.51-27.86.47-39.33-9-12.83-10.58-15.47-25.32-14.28-40.76,1.45-18.72,6.94-36.52,14.21-53.82,15.93-37.88,37.84-72.21,62.19-105.08,2.87-3.87,2.86-6.26-.41-9.71-5.62-5.91-10.75-12.28-16.11-18.43a9.17,9.17,0,0,0-1.91-1.23c-4.6,3.83-7.45,9-10.78,13.67-23.62,33.19-45.14,67.61-59.63,105.92-6.26,16.57-11.08,33.49-10.74,51.5.18,9.78,2.47,18.76,8.07,26.82.62.9,1.64,1.72.67,4.17-9.71-11.62-22.82-19.51-29.14-33.34-6.8-14.88-4.77-30.34-1.36-45.56,8.66-38.68,27.91-72.52,48.89-105.51,9.21-14.48,19-28.56,29.6-42.07,2.68-3.41,1.54-6-.65-8.89a649.55,649.55,0,0,1-43-64.36c-12.94-22.41-24.48-45.52-31.81-70.41-4.48-15.16-7.58-30.69-4.73-46.76,1.5-8.43,4.55-15.92,10.77-22,5-4.9,9.72-10.06,14.6-15.08,1.23-1.26,2.19-3,4.68-2.95.43,2.61-1.56,4.28-2.44,6.26-6.2,13.95-5.16,28.38-2.18,42.65C702.39,381.09,716.06,408.49,731.57,435.47Z" transform="translate(-669.2 -261.53)"/><path class="cls-1" d="M1143.14,286.82c-13.39-2.21-26,.1-38.42,3.36-31.09,8.13-59.12,23-86.4,39.51q-13.46,8.12-26.43,17c-3.28,2.25-5.51,2.57-8.64-.23-6-5.3-12.24-10.27-18.55-15.17-3.21-2.48-3-4.3.2-6.46,20.1-13.69,40.67-26.6,62.37-37.65,16.2-8.24,32.76-15.57,50.25-20.64,15-4.35,30.24-6.49,45.84-3.92A34.86,34.86,0,0,1,1142,271.5c7,6.63,13.78,13.52,20.62,20.34a5.18,5.18,0,0,1,1.25,2.63C1157.4,291,1151,287.57,1143.14,286.82Z" transform="translate(-669.2 -261.53)"/></svg>`,
          }}
        ></div>

        {/* Text SVG */}
        <div
          className="text-svg"
          style={{
            width: "150px",
            height: "auto",
          }}
          dangerouslySetInnerHTML={{
            __html: `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800.11 213.36"><defs><style>.cls-1{fill:#fff;}</style></defs><path class="cls-1" d="M709.65,519V401.55c0-6.6,0-6.62,6.63-6.59,17.82.07,35.65-.44,53.44.72,26.31,1.73,46.95,19.11,49.84,45.12,1,8.9,1.11,17.57-1.32,26.17A43.91,43.91,0,0,1,804,489.34c-2.4,2-4.67,4.12-7.64,6.77,7.4,3.3,13.22,7.51,17.72,13.49,9.21,12.25,11.65,26.21,10.66,41a71.26,71.26,0,0,1-1.88,12.78c-4.84,19.05-23.53,34.9-43.39,36.92-21.93,2.23-43.92.51-65.88,1-4.16.1-3.86-2.71-3.86-5.4q0-30,0-60V519m38.62-2q0,19,0,37.94c0,13.74,0,13.74,13.89,12.7,13.38-1,20.76-6.9,23-20,2.38-14-1.52-26.24-14.79-31.35a43.08,43.08,0,0,0-17.56-3c-2.07.09-4.13,0-4.51,3.68M779.66,441c-2.52-6.06-7.18-9.46-13.48-10.63-4.07-.76-8.2-1.24-12.29-1.86s-5.69.85-5.62,5.15q.3,21,0,41.95c0,3.9,1.19,5.6,5.14,5.11,1.15-.15,2.35.1,3.49-.06,15.23-2.08,21.52-4.2,24.42-19.26A35.78,35.78,0,0,0,779.66,441Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M1286.89,601.35c-15.32,0-30.15-.14-45,.1-4.65.08-6.37-1.12-6.36-6.09q.26-97.5.09-195c0-4.29,1.16-5.87,5.63-5.79,14.67.23,29.34-.17,44,.15,30.42.65,52.4,14.22,64.16,42.91a133.71,133.71,0,0,1,9.88,49.06c.18,11.49.49,23-.07,34.47-.8,16.26-4.29,32-12.74,46.17-13.31,22.36-33.52,32.93-59.61,34m-11.59-42,0,5c0,2.29,1.09,3.29,3.44,3.15,19-1.11,32.75-7,38.06-30.89,3.51-15.8,2.7-31.75,2.81-47.68a113.15,113.15,0,0,0-4.21-31c-5-18.12-17.57-28.39-33.89-28.66-5.3-.08-6.33,1.88-6.31,6.7C1275.38,476.76,1275.3,517.57,1275.3,559.34Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M953.58,570.45c-8.8,17.54-21.17,30.54-40.89,34-25.82,4.52-48.4-3.73-62.79-26.8-8.94-14.32-13.54-30.24-16.27-46.8-2.5-15.2-2.54-30.54-1.82-45.81,1-20.35,4.47-40.33,13.59-58.85,10.06-20.43,26.15-31.95,49.29-33.69,24.56-1.85,43,7.68,55.9,28.32,7.06,11.29,10.92,23.81,13.76,36.71,4.26,19.34,4.71,39,3.81,58.57a129.66,129.66,0,0,1-14.58,54.37m-80.33-78.93c0,9.82-.4,19.67.24,29.44.69,10.73,1.46,21.54,5.51,31.74s12.45,17.3,20.84,16.82c10.48-.6,16.28-7.39,19.83-16.52a106.45,106.45,0,0,0,6.8-35c.61-17.75,1.13-35.58-1.84-53.24-1.51-9-2.81-18.11-7.5-26.17-7.79-13.38-24.74-13.69-33.18-.71a40.05,40.05,0,0,0-4.67,10.43A150.58,150.58,0,0,0,873.25,491.52Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M1211,601.36c-7.5,0-14.5-.2-21.49.07-3.81.15-5.61-1.2-6.8-4.81-6.93-21-14.23-41.9-21-62.94-1.63-5-4-6.85-9.29-6.47-4,.29-5.1,1.74-5.07,5.49.12,19.16,0,38.32,0,57.49,0,11.17,0,11.17-11,11.16h-21c-6.65,0-6.68,0-6.68-6.53q0-42.24,0-84.48v-109c0-6.67,0-6.69,6.48-6.7,15.5,0,31-.37,46.49.1,18.35.56,35.19,5.27,47.58,20.22,7,8.5,10.16,18.66,11.8,29.24,2.33,15.1,1.81,30.17-2.64,44.92-3.54,11.77-10.1,21.35-21,27.47-3.34,1.87-3.73,3.79-2.34,7.21,9.27,22.81,18.37,45.69,27.49,68.56,1,2.59,2.51,5,2.7,8.38-4.59,1.19-9.22.3-14.25.6m-30.94-160.83c-5.41-11.4-21.55-12.88-29.63-12.12-2.24.21-2.38,2.1-2.4,3.77-.24,19.15-.42,38.3-.66,57.45,0,2.91,1.1,4.37,4.18,4,3.63-.4,7.32-.46,10.9-1.12,9.16-1.68,16.18-6.3,18.88-15.67C1184.77,464.93,1185.11,453,1180.05,440.53Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M664,523.16c12.29,25.82,24.6,51.22,35.74,76.91-2,1.66-3.52,1.28-5,1.28-11.5,0-23-.09-34.49.08-3.48.05-5.33-1-6.74-4.37-7.39-17.47-15.06-34.83-22.62-52.22-.73-1.66-1.19-3.46-3.17-5.26-3.78,8.52-7.48,16.78-11.12,25.08q-7.22,16.47-14.34,33c-.8,1.85-1.41,3.73-4,3.72-12.81,0-25.61,0-38.22,0-1.2-2-.15-3.24.44-4.52,14.17-30.69,28.27-61.41,42.66-92,2-4.18,2-7.47.16-11.64-13.72-30.51-27.22-61.12-40.77-91.71-.65-1.48-1.16-3-1.63-4.3,1.13-1.83,2.58-1.48,3.84-1.5,12-.22,24-.1,36-.7,5.36-.27,7.61,1.85,9.4,6.54,5.69,14.92,11.8,29.69,17.78,44.5.74,1.83,1.64,3.6,2.64,5.77,2.44-1.8,3.06-4.27,3.94-6.48q9.21-23.21,18.28-46.46c.8-2.06,1.53-4.08,4.34-4.06,12.33.08,24.66.09,37,.17a6.22,6.22,0,0,1,1.82.59c.27,3-1.2,5.32-2.21,7.71C681,433,668,462.54,654.43,491.84c-2,4.3-2.29,7.86.14,12.14C658,510.05,660.75,516.53,664,523.16Z" transform="translate(-559.45 -392.26)"/><path class="cls-1" d="M1007.78,571.64c-1.62,8.89-3.11,17.39-4.6,25.88-.47,2.71-2,3.87-4.83,3.83q-14.75-.18-29.48,0c-3.74,0-4.45-1.53-3.72-5q9.2-43.34,18.16-86.69c7.46-35.89,15-71.76,22.25-107.69,1-4.78,2.67-6.57,7.73-6.43,12.81.38,25.64.27,38.46.05,4.06-.07,5.88,1.2,6.74,5.29,7.83,37.16,15.86,74.28,23.82,111.41q8.87,41.36,17.69,82.72c.38,1.76.6,3.56.93,5.55-2.62,1.35-5.3.77-7.87.79-8.82.07-17.65-.13-26.48.1-3.75.1-5.33-1.33-6-4.93-1.82-9.94-4.06-19.81-5.81-29.77-.59-3.4-2.18-4.44-5.34-4.42-11.83.07-23.65.1-35.48,0-6.74-.06-4.63,5.57-6.18,9.35m24.51-121.07c-1.37,0-.91,1.18-1,1.84q-4.5,24-8.91,48c-1.61,8.77-3.13,17.56-4.82,27.13,9.65,0,18.58.12,27.51-.08,2.39-.06,2.48-2,2.06-4.15C1042.2,499.21,1037.39,475.13,1032.29,450.57Z" transform="translate(-559.45 -392.26)"/></svg>`,
          }}
        ></div>
      </div>

      {/* Nav Buttons Container (Top Right) */}
      <div
        className="nav-container"
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "1rem",
          zIndex: 1000,
        }}
      >
        <div
          className="nav-buttons"
          style={{
            display: "flex",
            gap: "1rem",
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
                <button
                  className="logabutton"
                  style={{
                    top: "9px",
                    right: "43px",
                    zIndex: 1000,
                  }}
                >
                  <span>Dashboard</span>
                </button>
              </Link>
              <button onClick={logout} className="LogoutindtBtn">
                <div className="sign">
                  <svg viewBox="0 0 512 512">
                    <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
                  </svg>
                </div>
                <div className="text">Logout</div>
              </button>
            </>
          )}
        </div>
        <button
          id="postabutton"
          className="postabutton"
          onClick={handlePostCommunity}
          style={{
            position: "relative",
            width: "fit-content",
          }}
        >
          <span>Post your Community</span>
        </button>
      </div>

      {/* Main content container with padding for top elements */}
      <div style={{ paddingTop: "77px" }}>
        <div
          className="x-header"
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0px 0",
          }}
        >
          <span style={{ fontSize: "3rem", fontWeight: "bold" }}>
            Discover{" "}
          </span>
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
          <span style={{ fontSize: "3rem", fontWeight: "bold" }}>
            {" "}
            Communities
          </span>
        </div>

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
                    backgroundColor: isSelected
                      ? "#2a1711"
                      : "rgba(39, 39, 42, 0.5)",
                  }}
                  whileHover={{
                    backgroundColor: isSelected
                      ? "#2a1711"
                      : "rgba(39, 39, 42, 0.8)",
                  }}
                  whileTap={{
                    backgroundColor: isSelected
                      ? "#1f1209"
                      : "rgba(39, 39, 42, 0.9)",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5,
                  }}
                  className={`cuisine-chip ${
                    isSelected
                      ? "cuisine-chip-selected"
                      : "cuisine-chip-unselected"
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

        <div className="server-list">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>Error: {error}</p>
          ) : filteredCommunities.length === 0 ? (
            <p>No communities found.</p>
          ) : (
            currentServers.map((server) => (
              <div key={server.id} className="server-card">
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
                <h3>{server.name}</h3>
                <p>{server.description}</p>
                <div className="tags">
                  {server.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href={server.invite_link || server.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="join-link"
                >
                  Join
                </a>
              </div>
            ))
          )}
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="pagination" style={{ display: "flex", justifyContent: "center", marginTop: "2rem", gap: "0.5rem" }}>
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
