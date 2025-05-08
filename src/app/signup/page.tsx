"use client";
import { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthError } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import React from 'react';
import Link from "next/link";
import "../loginform.css";

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();
const supabaseUrl = "https://hazcjgslrdoxjdwenrnw.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhemNqZ3NscmRveGpkd2Vucm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODI3MzUsImV4cCI6MjA1OTM1ODczNX0.kJVZiQb6JArkYWDfCoQ0fhBIriULDiIUAZ5e4S49j0g";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the redirect URL from query parameters
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // Helper function to parse Firebase error codes into user-friendly messages
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "This email address is already registered. Please sign in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Your password is too weak. Please use at least 6 characters with a mix of letters, numbers, and symbols.";
      case "auth/operation-not-allowed":
        return "Account creation is currently disabled. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection and try again.";
      case "auth/popup-closed-by-user":
        return "Sign-up popup was closed before completing the process. Please try again.";
      case "auth/popup-blocked":
        return "Sign-up popup was blocked by your browser. Please allow popups for this site and try again.";
      case "auth/internal-error":
        return "An internal error occurred. Please try again later.";
      default:
        return "Something went wrong. Please try again later.";
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("The passwords you entered don't match. Please try again.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Your password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userData = {
        firebase_uid: firebaseUser.uid,
        email: email,
        created_at: new Date().toISOString(),
        auth_provider: "email",
      };

      const { data, error: supabaseError } = await supabase
        .from("users")
        .insert([userData])
        .select();

      if (supabaseError) {
        if (supabaseError.code === "23505") {
          setErrorMsg("This account already exists. Please sign in instead.");
        } else {
          setErrorMsg("We couldn't create your account in our database. Please try again later.");
        }
        return;
      }

      // Redirect to the URL from query parameter or default to dashboard
      router.push(redirectUrl);
    } catch (error) {
      console.error("Signup error:", error);
      const firebaseError = error as AuthError;
      setErrorMsg(getErrorMessage(firebaseError.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (): Promise<void> => {
    setErrorMsg("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const { displayName, email, photoURL } = firebaseUser;

      const { data: userData, error: queryError } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", firebaseUser.uid)
        .maybeSingle();

      if (queryError) {
        setErrorMsg("We couldn't check if your account exists. Please try again.");
        return;
      }

      if (!userData) {
        const newUserData = {
          firebase_uid: firebaseUser.uid,
          email: email,
          name: displayName || email?.split('@')[0],
          avatar_url: photoURL || null,
          auth_provider: "google",
          created_at: new Date().toISOString(),
        };

        const { data, error: insertError } = await supabase
          .from("users")
          .insert([newUserData])
          .select();

        if (insertError) {
          setErrorMsg("We couldn't create your account in our database. Please try again.");
          return;
        }
      }

      // Redirect to the URL from query parameter or default to dashboard
      router.push(redirectUrl);
    } catch (error) {
      console.error("Google signup error:", error);
      const firebaseError = error as AuthError;
      setErrorMsg(getErrorMessage(firebaseError.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <form className="form" onSubmit={handleSignup}>
        {/* Added Back to Home link at the top right */}
        <div className="flex items-end justify-end w-full">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Back to Home
          </Link>
        </div>
        
        <div className="flex-column">
          <label>Email</label>
        </div>
        <div className="inputForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
          </svg>
          <input
            type="email"
            className="input"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex-column">
          <label>Password</label>
        </div>
        <div className="inputForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type={showPassword ? "text" : "password"}
            className="input"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={() => setShowPassword(!showPassword)}
            style={{ cursor: "pointer" }}
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
            {showPassword && <line x1="1" y1="1" x2="23" y2="23" />}
          </svg>
        </div>

        <div className="flex-column">
          <label>Confirm Password</label>
        </div>
        <div className="inputForm">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="input"
            placeholder="Confirm your Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{ cursor: "pointer" }}
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
            {showConfirmPassword && <line x1="1" y1="1" x2="23" y2="23" />}
          </svg>
        </div>

        {errorMsg && (
          <div className="error-message" style={{ color: "#ef4444", fontSize: "14px", marginTop: "8px", padding: "10px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "4px", textAlign: "center" }}>
            {errorMsg}
          </div>
        )}

        <button className="button-submit" type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <div className="flex-row" style={{ justifyContent: "center" }}>
          <button className="btn google" type="button" onClick={handleGoogleSignup} disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
            </svg>
            {loading ? "Processing..." : "Continue with Google"}
          </button>
        </div>

        <p className="p">
          Already have an account?{" "}
          <Link href={`/login${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`} className="span">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}