// ページ遷移時に即座に表示されるローディング(体感速度向上)
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" />
    </div>
  );
}
