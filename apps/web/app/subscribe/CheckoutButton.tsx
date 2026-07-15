"use client";

import { useState } from "react";

// ネイティブフォーム(action="/api/checkout")用。押下でスピナー表示+二重送信ガード。
// disabled にすると一部ブラウザで送信がキャンセルされるため、preventDefault で二度目を防ぐ。
export default function CheckoutButton({
  children,
}: {
  children: React.ReactNode;
}) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <button
      type="submit"
      aria-busy={submitting}
      onClick={(e) => {
        if (submitting) {
          e.preventDefault();
          return;
        }
        setSubmitting(true);
      }}
      className="w-full inline-flex items-center justify-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-3.5 text-sm font-medium transition-colors"
    >
      {submitting && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {submitting ? "決済ページへ移動中…" : children}
    </button>
  );
}
