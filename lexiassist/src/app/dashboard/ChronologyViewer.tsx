"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCaseChronology } from "@/app/actions/chronology";
import { Loader2, Clock, CalendarDays, ShieldCheck, Quote, Network, AlertTriangle } from "lucide-react";

interface TimelineEvent {
  eventDate: string;
  description: string;
  verifiableSourceCitation: string;
  verified: boolean;
}

const themeColors = [
  { text: "text-emerald-500", border: "border-emerald-500", borderHover: "hover:border-emerald-500/50", bgHover: "hover:bg-emerald-950/10", badgeBg: "bg-emerald-950/30", badgeBorder: "border-emerald-900/50", dot: "bg-emerald-400", shadow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" },
  { text: "text-blue-500", border: "border-blue-500", borderHover: "hover:border-blue-500/50", bgHover: "hover:bg-blue-950/10", badgeBg: "bg-blue-950/30", badgeBorder: "border-blue-900/50", dot: "bg-blue-400", shadow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
  { text: "text-violet-500", border: "border-violet-500", borderHover: "hover:border-violet-500/50", bgHover: "hover:bg-violet-950/10", badgeBg: "bg-violet-950/30", badgeBorder: "border-violet-900/50", dot: "bg-violet-400", shadow: "shadow-[0_0_15px_rgba(139,92,246,0.3)]" },
  { text: "text-amber-500", border: "border-amber-500", borderHover: "hover:border-amber-500/50", bgHover: "hover:bg-amber-950/10", badgeBg: "bg-amber-950/30", badgeBorder: "border-amber-900/50", dot: "bg-amber-400", shadow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]" }
];

export default function ChronologyViewer({ activeCaseId }: { activeCaseId: string }) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChronology = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCaseChronology(activeCaseId);
      if (result.success && result.timeline) {
        let rawTimeline = result.timeline;
        if (typeof rawTimeline === "string") {
          try { rawTimeline = JSON.parse(rawTimeline); } catch (e) {}
        }
        if (Array.isArray(rawTimeline)) {
          setTimeline(rawTimeline as unknown as TimelineEvent[]);
        } else if (rawTimeline && typeof rawTimeline === "object" && Array.isArray((rawTimeline as any).events)) {
          setTimeline((rawTimeline as any).events as unknown as TimelineEvent[]);
        } else {
          setTimeline([]);
        }
      } else {
        setTimeline([]);
      }
    } catch (error) {
      console.error("Failed to retrieve chronology matrix:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCaseId]);

  // Hook 1: Fetch on mount or ID change
  useEffect(() => {
    if (activeCaseId) fetchChronology();
  }, [activeCaseId, fetchChronology]);

  // Hook 2: The Global Event Listener (MUST BE ABOVE THE LOADING RETURN)
  useEffect(() => {
    const handleRefresh = () => {
      fetchChronology();
    };
    window.addEventListener('refresh-case-data', handleRefresh);
    return () => window.removeEventListener('refresh-case-data', handleRefresh);
  }, [fetchChronology]);

  // EARLY RETURNS MUST GO AFTER ALL HOOKS
  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center space-y-4 opacity-70">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Synthesizing Temporal Matrix...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#08080a] overflow-hidden rounded-2xl">
      <div className="border-b border-zinc-800/60 bg-[#0c0c0e] px-6 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-sm z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-950/30 border border-emerald-900/50 rounded-lg"><Network className="w-4 h-4 text-emerald-500" /></div>
            <h2 className="text-lg font-medium text-zinc-100 tracking-wide">Temporal Matrix</h2>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-11">// Chronological extraction from verified case documents</p>
        </div>
        <div className="flex items-center gap-3">
           <span className="px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
             <Clock className="w-3 h-3 text-emerald-500" /> {timeline.length} Events Mapped
           </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800 relative bg-[#0a0a0c]">
        {timeline.length === 0 ? (
          <div className="flex flex-col h-full w-full items-center justify-center p-8 text-center border border-dashed border-zinc-800/60 rounded-2xl bg-[#0c0c0e]/30">
            <CalendarDays className="w-12 h-12 text-zinc-700 mb-4" />
            <h3 className="text-zinc-200 font-medium tracking-wide mb-2">No Chronology Established</h3>
            <p className="text-zinc-500 text-sm max-w-md mb-6 leading-relaxed">The AI has not yet extracted a timeline for this case. Navigate to the AI Intake Chat and run a timeline extraction prompt.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto relative pt-4 pb-12">
            <div className="absolute left-6 sm:left-35 top-4 bottom-0 w-0.5 bg-linear-to-b from-zinc-700 via-zinc-800 to-transparent rounded-full" />
            <AnimatePresence>
              {timeline.map((item, index) => {
                const theme = themeColors[index % themeColors.length];
                
                return (
                  <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.4, type: "spring" }} className="relative flex flex-col sm:flex-row items-start gap-8 sm:gap-14 mb-12 group">
                    <div className="w-30 shrink-0 hidden sm:flex flex-col items-end text-right z-10 pt-2">
                      <span className={`text-sm font-bold ${theme.text} drop-shadow-md transition-colors`}>{item.eventDate}</span>
                      <span className="text-[9px] font-mono uppercase tracking-widest mt-1 text-zinc-500 group-hover:text-zinc-400 transition-colors">Event {index + 1}</span>
                    </div>

                    <div className={`absolute left-6 sm:left-35 w-6 h-6 -ml-2.75 mt-1.5 rounded-full bg-[#08080a] border-[3px] ${theme.border} flex items-center justify-center z-20 ${theme.shadow} group-hover:scale-125 transition-all duration-300`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${theme.dot} animate-pulse`} />
                    </div>

                    <div className="flex-1 pl-14 sm:pl-0 w-full z-10">
                      <div className="sm:hidden mb-3"><span className={`text-xs font-mono font-bold ${theme.text}`}>{item.eventDate}</span></div>

                      <div className={`p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 ${theme.borderHover} ${theme.bgHover} transition-all duration-300 shadow-xl group-hover:-translate-y-1`}>
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">// Chronological Record</p>
                          {item.verified ? (
                            <span className={`flex items-center gap-1.5 text-[9px] font-mono ${theme.text} ${theme.badgeBg} px-2.5 py-1 rounded-md border ${theme.badgeBorder} uppercase tracking-wider`}><ShieldCheck className="w-3 h-3" /> Source Verified</span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[9px] font-mono text-amber-500 bg-amber-950/30 px-2.5 py-1 rounded-md border border-amber-900/50 uppercase tracking-wider"><AlertTriangle className="w-3 h-3" /> Unverified Hallucination</span>
                          )}
                        </div>

                        <p className="text-sm text-zinc-200 leading-relaxed font-medium mb-5">{item.description}</p>
                        
                        {item.verifiableSourceCitation && (
                          <div className={`bg-[#08080a] p-4 rounded-xl border relative overflow-hidden transition-colors ${item.verified ? "border-zinc-800/80 group-hover:border-zinc-700" : "border-amber-900/50"}`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.verified ? "bg-zinc-700/50" : "bg-amber-600/50"}`} />
                            <div className="flex gap-3">
                              <Quote className={`w-4 h-4 ${item.verified ? theme.text : "text-amber-500"} shrink-0 mt-0.5 opacity-80`} />
                              <div className="space-y-1">
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Extracted Document Citation</p>
                                <p className={`text-xs leading-relaxed italic ${item.verified ? "text-zinc-400" : "text-amber-500/80"}`}>"{item.verifiableSourceCitation}"</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}