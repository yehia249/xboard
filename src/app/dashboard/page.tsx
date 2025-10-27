// src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useCommunities, Community } from "../hooks/usecommunities";
import { useAuth } from "../hooks/AuthContext";
import { useLayoutEffect } from "react";
import "@/app/all.css";
import "@/app/community.css";
import "@/app/form.css";
import "@/app/toastAlerts.css";

// Define the shape of a toast message
interface ToastData {
  visible: boolean;
  type: "success" | "error";
  title: string;
  description: string;
}

// Suggested tags (compact, curated)
const SUGGESTED_TAGS: string[] = [
  "Crypto","Memes","Fitness","Hangout","Gaming","Education","Football","Politics",
  "Tech","Sports","Celebrities","AI","Finance","Art","Dating","Anime","NSFW",
  "Music","Social","Lifestyle",
];

// Validate that the URL is exclusively an X community URL
const isValidXCommunityURL = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== "x.com") return false;
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    if (pathParts.length !== 3) return false;
    if (pathParts[0] !== "i" || pathParts[1] !== "communities") return false;
    if (!pathParts[2]) return false;
    return true;
  } catch (err) {
    return false;
  }
};

const MAX_TAGS = 5;

// Share Modal Component
const ShareModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  community: Community;
}> = ({ isOpen, onClose, community }) => {
  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/community/${community.id}`;
  const shareText = `Support this community by promoting it!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    const copyText = document.getElementById("copyText");
    const copyIcon = document.getElementById("copyIcon");
    const checkIcon = document.getElementById("checkIcon");
    if (copyText) copyText.innerText = "Copied";
    if (copyIcon) copyIcon.style.display = "none";
    if (checkIcon) checkIcon.style.display = "inline";
    setTimeout(() => {
      if (copyText) copyText.innerText = "Copy";
      if (copyIcon) copyIcon.style.display = "inline";
      if (checkIcon) checkIcon.style.display = "none";
    }, 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1A1D23",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ color: "white", margin: 0 }}>Share Community</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9CA3AF",
              fontSize: "1.5rem",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ color: "#9CA3AF", fontSize: "1rem" }}>Encourage others to promote this community!</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
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
                textDecoration: "none",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24" fill="white">
                <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5549 21H20.7996L13.6818 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
              </svg>
            </a>
            <div style={{ fontSize: "0.9rem", marginTop: "0.5rem", color: "#9CA3AF" }}>X</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
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
                textDecoration: "none",
              }}
            >
              <img
                src="https://www.facebook.com/images/fb_icon_325x325.png"
                alt="Facebook logo"
                style={{ width: "48px", height: "48px", borderRadius: "4px" }}
              />
            </a>
            <div style={{ fontSize: "0.9rem", marginTop: "0.5rem", color: "#9CA3AF" }}>Facebook</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <a
              href={`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent("Support this community by sharing it.")}`}
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
                textDecoration: "none",
              }}
            >
              <img
                src="https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png"
                alt="Reddit logo"
                style={{ width: "48px", height: "48px", borderRadius: "4px" }}
              />
            </a>
            <div style={{ fontSize: "0.9rem", marginTop: "0.5rem", color: "#9CA3AF" }}>Reddit</div>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #3A3E44",
            borderRadius: "0.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
            background: "#2A2E33",
          }}
        >
          <div style={{ color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.9rem" }}>
            {shareUrl}
          </div>
          <button
            onClick={handleCopyLink}
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
              fontSize: "0.9rem",
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
    </div>
  );
};

// XCommunityForm component with toast integration and complete form steps
const XCommunityForm: React.FC<{
  onShowToast: (type: "success" | "error", title: string, description: string) => void;
}> = ({ onShowToast }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    communityURL: "",
    tags: [] as string[],
    description: "",
    long_description: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [tagFocus, setTagFocus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const remainingChars = 160 - formData.description.length;
  const remainingLongDescChars = 1800 - formData.long_description.length;
  const remainingTags = MAX_TAGS - formData.tags.length;

  const norm = (s: string) => s.trim().toLowerCase();
  const inCurrentTags = (t: string) => formData.tags.map(norm).includes(norm(t));

  // Helper to fetch community data
  const fetchCommunityData = async (url: string) => {
    try {
      const backendBaseUrl = "https://xboardscrape-production.up.railway.app";
      const res = await fetch(`${backendBaseUrl}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityURL: url }),
      });
      const data = await res.json();

      // Prepend base URL if imageUrl is relative
      const fullImageUrl = data.imageUrl?.startsWith("/images/")
        ? `${backendBaseUrl}${data.imageUrl}`
        : data.imageUrl || null;

      return {
        imageUrl: fullImageUrl,
        communityName: data.communityName || null,
      };
    } catch (error) {
      console.error("Error fetching community data:", error);
      return { imageUrl: null, communityName: null };
    }
  };

  // Handle changes for both description and long_description with their respective limits
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > 160) return;
    if (name === "long_description" && value.length > 1800) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "," || e.key === " ") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim().replace(",", "").replace(" ", ""));
    }
  };

  const addTag = (tag: string) => {
    if (!tag) return;
    if (formData.tags.length >= MAX_TAGS) {
      onShowToast("error", "Tag limit reached", `You can only add up to ${MAX_TAGS} tags per community.`);
      return;
    }
    // prevent duplicates case-insensitively
    if (inCurrentTags(tag)) return;
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => norm(tag) !== norm(tagToRemove)),
    }));
  };

  const handleTagInputBlur = () => {
    if (tagInput.trim()) addTag(tagInput.trim());
    setTagFocus(false);
  };

  const handleTagInputFocus = () => setTagFocus(true);

  // Filter suggestions by input and remove already-selected ones
  const filteredSuggestions = SUGGESTED_TAGS
    .filter((t) => !inCurrentTags(t))
    .filter((t) => (tagInput ? norm(t).includes(norm(tagInput)) : true))
    .slice(0, 12);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onShowToast("error", "Please try again", "User not authenticated.");
      return;
    }
    if (!isValidXCommunityURL(formData.communityURL)) {
      onShowToast(
        "error",
        "Invalid URL",
        "The provided URL is not a valid X community URL. Please ensure it starts with https://x.com/i/communities/ and is formatted correctly."
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const { imageUrl, communityName } = await fetchCommunityData(formData.communityURL);
      if (!communityName) {
        onShowToast(
          "error",
          "Community Not Found",
          "We could not retrieve the community name from the provided URL. Please check the URL and try again."
        );
        setIsSubmitting(false);
        return;
      }
      // if long_description is empty, default it to description
      const newLongDesc = formData.long_description.trim() ? formData.long_description : formData.description;
      const newCommunity = {
        name: communityName,
        description: formData.description,
        long_description: newLongDesc,
        communityURL: formData.communityURL,
        tags: formData.tags,
        imageUrl,
        userId: user.uid,
      };
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCommunity),
      });
      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          onShowToast("error", "Duplicate Community", "This X community is already listed. Please check before posting again.");
        } else {
          onShowToast("error", "Please try again", errorData.error || "There was an error submitting your information.");
        }
        setIsSubmitting(false);
        return;
      }

      onShowToast("success", "Posted Successfully", "Community information submitted successfully!");
      // reset the form and go back to step 1
      setFormData({
        communityURL: "",
        tags: [],
        description: "",
        long_description: "",
      });
      setFormStep(1);
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      onShowToast("error", "Please try again", "There was an error submitting your information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="x-community-form dark-mode">
      <div className="form-header">
        <div>
          <h2>Share your X community with others</h2>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-step-container slide-animation">
          {formStep === 1 && (
            <div className="form-step active">
              {/* Community URL */}
              <div className="form-group">
                <label htmlFor="communityURL">Community URL</label>
                <div className="input-with-icon">
                  <div className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    id="communityURL"
                    name="communityURL"
                    value={formData.communityURL}
                    onChange={handleChange}
                    placeholder="https://x.com/i/communities/123456789"
                    required
                  />
                </div>
                <p className="input-help">Enter the full URL to your X community page</p>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label htmlFor="tagInput">
                  Tags <span className="tag-counter">{remainingTags} of {MAX_TAGS} tags remaining</span>
                </label>

                <div className={`tags-container ${formData.tags.length > 0 ? "has-tags" : ""}`}>
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag-pill">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="tag-remove">
                        <svg className="tag-remove-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>

                <input
                  type="text"
                  id="tagInput"
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  onBlur={handleTagInputBlur}
                  onFocus={handleTagInputFocus}
                  placeholder="Type tags and press Enter, comma, or space to add"
                  disabled={formData.tags.length >= MAX_TAGS}
                />

                {/* Suggested chips — sleek & compact */}
                {formData.tags.length < MAX_TAGS && filteredSuggestions.length > 0 && (
                  <div
                    aria-label="Tag suggestions"
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      maxHeight: "88px",
                      overflowY: "auto",
                      padding: "6px",
                      borderRadius: "10px",
                      background: "#121418",
                      border: "1px solid #1f2430",
                    }}
                  >
                    {filteredSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addTag(sug)}
                        title={`Add "${sug}"`}
                        style={{
                          background: "#121418",
                          color: "#d1d5db",
                          border: "1px solid #2a2f36",
                          borderRadius: "999px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          cursor: "pointer",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                )}

                <p className="input-help">
                  Add up to {MAX_TAGS} tags and press Enter, comma, or space to confirm each one
                </p>
              </div>

              <div className="form-submit">
                <button type="button" onClick={() => setFormStep(2)}>
                  Next
                </button>
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="form-step active">
              {/* Description */}
              <div className="form-group">
                <label htmlFor="description">
                  Card Description <span className="char-counter">{remainingChars} characters remaining</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={160}
                  placeholder="Tell us what your community is about..."
                  required
                ></textarea>
                <p className="input-help">Briefly describe your community in 160 characters or less</p>
              </div>

              {/* Long Description */}
              <div className="form-group">
                <label htmlFor="long_description">
                  Long Description (Optional)   <span className="char-counter">{remainingLongDescChars} characters remaining</span>
                </label>
                <textarea
                  id="long_description"
                  name="long_description"
                  value={formData.long_description}
                  onChange={handleChange}
                  rows={8}
                  maxLength={1800}
                  placeholder="Enter a more detailed description.  (Optional)"
                ></textarea>
                <p className="input-help">You may leave this empty if you want, The card description will be used.</p>
              </div>

              <div className="form-submit">
                <button type="button" onClick={() => setFormStep(1)}>Back</button>
                <button type="submit" disabled={isSubmitting} className={isSubmitting ? "submitting" : ""}>
                  {isSubmitting ? (
                    <span className="submit-loading">
                      <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="spinner-path"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Submit Community"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

// Types for PayNow subscriptions UI
type PayNowSub = {
  id: string;
  status?: string;
  current_period_end?: string;
  expires_at?: string;
  period?: { end?: string };
  product?: { name?: string; metadata?: Record<string, any> };
  plan?: { name?: string; metadata?: Record<string, any> };
  metadata?: Record<string, any>;
};

// Dashboard content component
function DashboardContent() {
  const { communities, loading: communitiesLoading, error: communitiesError } = useCommunities({ perPage: 500 });
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [toast, setToast] = useState<ToastData | null>(null);

  // ======== Manage Subscriptions state ========
  const [hasPayNowAccount, setHasPayNowAccount] = useState<boolean>(false);
  const [subsLoading, setSubsLoading] = useState<boolean>(false);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<PayNowSub[]>([]);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Small preview / expand state
  const [subsOpen, setSubsOpen] = useState<boolean>(false);

  const showToast = (type: "success" | "error", title: string, description: string) => {
    setToast({ visible: true, type, title, description });
    setTimeout(() => setToast(null), 3000);
  };

  const closeToast = () => {
    setToast(null);
  };

  // SHARE MODAL STATE
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const openShareModal = (community: Community) => {
    setSelectedCommunity(community);
    setShareModalOpen(true);
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setSelectedCommunity(null);
  };

  // DELETE POPUP STATE
  const [deleteCommunityId, setDeleteCommunityId] = useState<number | null>(null);

  const showDeletePopup = (id: number) => {
    setDeleteCommunityId(id);
  };

  useLayoutEffect(() => {
    const key = "refreshed-login-page";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "true");
      window.location.replace(window.location.href);
    }
    return () => sessionStorage.removeItem(key);
  }, []);

  const handleDeleteConfirmed = async () => {
    if (!deleteCommunityId || !user) return;
    try {
      const res = await fetch(`/api/communities/${deleteCommunityId}?userId=${user.uid}`, {
        method: "DELETE",
      });

      const errorData = await res.json();

      if (!res.ok) {
        // ✅ Check if it's the tier error specifically
        if (errorData.tierError) {
          showToast(
            "error",
            "Cannot Delete Community",
            "This community is currently subscribed to a tier. Please wait for it to return to normal to delete."
          );
        } else {
          // Handle other errors
          showToast(
            "error",
            "Please try again",
            errorData.error || "Failed to delete community"
          );
        }
        return;
      }

      showToast("success", "Done successfully", "Community deleted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting community:", error);
      showToast("error", "Please try again", "Error deleting community");
    } finally {
      setDeleteCommunityId(null);
    }
  };

  // EDIT FORM STATE
  const [editCommunityId, setEditCommunityId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editLongDescription, setEditLongDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editTagFocus, setEditTagFocus] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormStep, setEditFormStep] = useState(1);

  const norm = (s: string) => s.trim().toLowerCase();
  const editHasTag = (t: string) => editTags.map(norm).includes(norm(t));

  // EDIT LOGIC
  const openEditModal = (server: Community) => {
    setEditCommunityId(server.id);
    setEditDescription(server.description);
    setEditLongDescription(server.long_description || "");
    setEditTags(server.tags || []);
    setEditTagInput("");
    setEditFormStep(1);
  };

  const handleEditTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTagInput(e.target.value);
  };

  const handleEditTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "," || e.key === " ") && editTagInput.trim()) {
      e.preventDefault();
      addEditTag(editTagInput.trim().replace(",", "").replace(" ", ""));
    }
  };

  const addEditTag = (tag: string) => {
    if (!tag) return;
    if (editTags.length >= MAX_TAGS) {
      showToast("error", "Tag limit reached", `You can only add up to ${MAX_TAGS} tags per community.`);
      return;
    }
    if (editHasTag(tag)) return;
    setEditTags((prev) => [...prev, tag]);
    setEditTagInput("");
  };

  const removeEditTag = (tagToRemove: string) => {
    setEditTags((prev) => prev.filter((tag) => norm(tag) !== norm(tagToRemove)));
  };

  const handleEditTagBlur = () => {
    if (editTagInput.trim()) addEditTag(editTagInput.trim());
    setEditTagFocus(false);
  };

  const handleEditTagFocus = () => setEditTagFocus(true);

  const editRemainingTags = MAX_TAGS - editTags.length;
  const editRemainingChars = 160 - editDescription.length;
  const editRemainingLongDescChars = 1800 - editLongDescription.length;

  const handleEditDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (value.length <= 160) setEditDescription(value);
  };

  const handleEditLongDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (value.length <= 1800) setEditLongDescription(value);
  };

  const handleEditCommunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCommunityId || !user) return;
    setIsEditSubmitting(true);
    try {
      // if long description is empty, default to card description
      const updatedLongDescription = editLongDescription.trim() ? editLongDescription : editDescription;
      const res = await fetch(`/api/communities/${editCommunityId}?userId=${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editDescription,
          long_description: updatedLongDescription,
          tags: editTags,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update community");
      }
      showToast("success", "Updated Successfully", "Community updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error updating community:", error);
      showToast("error", "Please try again", "Error updating community");
    } finally {
      setIsEditSubmitting(false);
      setEditCommunityId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && user === null) {
      router.push("/");
    }
    if (user) {
      fetchUserDetails();
      // Load subscriptions for Manage Subscriptions panel
      loadSubscriptions(user.uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const [showHeader, setShowHeader] = useState(true);

  const fetchUserDetails = async () => {
    try {
      const res = await fetch(`/api/user/${user?.uid}`);
      if (res.ok) {
        const userData = await res.json();
        setUserName(user?.displayName || userData.name || user?.email?.split("@")[0] || "User");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUserName(user?.email?.split("@")[0] || "User");
    }
  };

  // ======== Manage Subscriptions helpers ========
  const loadSubscriptions = async (uid: string) => {
    try {
      setSubsLoading(true);
      setSubsError(null);
      const resp = await fetch(`/api/paynow/subscriptions?userUid=${encodeURIComponent(uid)}`);
      const data = await resp.json();
      if (!resp.ok) {
        setHasPayNowAccount(false);
        setSubscriptions([]);
        throw new Error(data?.error || "Failed to fetch subscriptions");
      }
      setHasPayNowAccount(Boolean(data?.hasAccount));
      setSubscriptions(Array.isArray(data?.subscriptions) ? data.subscriptions : []);
    } catch (e: any) {
      setSubsError(e?.message || "Error loading subscriptions");
    } finally {
      setSubsLoading(false);
    }
  };

  const prettyDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const inferTier = (sub: PayNowSub) => {
    // Try product/plan metadata.tier else fallback to names
    const metaTier =
      sub?.product?.metadata?.tier ||
      sub?.plan?.metadata?.tier ||
      sub?.metadata?.tier ||
      "";
    if (metaTier) return String(metaTier);
    const nameGuess = sub?.product?.name || sub?.plan?.name || "";
    if (/gold/i.test(nameGuess)) return "gold";
    if (/silver/i.test(nameGuess)) return "silver";
    return "—";
  };

  const subPeriodEnd = (sub: PayNowSub) =>
    sub?.current_period_end || sub?.expires_at || sub?.period?.end || "";

  const cancelSubscription = async (id: string) => {
    if (!user) return;
    try {
      setCancelingId(id);
      const resp = await fetch(`/api/paynow/subscriptions/${encodeURIComponent(id)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUid: user.uid }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showToast("error", "Cancel failed", data?.error || "Unable to cancel subscription");
        return;
      }
      showToast("success", "Subscription canceled", "Your subscription will remain active until the period end.");
      // Refresh list
      await loadSubscriptions(user.uid);
    } catch (e: any) {
      showToast("error", "Cancel error", e?.message || "Something went wrong");
    } finally {
      setCancelingId(null);
    }
  };

  if (authLoading || communitiesLoading) return null;
  if (!user) return null;
  if (communitiesError) return <p>Error: {communitiesError}</p>;

  // Suggestions for EDIT form
  const editFilteredSuggestions = SUGGESTED_TAGS
    .filter((t) => !editHasTag(t))
    .filter((t) => (editTagInput ? norm(t).includes(norm(editTagInput)) : true))
    .slice(0, 12);

  return (
    <div className="dashboard-container">
      {/* Sticky Header */}
      <header
        style={{
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
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", WebkitTapHighlightColor: "transparent" }}>
        </Link>
      </header>

      {/* Toast Alert */}
      {toast && toast.visible && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "success" ? (
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" />
                  <path d="M10 14l6-6-1.4-1.4L10 11.2 8.4 9.6 7 11l3 3z" fill="#fff" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" />
                  <path d="M13 7h-2v6h2zm0 8h-2v2h2z" fill="#fff" />
                </svg>
              )}
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-description">{toast.description}</div>
            </div>
            <button className="toast-close" onClick={closeToast}>
              X
            </button>
          </div>
        </div>
      )}

      {/* ========= Manage Subscriptions (FLOATING preview + expandable panel) ========= */}
      {subscriptions.length > 0 && (
        <div
          aria-label="Manage subscriptions"
          style={{
            position: "fixed",
            top: "94px",
            left: "12px",
            zIndex: 900,
            pointerEvents: "auto",
          }}
        >
          {/* Collapsed preview pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#0b0b0b",
              border: "1px solid #222",
              padding: "8px 10px",
              borderRadius: 12,
              boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              width: "fit-content",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 600 }}>
              Subscriptions
            </span>
            <span style={{ color: "#9ca3af", fontSize: 12 }}>
              {subsLoading ? "…" : `${subscriptions.length}`}
            </span>
            <button
              onClick={() => setSubsOpen((s) => !s)}
              aria-label={subsOpen ? "Collapse" : "Expand"}
              title={subsOpen ? "Hide" : "Show"}
              style={{
                background: "#111418",
                border: "1px solid #2a2f36",
                color: "#d1d5db",
                width: 26,
                height: 26,
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: subsOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease",
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          {/* Expanded panel */}
          {subsOpen && (
            <div
              style={{
                marginTop: 10,
                width: "min(92vw, 420px)",
                background: "#0b0b0b",
                border: "1px solid #222",
                borderRadius: 14,
                padding: 12,
                boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
                maxHeight: "65vh",
                overflow: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <h3 style={{ margin: 0, color: "#e5e7eb", fontSize: "1.05rem" }}>Your subscriptions</h3>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => user && loadSubscriptions(user.uid)}
                    style={{
                      background: "transparent",
                      border: "1px solid #333",
                      color: "#9ca3af",
                      padding: "6px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13
                    }}
                    title="Refresh"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => setSubsOpen(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid #333",
                      color: "#9ca3af",
                      padding: "6px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13
                    }}
                    title="Hide"
                  >
                    Hide
                  </button>
                </div>
              </div>

              {subsLoading ? (
                <div style={{ color: "#9ca3af", fontSize: 14 }}>Loading subscriptions…</div>
              ) : subsError ? (
                <div style={{ color: "#ef4444", fontSize: 14 }}>{subsError}</div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {subscriptions.map((sub) => {
                    const tier = inferTier(sub);
                    const periodEnd = subPeriodEnd(sub);
                    const status = (sub.status || "").toLowerCase();
                    const isCanceled = status === "canceled" || status === "cancelled";
                    return (
                      <li
                        key={sub.id}
                        style={{
                          border: "1px solid #1f2937",
                          borderRadius: 10,
                          padding: "10px 12px",
                          background: "#0f1115",
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 600 }}>
                            {sub.product?.name || sub.plan?.name || `Subscription ${sub.id}`}
                          </div>
                          <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                            Tier: <span style={{ color: "#d1d5db" }}>{tier}</span> • Status:{" "}
                            <span style={{ color: isCanceled ? "#f87171" : "#86efac" }}>{status || "—"}</span>
                          </div>
                          <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                            Period end: <span style={{ color: "#d1d5db" }}>{prettyDate(periodEnd)}</span>
                          </div>
                          <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2, wordBreak: "break-all" }}>
                            ID: {sub.id}
                          </div>
                        </div>

                        <div>
                          <button
                            disabled={isCanceled || cancelingId === sub.id}
                            onClick={() => cancelSubscription(sub.id)}
                            style={{
                              background: isCanceled ? "#111827" : "#1f2937",
                              border: "1px solid #374151",
                              color: isCanceled ? "#6b7280" : "#e5e7eb",
                              padding: "8px 12px",
                              borderRadius: 8,
                              cursor: isCanceled ? "not-allowed" : "pointer",
                              fontSize: 13,
                              minWidth: 98
                            }}
                            title={isCanceled ? "Already canceled" : "Cancel subscription"}
                          >
                            {cancelingId === sub.id ? "Canceling..." : isCanceled ? "Canceled" : "Cancel"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div style={{ marginTop: 8, color: "#6b7280", fontSize: 11 }}>
                Note: When you cancel, your benefits remain until the period end.
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <h2 style={{ display: "inline-block", borderBottom: "3px solid #0070f3", paddingBottom: "5px" }}>Dashboard</h2>
      </div>

      <div className="dashboard-buttons">
        <button onClick={logout} className="LogoutBtn">
          <div className="sign">
            <svg viewBox="0 0 512 512">
              <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32z" />
            </svg>
          </div>
          <div className="text">Logout</div>
        </button>
      </div>

      <div className="community-form-container">
        <XCommunityForm onShowToast={showToast} />
      </div>

      <div className="communities-section">
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <h2 style={{ display: "inline-block", borderBottom: "3px solid #0070f3", paddingBottom: "5px" }}>Your Communities</h2>
        </div>
        <div className="communities-grid">
          {communities.length === 0 ? (
            <p>No communities found. Add your first community!</p>
          ) : (
            communities
              .filter((server) => server.owner_id === user?.uid)
              .map((server: Community) => (
                <div key={server.id} className="server-card">
                  {server.image_url && (
                    <img src={server.image_url} alt={server.name} className="community-image" />
                  )}
                  <h3>{server.name}</h3>
                  <p>{server.description}</p>
                  <div className="tags">
                    {server.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button onClick={() => openEditModal(server)} className="edit-btn">
                      Edit
                    </button>
                    {/* Share button in top right corner */}
                    <button
                      onClick={() => openShareModal(server)}
                      className="share-btn-top-right"
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "black",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                        zIndex: 10,
                        fontSize: "14px",
                        fontWeight: "500"
                      }}
                      title="Share"
                    >
                      Share
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                        <polyline points="16,6 12,2 8,6"/>
                        <line x1="12" y1="2" x2="12" y2="15"/>
                      </svg>
                    </button>

                    <button onClick={() => showDeletePopup(server.id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {shareModalOpen && selectedCommunity && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={closeShareModal}
          community={selectedCommunity}
        />
      )}

      {/* EDIT FORM MODAL */}
      {editCommunityId && (
        <div className="edit-modal-overlay">
          <div className="edit-modal dark-mode slide-animation">
            <h2>Edit Community</h2>
            <form onSubmit={handleEditCommunitySubmit}>
              {editFormStep === 1 && (
                <div className="form-step active">
                  <div className="form-group">
                    <label htmlFor="editDescription">
                      Card Description <span className="char-counter">{editRemainingChars} characters remaining</span>
                    </label>
                    <textarea
                      id="editDescription"
                      value={editDescription}
                      onChange={handleEditDescriptionChange}
                      maxLength={160}
                      rows={4}
                      required
                    />
                    <p className="input-help">Briefly describe your community in 160 characters or less</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editTagInput">
                      Tags <span className="tag-counter">{editRemainingTags} of {MAX_TAGS} tags remaining</span>
                    </label>

                    <div className="tags-container">
                      {editTags.map((tag, index) => (
                        <span key={index} className="tag-pill">
                          {tag}
                          <button type="button" onClick={() => removeEditTag(tag)} className="tag-remove">
                            <svg className="tag-remove-icon" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>

                    <input
                      type="text"
                      id="editTagInput"
                      value={editTagInput}
                      onChange={handleEditTagInputChange}
                      onKeyDown={handleEditTagKeyDown}
                      onBlur={handleEditTagBlur}
                      onFocus={handleEditTagFocus}
                      placeholder="Type tags and press Enter, comma, or space to add"
                      disabled={editTags.length >= MAX_TAGS}
                    />

                    {/* Suggested chips for EDIT */}
                    {editTags.length < MAX_TAGS && editFilteredSuggestions.length > 0 && (
                      <div
                        aria-label="Tag suggestions"
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          maxHeight: "88px",
                          overflowY: "auto",
                          padding: "6px",
                          borderRadius: "10px",
                          background: "#0e1116",
                          border: "1px solid #1f2430",
                        }}
                      >
                        {editFilteredSuggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => addEditTag(sug)}
                            title={`Add "${sug}"`}
                            style={{
                              background: "#12161e",
                              color: "#d1d5db",
                              border: "1px solid #2a2f36",
                              borderRadius: "999px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              cursor: "pointer",
                              lineHeight: 1,
                              whiteSpace: "nowrap",
                            }}
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="input-help">Add up to {MAX_TAGS} tags per community</p>
                  </div>

                  <div className="form-submit">
                    <button type="button" onClick={() => setEditFormStep(2)}>Next</button>
                    <button type="button" className="delete-btn" onClick={() => setEditCommunityId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {editFormStep === 2 && (
                <div className="form-step active">
                  <div className="form-group">
                    <label htmlFor="editLongDescription">
                      Long Description (Optional) <span className="char-counter">{editRemainingLongDescChars} characters remaining</span>
                    </label>
                    <textarea
                      id="editLongDescription"
                      value={editLongDescription}
                      onChange={handleEditLongDescriptionChange}
                      rows={8}
                      maxLength={1800}
                      placeholder="Enter a more detailed description (up to 1800 characters). If left blank, the card description will be used."
                    />
                    <p className="input-help">You may leave this empty if you want the card description to be used.</p>
                  </div>
                  <div className="form-submit">
                    <button type="button" onClick={() => setEditFormStep(1)}>Back</button>
                    <button type="submit" disabled={isEditSubmitting} className={isEditSubmitting ? "submitting" : ""}>
                      {isEditSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteCommunityId && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Are you sure you want to delete this community?</h3>
            <p>This action cannot be undone.</p>
            <div className="delete-modal-buttons">
              <button className="confirm-btn" onClick={handleDeleteConfirmed}>
                Yes, Delete
              </button>
              <button className="cancel-btn" onClick={() => setDeleteCommunityId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Main dashboard page with Suspense wrapper
export default function DashboardPage() {
  return (
    <Suspense fallback={<div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
