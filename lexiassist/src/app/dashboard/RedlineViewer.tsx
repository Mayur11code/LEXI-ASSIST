"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCaseDocument } from "@/app/actions/document"; 
import { Loader2, AlertTriangle, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

interface FlaggedClause {
  originalTextSnippet: string;
  riskSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggestedRedline: string;
  rationale: string;
  verified: boolean;
}

export default function RedlineViewer({ activeCaseId }: { activeCaseId: string }) {
  const [documentData, setDocumentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCaseDocument(activeCaseId);
      if (result.success && result.document) {
        let doc = result.document;
        if (typeof doc.redlines === 'string') {
          try { doc.redlines = JSON.parse(doc.redlines); } 
          catch (e) { doc.redlines = []; }
        }
        setDocumentData(doc);
      } else {
        setDocumentData(null);
      }
    } catch (error) {
      console.error("Failed to retrieve document matrix:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCaseId]);

  // Hook 1: Initial fetch
  useEffect(() => {
    if (activeCaseId) fetchDocument();
  }, [activeCaseId, fetchDocument]);

  // Hook 2: Global listener (MUST BE ABOVE EARLY RETURNS)
  useEffect(() => {
    const handleRefresh = () => {
      fetchDocument();
    };
    window.addEventListener('refresh-case-data', handleRefresh);
    return () => window.removeEventListener('refresh-case-data', handleRefresh);
  }, [fetchDocument]);

  const severityStyles: Record<string, { border: string; bg: string; text: string; icon: any }> = {
    CRITICAL: { border: "border-rose-500/50", bg: "bg-rose-950/20", text: "text-rose-400", icon: AlertTriangle },
    HIGH: { border: "border-orange-500/50", bg: "bg-orange-950/20", text: "text-orange-400", icon: AlertTriangle },
    MEDIUM: { border: "border-amber-500/50", bg: "bg-amber-950/20", text: "text-amber-400", icon: ShieldCheck },
    LOW: { border: "border-emerald-500/50", bg: "bg-emerald-950/20", text: "text-emerald-400", icon: CheckCircle2 },
  };

  const redlines: FlaggedClause[] = Array.isArray(documentData?.redlines) ? documentData.redlines : [];
  const filteredRedlines = activeFilter ? redlines.filter((r) => r.riskSeverity === activeFilter) : redlines;

  // EARLY RETURNS
  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center space-y-4 opacity-70">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Decrypting Document Matrix...</p>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-8 text-center border border-dashed border-zinc-800/60 rounded-2xl bg-[#0c0c0e]/30">
        <FileText className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-zinc-200 font-medium tracking-wide mb-2">No Documents Found</h3>
        <p className="text-zinc-500 text-sm max-w-md">
          You must attach a PDF via the AI Intake Chat before the Redline extraction engine can process anomalies.
        </p>
      </div>
    );
  }

  const isPendingExtraction = documentData.extractedText === "Pending extraction..." || redlines.length === 0;

  return (
    <div className="w-full h-full flex flex-col lg:flex-row rounded-2xl overflow-hidden font-sans">
      <div className="w-full lg:w-1/2 h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-zinc-800/60 flex flex-col bg-[#08080a]">
        <div className="border-b border-zinc-800/60 bg-zinc-900/40 px-6 py-4 flex justify-between items-center shrink-0">
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-2">
            <FileText className="w-3 h-3" /> Source Document
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">ID: {documentData.id.slice(0, 8)}</span>
        </div>
        <div className="flex-1 w-full relative bg-zinc-950">
          {documentData.fileUrl ? (
            <iframe src={`${documentData.fileUrl}#toolbar=0&view=FitH`} className="w-full h-full border-none invert-[0.9] hue-rotate-180 opacity-90 contrast-125" title="Original Document View" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-mono text-xs">[No valid file URL mapped]</div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-1/2 h-[50vh] lg:h-full flex flex-col bg-[#0c0c0e]">
        <div className="border-b border-zinc-800/60 bg-zinc-900/20 px-6 py-4 shrink-0 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">// Automated Risk Assessment</span>
            <div className="flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${isPendingExtraction ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
              <span className="text-[10px] font-mono text-zinc-400">
                {isPendingExtraction ? "Processing Layout..." : `${redlines.length} Anomalies Flagged`}
              </span>
            </div>
          </div>
          
          {!isPendingExtraction && redlines.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setActiveFilter(null)} className={`px-3 py-1 rounded-md text-[10px] font-mono border transition-all uppercase tracking-wider ${!activeFilter ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-bold" : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"}`}>ALL</button>
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((tier) => (
                <button key={tier} onClick={() => setActiveFilter(tier)} className={`px-3 py-1 rounded-md text-[10px] font-mono border transition-all uppercase tracking-wider ${activeFilter === tier ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-bold" : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"}`}>{tier}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
          {isPendingExtraction ? (
             <div className="h-full flex flex-col items-center justify-center py-12">
               <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
               <p className="text-zinc-300 font-medium">QStash Engine Active</p>
               <p className="text-zinc-500 text-xs mt-2 font-mono max-w-62.5 text-center text-balance">Awaiting structural analysis payload and vector verification from the legal agent...</p>
             </div>
          ) : filteredRedlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-zinc-800/60 rounded-xl py-12 mt-4 bg-zinc-900/10">
              <ShieldCheck className="w-10 h-10 text-emerald-500/50 mb-3" />
              <p className="text-zinc-400 font-medium text-xs uppercase tracking-wider">Tier Clear</p>
              <p className="text-zinc-500 font-mono text-[10px] mt-1">// No risk anomalies detected in this category.</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredRedlines.map((clause, index) => {
                const style = severityStyles[clause.riskSeverity] || severityStyles.MEDIUM;
                const Icon = style.icon;

                return (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`p-5 rounded-2xl border ${style.border} ${style.bg} flex flex-col gap-4 shadow-sm`}>
                    <div className="flex justify-between items-start gap-4 border-b border-zinc-800/40 pb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${style.text}`} />
                        <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${style.text}`}>{clause.riskSeverity} RISK</span>
                      </div>
                      {clause.verified ? (
                        <span className="text-[9px] font-mono text-emerald-500 border border-emerald-900/50 bg-emerald-950/30 px-2 py-0.5 rounded tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> VERIFIED</span>
                      ) : (
                        <span className="text-[9px] font-mono text-amber-500 border border-amber-900/50 bg-amber-950/30 px-2 py-0.5 rounded tracking-widest flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> UNVERIFIED HALLUCINATION</span>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">// Source Text Snippet:</p>
                        <blockquote className={`text-xs text-zinc-400 italic leading-relaxed bg-zinc-950/50 p-3 rounded-lg border ${clause.verified ? "border-zinc-900" : "border-amber-900/30 text-amber-500/70"}`}>"{clause.originalTextSnippet}"</blockquote>
                      </div>
                      <div>
                        <p className="text-[9px] font-mono text-emerald-500/70 uppercase tracking-widest mb-1.5">// Suggested Redline:</p>
                        <p className="text-xs text-zinc-200 font-medium leading-relaxed bg-emerald-950/10 p-3 rounded-lg border border-emerald-900/30">{clause.suggestedRedline}</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">// Legal Rationale:</p>
                        <p className="text-xs text-zinc-400 leading-relaxed font-light">{clause.rationale}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
