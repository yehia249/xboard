// src/app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setEmail(user.email || "");
      else router.push("/login"); // redirect if not logged in
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      <p>Welcome, {email} 🎉</p>
      <button onClick={handleLogout} style={{ marginTop: 20 }}>
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;
