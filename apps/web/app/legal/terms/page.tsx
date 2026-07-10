// 【実装者注】本文言はテンプレートであり、公開前に専門家(行政書士・弁護士)の
// レビューを受けること(開発指示書 §10)。
import { SERVICE_NAME, OPERATOR_NAME } from "@/lib/constants";

export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <article className="max-w-3xl space-y-5 text-sm leading-relaxed text-slate-300">
      <h1 className="text-2xl font-bold text-white">利用規約</h1>

      <section>
        <h2 className="font-semibold text-white mb-1">第1条(定義・適用範囲)</h2>
        <p>
          本規約は、{OPERATOR_NAME}(以下「運営者」)が提供する{SERVICE_NAME}
          (以下「本サービス」)の利用条件を定めるものであり、本サービスを利用する
          すべての方(以下「利用者」)に適用されます。
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-white mb-1">第2条(アカウント)</h2>
        <p>
          利用者は正確な情報をもって登録を行うものとし、アカウントを第三者に
          譲渡・貸与してはなりません。認証情報の管理責任は利用者が負います。
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-white mb-1">第3条(有料プラン)</h2>
        <p>
          有料プランの料金は料金プランページに表示します。支払方法はクレジット
          カード(Stripe)とし、申込日に初回課金、以後毎月同日に自動課金されます。
          解約はマイページからいつでも可能で、解約後は当該課金期間の末日まで
          利用できます。日割返金は行いません。
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-white mb-1">第4条(禁止事項)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>スクレイピング等の自動化された手段によるデータ取得</li>
          <li>リバースエンジニアリング、本サービスの複製・再配布</li>
          <li>通知内容・表示データの商用目的での転載・再配布</li>
          <li>本サービスの運営を妨害する行為、不正アクセス</li>
          <li>法令または公序良俗に反する行為</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-white mb-1">第5条(免責)</h2>
        <p>
          本サービスは投資助言・代理業に該当する行為を行いません。提供情報は
          機械的計算結果および公開情報であり、その正確性・完全性・有用性を保証
          しません。本サービスは現状有姿で提供され、利用により生じた損害について
          運営者は一切の責任を負いません。詳細は免責事項ページに定めます。
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-white mb-1">第6条(知的財産権)</h2>
        <p>
          本サービスに関する知的財産権は運営者または正当な権利者に帰属します。
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-white mb-1">第7条(規約の変更)</h2>
        <p>
          運営者は、必要と判断した場合、本サービス上での掲示その他適切な方法で
          周知のうえ本規約を変更できます。変更後の規約は掲示の際に定める効力
          発生日から適用されます。
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-white mb-1">第8条(準拠法・管轄)</h2>
        <p>
          本規約は日本法に準拠し、本サービスに関する紛争は運営者所在地を管轄する
          地方裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
      </section>
    </article>
  );
}
