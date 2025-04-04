"use client";
import { useState } from "react";
import { auth } from "../lib/firebase";
import { supabase } from "../lib/supabase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isLogin) {
        // 🔐 Login
        const res = await signInWithEmailAndPassword(auth, email, password);
        setMessage("Logged in ✅ UID: " + res.user.uid);
      } else {
        // 🆕 Signup
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;

        // 🧾 Insert into Supabase
        const { error } = await supabase.from("users").insert([
          {
            firebase_uid: user.uid,
            email: user.email,
          },
        ]);

        if (error) {
          throw new Error("Supabase insert failed: " + error.message);
        }

        setMessage("Signup complete ✅ User stored in Supabase too!");
      }
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 20 }}>
      <h2>{isLogin ? "Login" : "Signup"}</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit" style={{ width: "100%" }}>
          {isLogin ? "Login" : "Sign up"}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        style={{ marginTop: 10, width: "100%" }}
      >
        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
      </button>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
};

export default AuthForm;
