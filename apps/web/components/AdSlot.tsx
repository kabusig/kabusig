// アフィリエイト・広告枠。A8.net等で提携後、発行されたHTMLタグを AD_SLOTS に設定する。
// 未設定(null)の枠は何も表示しない。
//
// 【注意】
// - 金融系アフィリエイトでも、特定の口座・商品を勧める文言は書かない(バナー設置のみ)。
// - 景品表示法(ステマ規制)対応のため、広告には「PR」表示を自動付与する。
// - https サイトなので画像URLは https にすること(http は混在コンテンツでブロックされる)。

// A8: 300x250 バナー
const AD_A8_300x250 =
  '<a href="https://px.a8.net/svt/ejp?a8mat=4B8091+ATDIEQ+1WP2+15P77L" rel="nofollow" target="_blank"><img border="0" width="300" height="250" alt="" src="https://www23.a8.net/svt/bgt?aid=260714053654&wid=001&eno=01&mid=s00000008903007004000&mc=1"></a><img border="0" width="1" height="1" src="https://www10.a8.net/0.gif?a8mat=4B8091+ATDIEQ+1WP2+15P77L" alt="">';

// A8: 250x250 バナー
const AD_A8_250x250 =
  '<a href="https://px.a8.net/svt/ejp?a8mat=4B8091+ASS2SY+1WP2+NXESX" rel="nofollow" target="_blank"><img border="0" width="250" height="250" alt="" src="https://www23.a8.net/svt/bgt?aid=260714053653&wid=001&eno=01&mid=s00000008903004019000&mc=1"></a><img border="0" width="1" height="1" src="https://www12.a8.net/0.gif?a8mat=4B8091+ASS2SY+1WP2+NXESX" alt="">';

// A8: 楽天(画像URLは http→https に変換して混在コンテンツを回避)
const AD_A8_RAKUTEN =
  '<a href="https://rpx.a8.net/svt/ejp?a8mat=4B7ZH5+72TJOY+2HOM+656YP&rakuten=y&a8ejpredirect=http%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2F0ea62065.34400275.0ea62066.204f04c0%2Fa26071334657_4B7ZH5_72TJOY_2HOM_656YP%3Fpc%3Dhttp%253A%252F%252Fwww.rakuten.co.jp%252F%26m%3Dhttp%253A%252F%252Fm.rakuten.co.jp%252F" rel="nofollow" target="_blank"><img src="https://hbb.afl.rakuten.co.jp/hsb/0ec09ba3.bc2429d5.0eb4bbaa.95151395/" border="0"></a><img border="0" width="1" height="1" src="https://www19.a8.net/0.gif?a8mat=4B7ZH5+72TJOY+2HOM+656YP" alt="">';

const AD_SLOTS: Record<string, string | null> = {
  news_top: AD_A8_RAKUTEN, // ニュース最上部
  news_inline: null,
  sidebar: null,
  // トップのシグナル検知の上(最も目立つ枠 → 300x250)
  signal_top: AD_A8_300x250,
  // 料金ページ下部(三井住友カード等に差し替え予定。当面は 250x250)
  footer: AD_A8_250x250,
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
