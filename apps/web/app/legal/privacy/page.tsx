// 【実装者注】本文言はテンプレートであり、公開前に専門家(行政書士・弁護士)の
// レビューを受けること(開発指示書 §10)。
import { SERVICE_NAME, CONTACT_EMAIL } from "@/lib/constants";

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl space-y-5 text-sm leading-relaxed text-[#424245]">
      <h1 className="text-4xl font-semibold tracking-tight text-[#1d1d1f]">プライバシーポリシー</h1>

      <section>
        <h2 className="font-semibold text-[#1d1d1f] mb-1">1. 取得する情報</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>メールアドレス(アカウント登録時)</li>
          <li>LINEユーザーID(LINE連携時)</li>
          <li>
            決済情報(Stripe社が管理し、本サービスはカード番号を保持しません)
          </li>
          <li>利用ログ(アクセス日時、通知送信履歴等)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-[#1d1d1f] mb-1">2. 利用目的</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{SERVICE_NAME}の提供・維持・改善</li>
          <li>シグナル検知・決算予定等の通知送信</li>
          <li>課金・請求管理</li>
          <li>問い合わせ対応</li>
          <li>不正利用の防止</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-[#1d1d1f] mb-1">3. 第三者提供・委託</h2>
        <p>
          法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。
          サービス提供のため、以下の事業者に取扱いを委託しています:
          Stripe(決済)、Supabase(データベース・認証)、LINEヤフー(通知配信)、
          Vercel(ホスティング)。
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-[#1d1d1f] mb-1">4. 保存期間・開示等の請求</h2>
        <p>
          個人情報は利用目的の達成に必要な期間保存します。開示・訂正・削除の
          請求は下記窓口までご連絡ください:{CONTACT_EMAIL}
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-[#1d1d1f] mb-1">5. Cookie等</h2>
        <p>
          本サービスは、ログイン状態の維持のために Cookie
          を使用します。アクセス解析ツールを導入する場合は本ポリシーを更新して
          周知します。
        </p>
      </section>
    </article>
  );
}
