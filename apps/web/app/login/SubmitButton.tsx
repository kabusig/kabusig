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
      className="w-full bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-full px-6 py-3 text-sm font-medium transition-colors"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
