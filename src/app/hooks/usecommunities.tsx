import { useState, useEffect } from "react";
import { useAuth } from "../hooks/AuthContext";

export interface Community {
  id: number;
  name: string;
  description: string;
  invite_link: string;
  image_url?: string;
  tags: string[];
  owner_id?: string;  // Track owner
}

export function useCommunities(userId?: string) {  // Accept userId (optional)
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        // If userId is provided, fetch user-owned communities
        const url = userId 
          ? `/api/communities?userId=${userId}` 
          : `/api/communities`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch communities");
        }

        const data = await response.json();
        setCommunities(data);
      } catch (err: any) {
        console.error("Error fetching communities:", err);
        setError(err.message || "Failed to load communities");
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, [userId]);  // Depend on userId to differentiate between public & private fetches

  return { communities, loading, error, setCommunities };
}
