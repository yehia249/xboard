"use client";
import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import "../loginform.css"; // Import your CSS file

// Initialize Firebase Auth and Supabase client
const auth = getAuth(); // Assumes Firebase is initialized in a config file
const googleProvider = new GoogleAuthProvider();
const supabaseUrl = "https://hazcjgslrdoxjdwenrnw.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhemNqZ3NscmRveGpkd2Vucm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODI3MzUsImV4cCI6MjA1OTM1ODczNX0.kJVZiQb6JArkYWDfCoQ0fhBIriULDiIUAZ5e4S49j0g";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Signup() {
  // States for form inputs and UI feedback
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    // Validate password strength (optional)
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("✅ Firebase signup successful. UID:", firebaseUser.uid);

      // 2. Create user in Supabase - Enhanced error handling
      const userData = {
        firebase_uid: firebaseUser.uid,
        email: email,
        name: email.split('@')[0], // Default name based on email
        created_at: new Date().toISOString(),
        auth_provider: "email",
      };
      
      console.log("Attempting to insert user data:", userData);

      const { data, error: supabaseError } = await supabase
        .from("users")
        .insert([userData])
        .select();

      if (supabaseError) {
        console.error("❌ Supabase insert error:", supabaseError);
        
        // Check if it's a duplicate entry error
        if (supabaseError.code === "23505") {
          setErrorMsg("This account already exists. Try logging in instead.");
        } else {
          setErrorMsg(`Database error: ${supabaseError.message || supabaseError.code}`);
        }
        
        // Consider deleting the Firebase user if Supabase insert fails
        // await firebaseUser.delete();
        return;
      }
      
      console.log("✅ User added to Supabase successfully:", data);
      router.push("/dashboard"); // Redirect to dashboard
    } catch (error: any) {
      console.error("❌ Firebase signup error:", error);
      // Format user-friendly error messages
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered. Try logging in instead.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("Password is too weak. Please use a stronger password.");
      } else {
        setErrorMsg(error.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      // 1. Sign in with Google via Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      console.log("✅ Google signup successful. UID:", firebaseUser.uid);
      
      // Get user profile information from Google account
      const { displayName, email, photoURL } = firebaseUser;
      
      // 2. Check if user exists in Supabase
      const { data: userData, error: queryError } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", firebaseUser.uid)
        .maybeSingle();
      
      if (queryError) {
        console.error("❌ Supabase query error:", queryError);
        setErrorMsg(`Database query error: ${queryError.message}`);
        return;
      }
      
      // 3. If user doesn't exist in Supabase, create a new entry
      if (!userData) {
        console.log("⚠️ No user found in Supabase. Creating new user record.");
        
        const newUserData = {
          firebase_uid: firebaseUser.uid,
          email: email,
          auth_provider: "google",
          created_at: new Date().toISOString(),
        };
        
        console.log("Attempting to insert Google user data:", newUserData);
        
        const { data, error: insertError } = await supabase
          .from("users")
          .insert([newUserData])
          .select();
        
        if (insertError) {
          console.error("❌ Supabase insert error:", insertError);
          setErrorMsg(`Failed to create user record: ${insertError.message}`);
          return;
        }
        console.log("✅ New user added to Supabase:", data);
      } else {
        console.log("✅ User already exists in Supabase:", userData);
      }
      
      // 4. Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("❌ Google signup error:", error);
      setErrorMsg(error.message || "Failed to sign up with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <form className="form" onSubmit={handleSignup}>
        <div className="flex-column">
          <label>Email</label>
        </div>
        <div className="inputForm">
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
          >
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
          >
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
          {showPassword ? (
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
              onClick={() => setShowPassword(false)}
              style={{ cursor: "pointer" }}
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
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
              onClick={() => setShowPassword(true)}
              style={{ cursor: "pointer" }}
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </div>

        <div className="flex-column">
          <label>Confirm Password</label>
        </div>
        <div className="inputForm">
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
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type={showPassword ? "text" : "password"}
            className="input"
            placeholder="Confirm your Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {errorMsg && (
          <div style={{ color: "#ef4444", fontSize: "14px", marginTop: "8px" }}>
            {errorMsg}
          </div>
        )}

        <button className="button-submit" type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <div className="flex-row" style={{ justifyContent: "center" }}>
          <button 
            className="btn google" 
            type="button" 
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
            >
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
            {loading ? "Processing..." : "Continue with Google"}
          </button>
        </div>
        <p className="p">
          Already have an account?{" "}
          <Link href="/login" className="span">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}