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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const remainingChars = 160 - formData.description.length;
  const remainingLongDescChars = 1800 - formData.long_description.length;
  const remainingTags = MAX_TAGS - formData.tags.length;

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
    if (name === "description" && value.length > 160) {
      return;
    }
    if (name === "long_description" && value.length > 1800) {
      return;
    }
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
    if (tag && !formData.tags.includes(tag)) {
      if (formData.tags.length >= MAX_TAGS) {
        onShowToast(
          "error", 
          "Tag limit reached", 
          `You can only add up to ${MAX_TAGS} tags per community.`
        );
        return;
      }
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagInputBlur = () => {
    if (tagInput.trim()) {
      addTag(tagInput.trim());
    }
  };

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
          onShowToast(
            "error",
            "Duplicate Community",
            "This X community is already listed. Please check before posting again."
          );
        } else {
          onShowToast(
            "error",
            "Please try again",
            errorData.error || "There was an error submitting your information."
          );
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
                  placeholder="Type tags and press Enter, comma, or space to add"
                  disabled={formData.tags.length >= MAX_TAGS}
                />
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
                        <circle
                          className="spinner-track"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
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


// Dashboard content component
function DashboardContent() {
const { communities, loading: communitiesLoading, error: communitiesError } = useCommunities({ perPage: 500 });
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [toast, setToast] = useState<ToastData | null>(null);

  // EDIT FORM STATE
  const [editCommunityId, setEditCommunityId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editLongDescription, setEditLongDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormStep, setEditFormStep] = useState(1);

  // DELETE POPUP STATE
  const [deleteCommunityId, setDeleteCommunityId] = useState<number | null>(null);

  // SHARE MODAL STATE
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const showToast = (type: "success" | "error", title: string, description: string) => {
    setToast({ visible: true, type, title, description });
    setTimeout(() => setToast(null), 3000);
  };

  const closeToast = () => {
    setToast(null);
  };

  // SHARE LOGIC
  const openShareModal = (community: Community) => {
    setSelectedCommunity(community);
    setShareModalOpen(true);
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setSelectedCommunity(null);
  };

  // DELETE LOGIC
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
    if (tag && !editTags.includes(tag)) {
      if (editTags.length >= MAX_TAGS) {
        showToast(
          "error", 
          "Tag limit reached", 
          `You can only add up to ${MAX_TAGS} tags per community.`
        );
        return;
      }
      setEditTags((prev) => [...prev, tag]);
      setEditTagInput("");
    }
  };

  const removeEditTag = (tagToRemove: string) => {
    setEditTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleEditTagBlur = () => {
    if (editTagInput.trim()) {
      addEditTag(editTagInput.trim());
    }
  };

  const editRemainingTags = MAX_TAGS - editTags.length;
  const editRemainingChars = 160 - editDescription.length;
  const editRemainingLongDescChars = 1800 - editLongDescription.length;

  const handleEditDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (value.length <= 160) {
      setEditDescription(value);
    }
  };

  const handleEditLongDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (value.length <= 1800) {
      setEditLongDescription(value);
    }
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
    }
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

  if (authLoading || communitiesLoading) return null;
  if (!user) return null;
  if (communitiesError) return <p>Error: {communitiesError}</p>;

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
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" ,WebkitTapHighlightColor: "transparent" }}>
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
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <h2 style={{ display: "inline-block", borderBottom: "3px solid #0070f3", paddingBottom: "5px" }}>Dashboard</h2>
      </div>
      
      <div className="dashboard-buttons">
        <Link href="/" className="homeBtn" passHref>
        <div className="sign">
            <svg viewBox="0 0 576 512">
            <path d="M280.4 148.3L96 300.1V464c0 8.8 7.2 16 16 16l112-.3c8.8 0 16-7.2 16-16V368c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16v95.6c0 8.8 7.2 16 16 16l112 .3c8.8 0 16-7.2 16-16V300L295.7 148.3c-8.6-7-21-7-29.6 0zM571.6 251.5L488 182.6V44c0-6.6-5.4-12-12-12h-56c-6.6 0-12 5.4-12 12v72.6L318.5 43c-18.9-15.5-46.1-15.5-65 0L4.3 251.5c-5.1 4.2-5.8 11.7-1.6 16.8l25.5 30.5c4.2 5.1 11.7 5.8 16.8 1.6L64 278.6V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V278.6l19 21.9c4.2 4.2 11.7 3.6 15.9-1.5l25.5-30.5c4.2-5.1 3.5-12.6-1.6-16.8z"/>
            </svg>
          </div>
          <div className="text">Home</div>
        </Link>
        <button onClick={logout} className="LogoutBtn">
          <div className="sign">
            <svg viewBox="0 0 512 512">
              <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
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
                      placeholder="Type tags and press Enter, comma, or space to add"
                      disabled={editTags.length >= MAX_TAGS}
                    />
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