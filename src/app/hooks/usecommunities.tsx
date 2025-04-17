import { useState, useEffect } from "react";
import { useAuth } from "../hooks/AuthContext";

// ✅ Add long_description to the interface
export interface Community {
  id: number;
  name: string;
  description: string;
  long_description?: string; // NEW
  invite_link: string;
  image_url?: string;
  tags: string[];
  owner_id?: string;  // Track owner
}

export function useCommunities(userId?: string) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const url = userId 
          ? `/api/communities?userId=${userId}` 
          : `/api/communities`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch communities");
        }

        const data = await response.json();
        setCommunities(data); // ✅ The data already includes long_description if present
      } catch (err: any) {
        console.error("Error fetching communities:", err);
        setError(err.message || "Failed to load communities");
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, [userId]);

  return { communities, loading, error, setCommunities };
}
