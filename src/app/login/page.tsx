"use client";  // Ensure this is a client-side component (Next.js 13+)

// Import Firebase and Supabase clients
import { useState } from "react";
// ✅ CORRECT for app directory (app/login/page.tsx)
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { createClient } from "@supabase/supabase-js";

// Initialize Firebase Auth and Supabase client
const auth = getAuth();  // Assumes Firebase has been initialized elsewhere (e.g., in a config file)
const supabaseUrl = "https://hazcjgslrdoxjdwenrnw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhemNqZ3NscmRveGpkd2Vucm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODI3MzUsImV4cCI6MjA1OTM1ODczNX0.kJVZiQb6JArkYWDfCoQ0fhBIriULDiIUAZ5e4S49j0g";
// The environment variables above must be prefixed with NEXT_PUBLIC for client-side use&#8203;:contentReference[oaicite:3]{index=3}.
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Login() {
  // State for form inputs and feedback
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");        // reset any previous error
    setLoading(true);
    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("✅ Firebase login successful. UID:", firebaseUser.uid);

      // 2. Query Supabase for the user by Firebase UID
      const { data: userData, error: supabaseError } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", firebaseUser.uid)
        .maybeSingle(); 
        // Using maybeSingle() returns { data: null, error: null } if no match&#8203;:contentReference[oaicite:4]{index=4}.
        // This avoids throwing an error for "no rows", making it easier to handle "not found" as a normal case.

      if (supabaseError) {
        // An actual error occurred with the Supabase query (not just "no data").
        console.error("❌ Supabase query error:", supabaseError);
        setErrorMsg("Database error during login. Please try again.");
      } else if (!userData) {
        // No user found in Supabase with that UID.
        console.warn("⚠️ No matching user in Supabase for UID:", firebaseUser.uid);
        setErrorMsg("User not found in Supabase.");
      } else {
        // Supabase returned a user record
        console.log("✅ User found in Supabase:", userData);
        // (Optional) You might store the user data in your app state/context here

        // 3. Redirect or proceed to protected area of the app
        router.push("/dashboard");  // adjust the route as needed for your app
      }
    } catch (firebaseError: any) {
      // Handle Firebase sign-in errors (wrong password, user not found in Firebase, etc.)
      console.error("❌ Firebase login error:", firebaseError);
      setErrorMsg(firebaseError.message || "Failed to log in with those credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>Log In</h1>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email:</label><br/>
          <input 
            id="email"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="Your email" 
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label><br/>
          <input 
            id="password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Your password" 
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
