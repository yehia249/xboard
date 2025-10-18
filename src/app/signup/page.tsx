// src/app/signup/page.tsx
import type { Metadata } from "next";
import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  title: "Sign Up – XBoard",
  description: "Create your XBoard account to discover and promote X communities",
  robots: { 
    index: false, 
    follow: true, 
    googleBot: { 
      index: false, 
      follow: true 
    } 
  },
  alternates: { 
    canonical: "https://xboardz.com/"
  },
};

export default function SignupPage() {
  return <SignupClient />;
}