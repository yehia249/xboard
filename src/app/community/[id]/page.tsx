// src/app/community/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import "@/app/communityPage.css";

export default function CommunityDetails() {
  const { id } = useParams();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunity = async () => {
      const res = await fetch(`/api/communities/${id}`);
      const data = await res.json();
      setCommunity(data);
      setLoading(false);
    };
    fetchCommunity();
  }, [id]);

  if (loading) return <div className="community-page">Loading...</div>;
  if (!community) return <div className="community-page">Community not found.</div>;

  return (
    <div className="community-page">
      <div className="image-banner">
        <img src={community.image_url} alt={community.name} />
      </div>
      <div className="community-info">
        <h1>{community.name}</h1>
        <div className="tags">
          {community.tags.map((tag: string, index: number) => (
            <span className="tag" key={index}>{tag}</span>
          ))}
        </div>
        <p className="long-description">{community.long_description || community.description}</p>
        <Link href={community.invite_link || "#"} target="_blank" className="join-button">
          Join
        </Link>
      </div>
    </div>
  );
}
