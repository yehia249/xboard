// src/app/page.tsx
"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main style={{ padding: 40, textAlign: "center" }}>
      <h1>Welcome to XBoard 🚀</h1>
      <p>Select an option to get started:</p>
      <div style={{ marginTop: 20 }}>
        <button onClick={() => router.push("/login")} style={{ marginRight: 10 }}>
          Login
        </button>
        <button onClick={() => router.push("/signup")}>Signup</button>
      </div>
    </main>
  );
}
