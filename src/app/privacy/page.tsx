// app/privacy/page.tsx
"use client";

import "@/app/all.css";
import "@/app/logup.css";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/hooks/AuthContext";
import Footer from "@/app/components/footer";

const LAST_UPDATED = "October 11, 2025";

export default function PrivacyPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handlePostCommunity = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/signup?redirect=/dashboard");
    }
  };

  const [showHeader, setShowHeader] = useState(true);

  // Match sticky header behavior from the big file
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY <= 0) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="community-page">
        {/* Sticky Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            backgroundColor: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 1rem",
            borderBottomLeftRadius: "15px",
            borderBottomRightRadius: "15px",
            border: "1px solid #333",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            transform: showHeader ? "translateY(0)" : "translateY(-100%)",
            transition: "transform 0.3s ease-in-out",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >

          </Link>

          <button
            id="postabutton"
            className="postabutton"
            onClick={handlePostCommunity}
            style={{ position: "relative", width: "fit-content" }}
          >
            <span>Post your Community</span>
          </button>
        </header>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-16 text-white">
        <h1 className="text-3xl font-extrabold mb-2 !mt-8">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {LAST_UPDATED}</p>

        <p className="text-gray-300 mb-6 leading-7">
          This Privacy Policy explains how <strong>XBoard</strong> collects, uses, discloses, and safeguards information in connection with your use of the website, products, and services (the &quot;<strong>Service</strong>&quot;). By using the Service, you acknowledge that you have read and understood this Privacy Policy.
        </p>

        <h2 className="text-2xl font-bold mb-3">1. Scope</h2>
        <p className="text-gray-300 mb-6 leading-7">
          This Privacy Policy applies to information processed by XBoard when you access or use the Service. It does not apply to third-party services that may be linked or integrated with the Service; those are governed by the third party’s own policies.
        </p>

        <h2 className="text-2xl font-bold mb-3">2. Information We Collect</h2>
        <p className="text-gray-300 mb-4 leading-7">
          We collect information that you provide directly and information that is collected automatically when you use the Service:
        </p>
        <ul className="list-disc pl-6 text-gray-300 mb-6 leading-7">
          <li><span className="font-semibold">Account Information:</span> username, email address, profile details, and any content you submit (e.g., community listings and related media).</li>
          <li><span className="font-semibold">Usage Information:</span> device and browser characteristics, pages viewed, and interactions with features, collected via standard logging and similar technologies.</li>
          <li><span className="font-semibold">Payment Information:</span> processed by our payment partners for purchases and subscriptions. We receive limited information necessary to confirm transaction status; sensitive payment data is handled by the provider.</li>
          <li><span className="font-semibold">Cookies and Local Storage:</span> used to keep you signed in, remember preferences, and support essential functionality. You may manage cookies through your browser settings; disabling them may impact the Service.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-3">3. How We Use Information</h2>
        <ul className="list-disc pl-6 text-gray-300 mb-6 leading-7">
          <li>Provide, maintain, and improve the Service and its features.</li>
          <li>Authenticate users, process payments, and administer subscriptions.</li>
          <li>Detect, prevent, and address fraud, abuse, or security incidents.</li>
          <li>Communicate important notices about the Service, including changes to terms or policies.</li>
          <li>Comply with legal obligations and enforce our agreements.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-3">4. Legal Bases (where applicable)</h2>
        <p className="text-gray-300 mb-6 leading-7">
          Where required by law, we process personal data on the following bases: performance of a contract (to provide the Service), legitimate interests (e.g., security and improvement), compliance with legal obligations, and, where applicable, your consent.
        </p>

        <h2 className="text-2xl font-bold mb-3">5. Sharing of Information</h2>
        <p className="text-gray-300 mb-6 leading-7">
          We share information with service providers that support the Service, including hosting, authentication, analytics, and payment processing. These providers are bound by obligations to protect your information and use it only for the services they perform for us. We do not sell or rent personal information. We may disclose information if required by law or to protect rights, safety, or the integrity of the Service.
        </p>

        <h2 className="text-2xl font-bold mb-3">6. International Transfers</h2>
        <p className="text-gray-300 mb-6 leading-7">
          Your information may be transferred to and processed in jurisdictions other than your own. We take steps to ensure appropriate safeguards are in place where required by law.
        </p>

        <h2 className="text-2xl font-bold mb-3">7. Data Retention</h2>
        <p className="text-gray-300 mb-6 leading-7">
          We retain information for as long as necessary to provide the Service, comply with legal obligations, resolve disputes, and enforce agreements. Backups and logs may persist for a limited period consistent with our operational practices.
        </p>

        <h2 className="text-2xl font-bold mb-3">8. Security</h2>
        <p className="text-gray-300 mb-6 leading-7">
          We employ administrative, technical, and organizational measures designed to protect information, including the use of HTTPS and encryption where appropriate. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-2xl font-bold mb-3">9. Your Rights</h2>
        <p className="text-gray-300 mb-6 leading-7">
          Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict the processing of your personal data, and to object to processing or request data portability. You may exercise these rights through the mechanisms provided within the Service or by contacting us. We will respond within a reasonable timeframe consistent with applicable law.
        </p>

        <h2 className="text-2xl font-bold mb-3">10. Children’s Privacy</h2>
        <p className="text-gray-300 mb-6 leading-7">
          The Service is not directed to children under 13, and we do not knowingly collect personal information from them. If we learn that we have collected such information, we will take appropriate steps to delete it.
        </p>

        <h2 className="text-2xl font-bold mb-3">11. Changes to this Policy</h2>
        <p className="text-gray-300 mb-6 leading-7">
          We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date indicates the effective date of the current version. Your continued use of the Service after the effective date constitutes your acknowledgment of the updated Policy.
        </p>

        <h2 className="text-2xl font-bold mb-3">12. Contact</h2>
        <p className="text-gray-300 mb-6 leading-7">
          If you have questions about this Privacy Policy or our data practices, please contact us using the methods provided on the Service.
        </p>
      </main>

      {/* Footer */}
      <div className="mt-16">
        <Footer />
      </div>
    </>
  );
}
