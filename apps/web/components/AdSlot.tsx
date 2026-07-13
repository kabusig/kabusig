// アフィリエイト・広告枠。
// 広告タグ(A8.net / もしもアフィリエイト / Amazonアソシエイト / Google AdSense等)を
// 取得したら AD_SLOTS にHTMLを設定する。未設定の枠は何も表示しない。
//
// 【注意】
// - 証券口座・クレジットカード等の金融系アフィリエイトを貼る場合も、
//   特定の口座・商品を勧める文言は書かないこと(リンク・バナーの設置のみ)。
// - 景品表示法(ステマ規制・2023年10月施行)対応のため、広告там には
//   「PR」表示を自動で付与する。

const AD_SLOTS: Record<string, string | null> = {
  news_top: null, // 例: '<a href="..."><img src="..." /></a>'
  news_inline: null,
  sidebar: null,
  // トップのシグナル検知の上(A8のバナーを想定)。
  signal_top: null,
  // サイト全ページ下部の枠(三井住友カード等のバナーを想定)。
  // A8.net で広告主と提携し、発行されたタグをそのまま貼り付ける。
  footer: null,
};

export default function AdSlot({ slot }: { slot: string }) {
  const html = AD_SLOTS[slot];
  if (!html) return null;
  return (
    <div className="my-4">
      <div className="text-[10px] text-[#6e6e73] text-center mb-1">PR</div>
      <div
        className="flex justify-center [&_img]:max-w-full"
        // 自己管理の広告タグのみを埋め込む(外部入力は不可)
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
