// アフィリエイト・広告枠。
// 広告タグ(A8.net / もしもアフィリエイト / Amazonアソシエイト / Google AdSense等)を
// 取得したら AD_SLOTS にHTMLを設定する。未設定の枠は何も表示しない。
//
// 【注意】証券口座開設などの金融系アフィリエイトを貼る場合も、
// 特定の口座・商品を勧める文言は書かないこと(リンク・バナーの設置のみ)。

const AD_SLOTS: Record<string, string | null> = {
  news_top: null, // 例: '<a href="..."><img src="..." /></a>'
  news_inline: null,
  sidebar: null,
};

export default function AdSlot({ slot }: { slot: string }) {
  const html = AD_SLOTS[slot];
  if (!html) return null;
  return (
    <div
      className="my-4 flex justify-center [&_img]:max-w-full"
      // 自己管理の広告タグのみを埋め込む(外部入力は不可)
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
