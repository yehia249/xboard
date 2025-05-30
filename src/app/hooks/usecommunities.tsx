"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Interface for API response
interface CommunityResponse {
  communities: Community[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
}


export interface Community {
  id: number;
  name: string;
  description: string;
  long_description?: string;
  invite_link: string;
  image_url?: string;
  tags: string[];
  owner_id?: string;
  tier?: "gold" | "silver" | "normal";
  members?: number;
  promote_count: number;
}

export function useCommunities(initialParams?: {
  userId?: string;
  q?: string;
  tags?: string[];
  page?: number;
  perPage?: number;
}) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const searchParamsObj = useSearchParams();
  
  // New state to track the current search parameters
  const [searchParams, setSearchParams] = useState({
    userId: initialParams?.userId || "",
    q: initialParams?.q || searchParamsObj.get("q") || "",
    tags: initialParams?.tags || 
          (searchParamsObj.get("tags") ? searchParamsObj.get("tags")!.split(",") : []),
    page: initialParams?.page || parseInt(searchParamsObj.get("page") || "1"),
    perPage: initialParams?.perPage || 24
  });
  
  // Function to update search parameters
  const updateSearchParams = (newParams: Partial<typeof searchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams
    }));
  };

  useEffect(() => {
    async function fetchCommunities() {
      try {
        setLoading(true);
        
        // Build the query string
        const queryParams = new URLSearchParams();
        
        if (searchParams.userId) queryParams.append("userId", searchParams.userId);
        if (searchParams.q) queryParams.append("q", searchParams.q);
        if (searchParams.tags.length > 0) queryParams.append("tags", searchParams.tags.join(','));
        queryParams.append("page", searchParams.page.toString());
        queryParams.append("perPage", searchParams.perPage.toString());
        
        const url = `/api/communities?${queryParams.toString()}`;
        
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch communities");
        }

        const data: CommunityResponse = await response.json();
        
        setCommunities(data.communities);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } catch (err: any) {
        console.error("Error fetching communities:", err);
        setError(err.message || "Failed to load communities");
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, [searchParams]);

  return { 
    communities, 
    loading, 
    error, 
    setCommunities,
    totalPages,
    totalCount,
    currentPage: searchParams.page,
    searchParams,
    updateSearchParams
  };
}