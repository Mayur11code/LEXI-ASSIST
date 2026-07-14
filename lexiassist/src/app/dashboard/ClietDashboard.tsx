// src/app/dashboard/ClientDashboard.tsx
"use client";

import { useState, useTransition } from "react";
import { createNewCase } from "@/lib/tools/actions/case";

// Define the shape of our case data
type CaseBrief = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
};

export default function ClientDashboard({ initialCases }: { initialCases: CaseBrief[] }) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseBrief[]>(initialCases);
  const [error, setError] = useState<string | null>(null);
  
  const [isPending, startTransition] = useTransition();

  // Handle Tab Switching with Lock Logic
  const handleTabClick = (tabIndex: number) => {
    if (tabIndex > 1 && !selectedCaseId) {
      setError("You must create or select a case before accessing this tab.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setActiveTab(tabIndex);
  };

  // Handle New Case Creation
  const handleCreateCase = () => {
    setError(null);
    startTransition(async () => {
      const result = await createNewCase();
      
      if (result.success && result.caseBrief) {
        setCases([result.caseBrief as CaseBrief, ...cases]);
        setSelectedCaseId(result.caseId);
        setActiveTab(2); // Instantly teleport the user to the Chat tab
      } else {
        setError(result.error || "System error during case initialization.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-200 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* SPA NAVIGATION TABS */}
        <div className="flex items-center space-x-2 border-b border-zinc-800/60 pb-4">
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
                  px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-widest transition-all
                  ${isActive 
                    ? "bg-zinc-100 text-zinc-900 shadow-lg shadow-zinc-100/10" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                  }
                  ${isLocked ? "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-500" : ""}
                `}
              >
                {tab.label} {isLocked && "🔒"}
              </button>
            );
          })}
        </div>

        {/* ERROR TOAST */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-900/50 text-rose-400 p-4 rounded-xl text-xs font-mono animate-in fade-in slide-in-from-top-2">
            [System Alert]: {error}
          </div>
        )}

        {/* TAB 1: MAIN DASHBOARD (Case Initialization) */}
        {activeTab === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-light text-white">Active Case Files</h2>
                <p className="text-xs text-zinc-500 font-mono mt-1">// Select an existing file or initialize a new triage sequence.</p>
              </div>
              <button
                onClick={handleCreateCase}
                disabled={isPending}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <><span className="h-2 w-2 rounded-full bg-zinc-900 animate-ping" /> Initializing...</>
                ) : (
                  "+ New Case"
                )}
              </button>
            </div>

            {/* Case Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cases.length === 0 ? (
                <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-zinc-500 font-mono text-sm">No active case briefs found in your matrix.</p>
                </div>
              ) : (
                cases.map((caseItem) => (
                  <div 
                    key={caseItem.id}
                    onClick={() => {
                      setSelectedCaseId(caseItem.id);
                      setActiveTab(2);
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer group
                      ${selectedCaseId === caseItem.id 
                        ? "border-emerald-500/50 bg-emerald-950/10" 
                        : "border-zinc-800/60 bg-[#0c0c0e]/80 hover:border-zinc-700"
                      }
                    `}
                  >
                    <h3 className="text-zinc-200 font-medium">{caseItem.title}</h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                        {caseItem.status}
                      </span>
                      <span className="text-[10px] text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider font-bold">
                        Open →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI CHAT (Placeholder for Phase 3) */}
        {activeTab === 2 && (
          <div className="animate-in fade-in duration-300 border border-zinc-800/60 bg-[#0c0c0e]/80 rounded-2xl h-150 flex items-center justify-center">
            <p className="text-zinc-500 font-mono text-sm">AI Chat Interface goes here for Case ID: {selectedCaseId}</p>
          </div>
        )}

        {/* TAB 3: REDLINES (Placeholder for Phase 4) */}
        {activeTab === 3 && (
          <div className="animate-in fade-in duration-300 border border-zinc-800/60 bg-[#0c0c0e]/80 rounded-2xl h-150 flex items-center justify-center">
            <p className="text-zinc-500 font-mono text-sm">Document Redlines Split-Screen goes here.</p>
          </div>
        )}

        {/* TAB 4: CHRONOLOGY (Placeholder for Phase 4) */}
        {activeTab === 4 && (
          <div className="animate-in fade-in duration-300 border border-zinc-800/60 bg-[#0c0c0e]/80 rounded-2xl h-150 flex items-center justify-center">
            <p className="text-zinc-500 font-mono text-sm">Timeline Visualizer goes here.</p>
          </div>
        )}

      </div>
    </div>
  );
}