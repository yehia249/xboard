"use client";
import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Ensure the path is correct for your project
import Link from "next/link";
import React, { useLayoutEffect } from 'react';
import "../loginform.css"; // Import your CSS file



export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    const key = "refreshed-login-page";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "true");
      window.location.replace(window.location.href);
    }
    return () => sessionStorage.removeItem(key);
  }, []);

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Check your email for a password reset link.");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center">
      <h2 className="text-white mb-4">Reset Password</h2>
      <form className="form" onSubmit={handleResetPassword}>
        <div className="flex-column">
          <label className="text-white">Email</label>
        </div>
        <div className="inputForm">
          <input
            type="email"
            className="input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {message && (
          <div style={{ color: "#10B981", marginTop: "8px" }}>{message}</div>
        )}
        {error && (
          <div style={{ color: "#ef4444", marginTop: "8px" }}>{error}</div>
        )}
        <button className="button-submit mt-4" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Reset Password"}
        </button>
      </form>
      <Link href="/login" className="text-white mt-4">Back to Login</Link>
    </div>
  );
}
