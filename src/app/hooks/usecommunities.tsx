import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Interface for API response (union-normalized below)
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
  // NEW controls:
  respectURL?: boolean;                  // default true
  endpoint?: "communities" | "search";   // default "communities"
}) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const searchParamsObj = useSearchParams();
  const respectURL = initialParams?.respectURL ?? true;
  const endpoint = initialParams?.endpoint ?? "communities";

  // Track current search parameters
  const [searchParams, setSearchParams] = useState({
    userId: initialParams?.userId || "",
    q: respectURL
      ? (initialParams?.q || searchParamsObj.get("q") || "")
      : (initialParams?.q || ""),
    tags: respectURL
      ? (initialParams?.tags ||
          (searchParamsObj.get("tags")
            ? searchParamsObj.get("tags")!.split(",")
            : []))
      : (initialParams?.tags || []),
    page: respectURL
      ? (initialParams?.page || parseInt(searchParamsObj.get("page") || "1"))
      : (initialParams?.page || 1),
    perPage: initialParams?.perPage || 24,
  });

  // Update search parameters
  const updateSearchParams = (newParams: Partial<typeof searchParams>) => {
    setSearchParams((prev) => ({
      ...prev,
      ...newParams,
    }));
  };

  useEffect(() => {
    async function fetchCommunities() {
      try {
        setLoading(true);

        // Build the query string
        const qp = new URLSearchParams();
        if (searchParams.userId) qp.append("userId", searchParams.userId);
        if (searchParams.q) qp.append("q", searchParams.q);
        if (searchParams.tags.length > 0) qp.append("tags", searchParams.tags.join(","));
        qp.append("page", searchParams.page.toString());
        qp.append("perPage", searchParams.perPage.toString());

        // Choose endpoint
        const base =
          endpoint === "search"
            ? "/api/communities/search"
            : "/api/communities";

        const response = await fetch(`${base}?${qp.toString()}`, {
          headers: { "cache-control": "no-store" },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch communities");
        }

        const raw: any = await response.json();

        // Normalize shapes from /api/communities (totalCount/totalPages)
        // and /api/communities/search (total/page/perPage)
        const list: Community[] = Array.isArray(raw?.communities) ? raw.communities : [];
        const total =
          typeof raw?.totalCount === "number"
            ? raw.totalCount
            : typeof raw?.total === "number"
            ? raw.total
            : list.length;

        const perPage =
          typeof raw?.perPage === "number" ? raw.perPage : searchParams.perPage;

        const totalPagesNorm =
          typeof raw?.totalPages === "number"
            ? raw.totalPages
            : Math.max(1, Math.ceil(total / perPage));

        setCommunities(list);
        setTotalCount(total);
        setTotalPages(totalPagesNorm);
      } catch (err: any) {
        console.error("Error fetching communities:", err);
        setError(err.message || "Failed to load communities");
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, [searchParams, endpoint]);

  return {
    communities,
    loading,
    error,
    setCommunities,
    totalPages,
    totalCount,
    currentPage: searchParams.page,
    searchParams,
    updateSearchParams,
  };
}
