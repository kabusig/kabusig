import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { CONTACT_EMAIL, SERVICE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const viewer = await getViewer();
  const subject = encodeURIComponent(`【${SERVICE_NAME}】お問い合わせ`);
  const body = encodeURIComponent(
    viewer.email ? `\n\n---\n登録メール: ${viewer.email}` : ""
  );
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">お問い合わせ</h1>

      {viewer.paid ? (
        <>
          <p className="text-[15px] text-[#6e6e73] leading-relaxed">
            プレミアム会員のお客様は、下記メールアドレスへお問い合わせいただけます。
            通常2〜3営業日以内に返信いたします。
          </p>
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 text-center space-y-4">
            <div className="text-lg font-medium">{CONTACT_EMAIL}</div>
            <a
              href={mailto}
              className="inline-block bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-3 text-sm font-medium transition-colors"
            >
              メールで問い合わせる
            </a>
            <p className="text-[11px] text-[#6e6e73]">
              ボタンが動かない場合は、お使いのメールソフトから上記アドレス宛に直接お送りください。
            </p>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 text-center space-y-4">
          <div className="text-3xl">✉️</div>
          <p className="text-sm text-[#6e6e73] leading-relaxed">
            メールでのお問い合わせサポートはプレミアム会員向けのサービスです。
            サービスに関する一般的なご質問は、下記の共通アドレスでも受け付けています。
          </p>
          <div className="text-[15px] font-medium">{CONTACT_EMAIL}</div>
          <div>
            <Link
              href="/pricing"
              className="inline-block bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            >
              プレミアムのご案内
            </Link>
          </div>
        </div>
      )}

      <p className="text-[11px] text-[#6e6e73]">
        個人情報の取り扱いについては
        <Link href="/legal/privacy" className="text-[#0066cc] hover:underline mx-1">
          プライバシーポリシー
        </Link>
        をご覧ください。
      </p>
    </div>
  );
}
