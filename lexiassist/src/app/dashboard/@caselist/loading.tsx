export default function CaseListLoading() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-[#0c0c0e]/30 p-6 h-96 animate-pulse">
      <div className="h-4 w-32 bg-zinc-800 rounded mb-4"></div>
      <div className="space-y-3 mt-8">
        <div className="h-12 w-full bg-zinc-800/50 rounded-lg"></div>
        <div className="h-12 w-full bg-zinc-800/50 rounded-lg"></div>
        <div className="h-12 w-full bg-zinc-800/50 rounded-lg"></div>
      </div>
    </div>
  );
}