// 【実装者注】本文言はテンプレートであり、公開前に専門家(行政書士・弁護士)の
// レビューを受けること(開発指示書 §10)。
// 個人事業主の場合、氏名(戸籍上の氏名)は原則省略不可。屋号のみの表記は不可。
// 住所・電話番号は「請求があれば遅滞なく開示」の体制があれば省略可(特商法11条ただし書)。
import { OPERATOR_NAME, CONTACT_EMAIL } from "@/lib/constants";

export const dynamic = "force-static";

const ROWS: [string, string][] = [
  ["販売事業者名", `${OPERATOR_NAME}`],
  [
    "所在地",
    "請求があれば遅滞なく開示いたします(特定商取引法第11条ただし書に基づき省略)",
  ],
  [
    "電話番号",
    "請求があれば遅滞なく開示いたします(特定商取引法第11条ただし書に基づき省略)",
  ],
  ["連絡先メールアドレス", CONTACT_EMAIL],
  ["販売価格", "料金プランページに記載(月額・税込)"],
  ["商品代金以外の必要料金", "なし(通信費は利用者負担)"],
  ["支払方法", "クレジットカード(Stripe)"],
  ["支払時期", "申込時に初回課金、以後毎月同日に自動課金"],
  ["サービス提供時期", "決済完了後、直ちに利用可能"],
  [
    "解約について",
    "マイページよりいつでも解約可能。解約後は当該課金期間の末日までご利用いただけます。日割返金は行いません。",
  ],
  ["動作環境", "最新版の Chrome / Edge / Safari / Firefox"],
];

export default function TokushohoPage() {
  return (
    <article className="max-w-3xl space-y-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">特定商取引法に基づく表記</h1>
      <table className="w-full">
        <tbody>
          {ROWS.map(([label, value]) => (
            <tr key={label} className="border-b border-slate-800">
              <th className="py-3 pr-4 text-left text-slate-400 w-48 align-top whitespace-nowrap">
                {label}
              </th>
              <td className="py-3 text-slate-300">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
