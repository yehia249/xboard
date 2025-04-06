// src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useCommunities, Community } from "../hooks/usecommunities";
import { useAuth } from "../hooks/AuthContext";
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

// XCommunityForm component with toast integration
const XCommunityForm: React.FC<{
  onShowToast: (type: "success" | "error", title: string, description: string) => void;
}> = ({ onShowToast }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    communityURL: "",
    tags: [] as string[],
    description: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const remainingChars = 160 - formData.description.length;
  const remainingTags = MAX_TAGS - formData.tags.length;

  // Helper to fetch community data
  const fetchCommunityData = async (url: string) => {
    try {
      const res = await fetch("https://xboardscrape-production.up.railway.app/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityURL: url }),
      });
      const data = await res.json();
      return {
        imageUrl: data.imageUrl || null,
        communityName: data.communityName || null,
      };
    } catch (error) {
      console.error("Error fetching community data:", error);
      return { imageUrl: null, communityName: null };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > 160) {
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
      const newCommunity = {
        name: communityName,
        description: formData.description,
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
      if (!res.ok) throw new Error("Failed to add community");
      onShowToast("success", "Posted Successfully", "Community information submitted successfully!");
      setFormData({ communityURL: "", tags: [], description: "" });
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      onShowToast("error", "Please try again", "There was an error submitting your information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="x-community-form">
      <div className="form-header">
        <div>
          <h2>Share your X community with others</h2>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
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

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">
            Description <span className="char-counter">{remainingChars} characters remaining</span>
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

        {/* Submit Button */}
        <div className="form-submit">
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
      </form>
    </div>
  );
};

export default function DashboardPage() {
  const { communities, loading: communitiesLoading, error: communitiesError } = useCommunities();
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [toast, setToast] = useState<ToastData | null>(null);

  // EDIT FORM STATE
  const [editCommunityId, setEditCommunityId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // DELETE POPUP STATE
  const [deleteCommunityId, setDeleteCommunityId] = useState<number | null>(null);

  const showToast = (type: "success" | "error", title: string, description: string) => {
    setToast({ visible: true, type, title, description });
    setTimeout(() => setToast(null), 3000);
  };

  const closeToast = () => {
    setToast(null);
  };

  // DELETE LOGIC
  const showDeletePopup = (id: number) => {
    setDeleteCommunityId(id);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteCommunityId || !user) return;
    try {
      const res = await fetch(`/api/communities/${deleteCommunityId}?userId=${user.uid}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete community");
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
    setEditTags(server.tags || []);
    setEditTagInput("");
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

  const handleEditDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (value.length <= 160) {
      setEditDescription(value);
    }
  };

  const handleEditCommunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCommunityId || !user) return;
    setIsEditSubmitting(true);
    try {
      const res = await fetch(`/api/communities/${editCommunityId}?userId=${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editDescription,
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

  if (authLoading || communitiesLoading) return <p>Loading...</p>;
  if (!user) return null;
  if (communitiesError) return <p>Error: {communitiesError}</p>;

  return (
    <div className="dashboard-container">
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
                    <button onClick={() => openEditModal(server)} className="join-link">
                      Edit
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

      {/* EDIT FORM MODAL */}
      {editCommunityId && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <h2>Edit Community</h2>
            <form onSubmit={handleEditCommunitySubmit}>
              <div className="form-group">
                <label htmlFor="editDescription">
                  Description <span className="char-counter">{editRemainingChars} characters remaining</span>
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
              <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                <button type="submit" className="join-link" disabled={isEditSubmitting}>
                  {isEditSubmitting ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="delete-btn" onClick={() => setEditCommunityId(null)}>
                  Cancel
                </button>
              </div>
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
