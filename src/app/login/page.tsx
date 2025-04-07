"use client";
import { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import "../loginform.css"; // Import your CSS file

// Initialize Firebase Auth and Supabase client
const auth = getAuth(); // Assumes Firebase is initialized in a config file
const supabaseUrl = "https://hazcjgslrdoxjdwenrnw.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhemNqZ3NscmRveGpkd2Vucm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODI3MzUsImV4cCI6MjA1OTM1ODczNX0.kJVZiQb6JArkYWDfCoQ0fhBIriULDiIUAZ5e4S49j0g";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("✅ Firebase login successful. UID:", firebaseUser.uid);

      const { data: userData, error: supabaseError } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", firebaseUser.uid)
        .maybeSingle();

      if (supabaseError) {
        console.error("❌ Supabase query error:", supabaseError);
        setErrorMsg("Database error during login. Please try again.");
      } else if (!userData) {
        console.warn("⚠️ No matching user in Supabase for UID:", firebaseUser.uid);
        setErrorMsg("User not found in Supabase.");
      } else {
        console.log("✅ User found in Supabase:", userData);
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("❌ Firebase login error:", error);
      setErrorMsg(error.message || "Failed to log in with those credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      console.log("✅ Google Sign-In successful:", firebaseUser);

      const { data: userData, error: supabaseError } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", firebaseUser.uid)
        .maybeSingle();

      if (supabaseError) {
        console.error("❌ Supabase error:", supabaseError);
        setErrorMsg("Database error. Please try again.");
      } else if (!userData) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              firebase_uid: firebaseUser.uid,
              email: firebaseUser.email,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("❌ Supabase insert error:", insertError);
          setErrorMsg("Failed to create user in Supabase.");
        } else {
          console.log("✅ New user created in Supabase:", newUser);
          router.push("/dashboard");
        }
      } else {
        console.log("✅ User found in Supabase:", userData);
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("❌ Google Sign-In error:", error);
      setErrorMsg(error.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <form className="form" onSubmit={handleLogin}>
        <div className="flex-column">
          <label>Email</label>
        </div>
        <div className="inputForm">
          {/* email input */}
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
          {/* password input */}
          <input
            type={showPassword ? "text" : "password"}
            className="input"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* toggle visibility */}
          <span onClick={() => setShowPassword((prev) => !prev)} style={{ cursor: "pointer" }}>
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <div className="flex-row">
          <div>
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div>
          <Link href="/forgot-password" className="span">
            Forgot password?
          </Link>
        </div>

        {errorMsg && (
          <div style={{ color: "#ef4444", fontSize: "14px", marginTop: "8px" }}>
            {errorMsg}
          </div>
        )}

        <button className="button-submit" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Sign In"}
        </button>

        <div className="flex-row" style={{ justifyContent: "center" }}>
          <button className="btn google" type="button" onClick={handleGoogleSignIn}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="p">
          Don't have an account?{" "}
          <Link href="/signup" className="span">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
