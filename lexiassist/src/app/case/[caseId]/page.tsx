// src/app/case/[caseId]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CaseDetailPage({ 
  params 
}: { 
  params: Promise<{ caseId: string }> 
}) {
  // Await the params to get the dynamic ID from the URL
  const { caseId } = await params;

  // Query Prisma for this exact case and include the client data
  const caseBrief = await prisma.caseBrief.findUnique({
    where: { id: caseId },
    include: { client: true },
  });

  // If the case doesn't exist, trigger Next.js 404
  if (!caseBrief) {
    notFound();
  }

  // Parse JSON data safely
  const clientName = caseBrief.client?.name || caseBrief.client?.email || "Unknown Client";
  const riskAnalysis = caseBrief.aiRiskAnalysis as any || {};

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-200 p-6 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Status Header */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Triage
          </Link>
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-mono border border-zinc-800 text-emerald-500 uppercase">
            {caseBrief.status}
          </span>
        </div>

        {/* Case Title & Client */}
        <div className="border-b border-zinc-800/60 pb-8">
          <h1 className="text-3xl lg:text-4xl font-light tracking-wide text-white mb-2">
            {caseBrief.title}
          </h1>
          <p className="font-mono text-sm text-zinc-500">
            Client: {clientName} • Received {new Date(caseBrief.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Main Brief Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Raw Intake */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-zinc-800/60 bg-[#0c0c0e]/80 p-6">
              <h3 className="text-xs font-mono tracking-widest text-zinc-400 uppercase mb-4 border-b border-zinc-800/60 pb-2">
                Raw Client Description
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {caseBrief.rawDescription}
              </p>
            </div>
          </div>

          {/* Right Column: AI Analysis Stack */}
          <div className="space-y-6">
            
            {/* Risk & Value Block */}
            <div className="rounded-2xl border border-zinc-800/60 bg-rose-950/10 p-6 border-l-2 border-l-rose-500 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-mono tracking-widest text-rose-400 uppercase mb-1">
                  AI Risk Assessment
                </h3>
                <div className="text-4xl font-light text-rose-500">
                  {riskAnalysis?.riskScore || "N/A"}%
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-[10px] font-mono tracking-widest text-emerald-500 uppercase mb-1">
                  Est. Case Value
                </h3>
                <div className="text-xl font-medium text-emerald-400">
                  {caseBrief.estimatedValue ? `$${caseBrief.estimatedValue.toLocaleString()}` : "Pending"}
                </div>
              </div>
            </div>

            {/* Extracted Entities */}
            <div className="rounded-2xl border border-zinc-800/60 bg-[#0c0c0e]/80 p-6">
              <h3 className="text-xs font-mono tracking-widest text-blue-400 uppercase mb-4 border-b border-zinc-800/60 pb-2">
                Extracted Entities
              </h3>
              <div className="text-sm text-zinc-400 font-mono space-y-2">
                {/* Fallback UI if JSON is empty */}
                {!caseBrief.aiEntities ? (
                  <span className="italic text-zinc-600">Awaiting AI extraction...</span>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(caseBrief.aiEntities, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Case Chronology / Timeline */}
            <div className="rounded-2xl border border-zinc-800/60 bg-[#0c0c0e]/80 p-6">
              <h3 className="text-xs font-mono tracking-widest text-amber-500 uppercase mb-4 border-b border-zinc-800/60 pb-2">
                Generated Timeline
              </h3>
              <div className="text-sm text-zinc-400 font-mono space-y-2">
                {!caseBrief.aiTimeline ? (
                  <span className="italic text-zinc-600">Awaiting chronological mapping...</span>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(caseBrief.aiTimeline, null, 2)}
                  </pre>
                )}
              </div>
            </div>

          </div>
          

        </div>
      </div>
    </div>
  );
}