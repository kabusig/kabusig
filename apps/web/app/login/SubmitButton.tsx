"use client";

import { useFormStatus } from "react-dom";

// 送信中はボタンを無効化して二重送信を防ぐ(useFormStatus は form の子で使う)
export default function SubmitButton({
  children,
  pendingLabel = "送信中…",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="w-full inline-flex items-center justify-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-full px-6 py-3 text-sm font-medium transition-colors"
    >
      {pending && (
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
      {pending ? pendingLabel : children}
    </button>
  );
}
