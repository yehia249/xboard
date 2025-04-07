// src/app/signup/page.tsx
"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import "@/app/loginform.css";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      const { error } = await supabase.from("users").insert([
        {
          firebase_uid: user.uid,
          email: user.email,
        },
      ]);

      if (error) throw new Error("Supabase insert failed: " + error.message);

      router.push("/dashboard");
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 20 }}>
      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: 10, width: "100%" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: 10, width: "100%" }}
        />
        <button type="submit" style={{ width: "100%" }}>Sign up</button>
      </form>
      <button onClick={() => router.push("/login")} style={{ marginTop: 10, width: "100%" }}>
        Already have an account? Login
      </button>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
};

export default SignupPage;
