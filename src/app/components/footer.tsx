import React from "react";
import "@/app/all.css";

export default function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(to bottom, black, #1a1a1a)",
        padding: "2.5rem 1rem",
        marginTop: "auto",
        width: "100%",
      }}
    >
      <div className="container mx-auto flex flex-col items-center text-white">
        {/* Top clickable item styled like natural text */}
        <a
          href="/"
          className="mb-4 text-xl font-bold cursor-pointer hover:opacity-90"
          style={{
            color: "white",
            textDecoration: "none",
            pointerEvents: "auto",
          }}
        >
          {/* Insert your logo/text here if needed */}
        </a>

        {/* Section title */}
        <h3 className="font-bold text-2xl mb-5">Resources</h3>

        {/* Horizontal links */}
        <nav
          role="navigation"
          aria-label="Footer navigation"
          className="footer-nav flex flex-wrap items-center justify-center gap-6"
        >
          <a href="/guidelines">Guidelines</a>
          <a href="/faq">FAQ</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
          <a
            href="https://paynow.gg/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
          >
            PayNow Terms of Service
          </a>
        </nav>

        {/* Legal disclaimer */}
        <div className="text-center mt-6 text-sm text-gray-500 max-w-md px-4 text-wrap text-balance leading-relaxed">
          <p>
            XBoard is an independent platform and is not affiliated with X Corp.
            (formerly known as Twitter). All trademarks are the property of
            their respective owners.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center mt-4 text-base text-gray-400">
          <p>© 2025 Xboard. All rights reserved.</p>
        </div>
      </div>

      {/* Scoped hard reset so links never appear blue or underlined */}
      <style jsx>{`
        .footer-nav a {
          color: #d1d5db; /* gray-300 */
          text-decoration: none;
          transition: color 150ms ease;
        }
        .footer-nav a:visited {
          color: #d1d5db; /* prevent purple visited */
        }
        .footer-nav a:hover,
        .footer-nav a:focus {
          color: #f5f5f5; /* near-white on hover */
          text-decoration: none;
          outline: none;
        }
        .footer-nav a:active {
          color: #ffffff;
        }
      `}</style>
    </footer>
  );
}
