"use client";

import { useState, useTransition } from "react";
import { createNewCase } from "@/lib/tools/actions/case";
import { Loader2, Plus, Lock, Briefcase, AlertTriangle, DollarSign, Scale } from "lucide-react";

import ChatInterface from "./ChatInterface";
import RedlineViewer from "./RedlineViewer";
import ChronologyViewer from "./ChronologyViewer";

// Enhanced CaseBrief type directly mapping to your Prisma DB
type CaseBrief = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  rawDescription?: string;
  estimatedValue?: number | null;
  aiRiskAnalysis?: any | null; 
  lawyerId?: string | null;
};

export default function ClientDashboard({ initialCases }: { initialCases: CaseBrief[] }) {
  // --- SPA ROUTING STATE ---
  const [activeTab, setActiveTab] = useState<number>(1);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  
  // --- DATA STATE ---
  const [cases, setCases] = useState<CaseBrief[]>(initialCases);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // --- HANDLERS ---
  const handleTabClick = (tabIndex: number) => {
    if (tabIndex > 1 && !selectedCaseId) {
      setError("You must create or select a case matrix before accessing this workspace.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setActiveTab(tabIndex);
  };

  const handleCreateCase = () => {
    setError(null);
    startTransition(async () => {
      const result = await createNewCase("New Legal Inquiry");
      
      if (result.success && result.caseBrief) {
        setCases([result.caseBrief as CaseBrief, ...cases]);
        setSelectedCaseId(result.caseId);
        setActiveTab(2); // Instantly route to Chat Tab
      } else {
        setError(result.error || "System error during case initialization.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 p-4 sm:p-6 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ========================================= */}
        {/* SPA NAVIGATION TABS                       */}
        {/* ========================================= */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/60 pb-5">
          {[
            { id: 1, label: "Case Portfolio" },
            { id: 2, label: "AI Intake Chat" },
            { id: 3, label: "Document Redlines" },
            { id: 4, label: "Case Chronology" },
          ].map((tab) => {
            const isLocked = tab.id > 1 && !selectedCaseId;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-mono uppercase tracking-widest transition-all
                  ${isActive 
                    ? "bg-zinc-100 text-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.1)] font-bold" 
                    : "bg-[#0a0a0c] text-zinc-500 border border-zinc-800/60 hover:text-zinc-300 hover:bg-zinc-900/50"
                  }
                  ${isLocked ? "opacity-40 cursor-not-allowed hover:bg-[#0a0a0c] hover:text-zinc-500" : ""}
                `}
              >
                {tab.label} {isLocked && <Lock className="w-3 h-3" />}
              </button>
            );
          })}
        </div>

        {/* ========================================= */}
        {/* SYSTEM ALERT TOAST                        */}
        {/* ========================================= */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-900/50 text-rose-400 p-4 rounded-xl text-xs font-mono animate-in fade-in slide-in-from-top-2 flex items-center gap-3 shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            [System Alert]: {error}
          </div>
        )}

        {/* ========================================= */}
        {/* TAB WORKSPACES (CSS Memory Persistence)   */}
        {/* ========================================= */}

        {/* TAB 1: CASE PORTFOLIO */}
        <div className={activeTab === 1 ? "block animate-in fade-in duration-300" : "hidden"}>
          <div className="space-y-6">
            
            {/* Header & Create Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-[#0a0a0c] border border-zinc-800/60 rounded-3xl shadow-sm">
              <div>
                <h2 className="text-2xl font-light text-zinc-100 tracking-wide">Active Case Files</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">// Select an existing file or initialize a new triage sequence.</p>
              </div>
              <button
                onClick={handleCreateCase}
                disabled={isPending}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] shrink-0"
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Initializing...</>
                ) : (
                  <><Plus className="w-4 h-4" /> New Case</>
                )}
              </button>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cases.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-zinc-800/60 rounded-3xl bg-[#0a0a0c]/50">
                  <Briefcase className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">No active case briefs found.</p>
                </div>
              ) : (
                cases.map((caseItem) => {
                  
                  // Extract dynamic DB data
                  const hasRisks = caseItem.aiRiskAnalysis && typeof caseItem.aiRiskAnalysis === 'object';
                  const riskFlags = hasRisks ? (caseItem.aiRiskAnalysis as any).primaryLegalRisks?.length || 0 : 0;
                  const valueString = caseItem.estimatedValue ? `$${caseItem.estimatedValue.toLocaleString()}` : null;
                  const isMatched = !!caseItem.lawyerId;

                  return (
                    <div 
                      key={caseItem.id}
                      onClick={() => {
                        setSelectedCaseId(caseItem.id);
                        setActiveTab(2);
                      }}
                      className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-45 relative overflow-hidden
                        ${selectedCaseId === caseItem.id 
                          ? "border-emerald-500/50 bg-emerald-950/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]" 
                          : "border-zinc-800/60 bg-[#0a0a0c] hover:border-zinc-600 hover:bg-[#0c0c0e]"
                        }
                      `}
                    >
                      {/* Active Indicator Strip */}
                      {selectedCaseId === caseItem.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                      )}

                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-zinc-200 font-medium tracking-wide truncate pr-4 text-lg">{caseItem.title}</h3>
                          <span className={`text-[9px] font-mono px-2.5 py-1 rounded-md border uppercase tracking-widest shrink-0
                            ${caseItem.status === 'MATCHED' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' : 
                              caseItem.status === 'REVIEW' ? 'bg-amber-950/30 text-amber-400 border-amber-900/50' : 
                              'bg-zinc-900 text-zinc-400 border-zinc-800'}
                          `}>
                            {caseItem.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-mono truncate uppercase tracking-widest">ID: {caseItem.id.split('-')[0]}</p>
                      </div>

                      {/* Dynamic DB Badges */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {isMatched && (
                          <div className="flex items-center gap-1 bg-emerald-950/20 border border-emerald-900/30 px-2 py-1 rounded text-[9px] font-mono text-emerald-500 uppercase tracking-widest">
                            <Scale className="w-3 h-3" /> Attorney Matched
                          </div>
                        )}
                        {valueString && (
                          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                            <DollarSign className="w-3 h-3" /> Est: {valueString}
                          </div>
                        )}
                        {riskFlags > 0 && (
                          <div className="flex items-center gap-1 bg-rose-950/20 border border-rose-900/30 px-2 py-1 rounded text-[9px] font-mono text-rose-500 uppercase tracking-widest">
                            <AlertTriangle className="w-3 h-3" /> {riskFlags} Risks
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-6 border-t border-zinc-800/50 pt-4">
                        <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                          {new Date(caseItem.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest font-bold flex items-center gap-1">
                          Open Workspace →
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* SECURE WORKSPACES (Mounted in Background) */}
        {/* ========================================= */}
        {selectedCaseId && (
          <>
            <div className={activeTab === 2 ? "block animate-in fade-in duration-300" : "hidden"}>
              <ChatInterface activeCaseId={selectedCaseId} cases={cases} onSwitchCase={setSelectedCaseId} />
            </div>

            <div className={activeTab === 3 ? "block animate-in fade-in duration-300" : "hidden"}>
              <div className="border border-zinc-800/60 bg-[#08080a] rounded-2xl h-175 shadow-2xl overflow-hidden">
                <RedlineViewer activeCaseId={selectedCaseId} />
              </div>
            </div>

            <div className={activeTab === 4 ? "block animate-in fade-in duration-300" : "hidden"}>
               <div className="border border-zinc-800/60 bg-[#08080a] rounded-2xl h-175 shadow-2xl overflow-hidden">
                <ChronologyViewer activeCaseId={selectedCaseId} />
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}