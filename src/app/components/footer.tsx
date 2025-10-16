import React from 'react';
import "@/app/all.css";

export default function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(to bottom, black, #1a1a1a)",
        padding: "2.5rem 1rem",
        marginTop: "auto",          // ✨ ensure it sticks to bottom inside flex column
        width: "100%",              // ✨ guarantee full width
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

        {/* Links styled like clean text */}
        <nav className="flex flex-col items-center space-y-2">
          <a
            href="/guidelines"
            className="transition-opacity text-base text-gray-300 hover:opacity-90"
            style={{ textDecoration: "none" }}
          >
            Guidelines
          </a>
          <a
            href="/privacy"
            className="transition-opacity text-base text-gray-300 hover:opacity-90"
            style={{ textDecoration: "none" }}
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="transition-opacity text-base text-gray-300 hover:opacity-90"
            style={{ textDecoration: "none" }}
          >
            Terms
          </a>
        </nav>

        {/* Legal disclaimer */}
        <div className="text-center mt-6 text-sm text-gray-500 max-w-md px-4 text-wrap text-balance leading-relaxed">
          <p>
            XBoard is an independent platform and is not affiliated with X Corp. (formerly known as Twitter). All trademarks are the property of their respective owners.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center mt-4 text-base text-gray-400">
          <p>© 2025 Xboard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
