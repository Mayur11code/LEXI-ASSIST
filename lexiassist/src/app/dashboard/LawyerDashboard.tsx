"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { acceptCase, resolveCase } from "@/app/actions/lawyer";
import { getOrInitializeConsultation } from "@/app/actions/consultation";
import RedlineViewer from "./RedlineViewer";
import ChronologyViewer from "./ChronologyViewer";
import PreBriefViewer from "./PreBriefViewer";
import ConsultationRoom from "./ConsultationRoom";
import DirectMessagePanel from "./DirectMessagePanel";
import { Loader2, CheckCircle2, MessageSquare, Briefcase, AlertTriangle, Video } from "lucide-react"; // Added Video

interface LawyerDashboardProps {
  initialCases: any[];
}

export default function LawyerDashboard({ initialCases }: LawyerDashboardProps) {
  const [cases, setCases] = useState(initialCases);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(cases[0]?.id || null);
  const [activeTab, setActiveTab] = useState(1);
  const [isAccepting, setIsAccepting] = useState(false);

  // --- WEBRTC STATE ---
  const [isRoomActive, setIsRoomActive] = useState(false);
  const [roomData, setRoomData] = useState<{ id: string, webrtcRoomId: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const activeCase = cases.find((c) => c.id === activeCaseId);

  const handleAcceptCase = async () => {
    if (!activeCaseId) return;
    setIsAccepting(true);
    
    const result = await acceptCase(activeCaseId);
    if (result.success) {
      setCases((prev) => 
        // Upgrades status from MATCHED to REVIEW as per the schema
        prev.map((c) => c.id === activeCaseId ? { ...c, status: "REVIEW" } : c)
      );
    }
    setIsAccepting(false);
  };

  // --- WEBRTC HANDLER ---
  const handleJoinRoom = async () => {
    if (!activeCaseId) return;
    setIsJoining(true);
    
    // Fetches or creates the room hash securely
    const result = await getOrInitializeConsultation(activeCaseId);
    
    if (result.success && result.consultation) {
      setRoomData({
        id: result.consultation.id,
        webrtcRoomId: result.consultation.webrtcRoomId
      });
      setIsRoomActive(true);
    }
    setIsJoining(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden bg-[#08080a] text-zinc-200">
      
      {/* LEFT PANE: Case Queue */}
      <div className="w-80 shrink-0 border-r border-zinc-800/60 bg-[#0c0c0e] flex flex-col">
        <div className="p-5 border-b border-zinc-800/60 bg-zinc-900/20">
          <h2 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5" />
            Active Mandates
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {cases.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 opacity-50">
              <span className="text-xl mb-2">⚖️</span>
              <p className="text-xs text-zinc-500 font-mono text-center uppercase tracking-widest">No Active Mandates</p>
            </div>
          )}
          
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCaseId(c.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                activeCaseId === c.id 
                  ? "bg-emerald-950/20 border-emerald-900/50" 
                  : "bg-transparent border-zinc-800/40 hover:bg-zinc-900/40"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  c.status === "REVIEW" 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : c.status === "RESOLVED"
                    ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}>
                  {c.status}
                </span>
                <span className="text-[9px] text-zinc-600 font-mono">
                  {new Date(c.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-sm font-medium text-zinc-200 truncate">{c.title || "Untitled Intake"}</h3>
              <p className="text-xs text-zinc-500 mt-1 truncate">
                Client: {c.client?.name || "Confidential"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANE: Master Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#08080a]">
        {activeCase ? (
          <>
            {/* Case Header & Actions */}
            <header className="p-6 border-b border-zinc-800/60 bg-zinc-900/10 flex justify-between items-end shrink-0">
              <div className="max-w-2xl">
                <h1 className="text-2xl font-light tracking-wide text-zinc-100">{activeCase.title || "Untitled Intake"}</h1>
                <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest truncate">
                  ID: {activeCase.id}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {activeCase.status === "REVIEW" ? (
                  <div className="flex gap-3">
                    <button
                    onClick={() => setIsChatOpen(true)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-widest rounded-lg transition-all">
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </button>
                    <button 
                      onClick={handleJoinRoom}
                      disabled={isJoining}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                    >
                      {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                      Join Room
                    </button>
                    <button 
                      onClick={async () => {
                        setIsResolving(true);
                        const result = await resolveCase(activeCase.id);
                        if (result.success) {
                          // Instantly update local state so the UI reacts without reloading
                          setCases((prev) => 
                            prev.map((c) => c.id === activeCase.id ? { ...c, status: "RESOLVED" } : c)
                          );
                          window.dispatchEvent(new Event('refresh-case-data'));
                        }
                        setIsResolving(false);
                      }}
                      disabled={isResolving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                    >
                      {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Resolve Matrix
                    </button>
                  </div>
                ) : activeCase.status === "RESOLVED" ? (
                   <span className="px-4 py-2 border border-zinc-800 bg-zinc-900/50 rounded-lg text-zinc-500 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2">
                     <CheckCircle2 className="w-3 h-3" /> Mandate Resolved
                   </span>
                ) : (
                  <button 
                    onClick={handleAcceptCase}
                    disabled={isAccepting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50"
                  >
                    {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Accept Case
                  </button>
                )}
              </div>
            </header>

            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-800/60 bg-[#0a0a0c] px-6">
              {[
                { id: 1, label: "AI Pre-Brief & Risks" },
                { id: 2, label: "Document Redlines" },
                { id: 3, label: "Chronology Map" },
                { id: 4, label: "Case Analytics" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-xs font-mono uppercase tracking-widest transition-colors relative ${
                    activeTab === tab.id ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="lawyerTabIndicator" className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Dynamic Workspace Content */}
            <div className="flex-1 overflow-hidden p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full w-full rounded-2xl border border-zinc-800/60 bg-[#0c0c0e] shadow-2xl overflow-hidden flex flex-col"
                >
                 {/* TAB 1: DB Brief & Risks */}
                 {activeTab === 1 && (
                    <PreBriefViewer activeCaseId={activeCase.id} />
                 )}

                  {/* TAB 2: Redline Viewer */}
                  {activeTab === 2 && (
                    <RedlineViewer activeCaseId={activeCase.id} />
                  )}

                  {/* TAB 3: Chronology Viewer */}
                  {activeTab === 3 && (
                    <ChronologyViewer activeCaseId={activeCase.id} />
                  )}
                  {/* TAB 4: Case Analytics */}
                  {activeTab === 4 && (
                    <div className="p-8 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                      <div className="max-w-3xl mx-auto">
                        <h3 className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Workload Distribution
                        </h3>
                        
                        {(() => {
                          // Compute metrics instantly from local state
                          const totalCases = cases.length;
                          const getCount = (status: string) => cases.filter((c) => c.status === status).length;
                          const getPercent = (count: number) => totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;

                          const metrics = [
                            { label: "New Matches", count: getCount('MATCHED'), percentage: getPercent(getCount('MATCHED')), color: "bg-blue-500", stroke: "#3b82f6" },
                            { label: "Under Review", count: getCount('REVIEW'), percentage: getPercent(getCount('REVIEW')), color: "bg-amber-500", stroke: "#f59e0b" },
                            { label: "Resolved", count: getCount('RESOLVED'), percentage: getPercent(getCount('RESOLVED')), color: "bg-emerald-500", stroke: "#10b981" },
                          ];

                          return (
                            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 p-8 shadow-xl flex flex-col md:flex-row items-center gap-12">
                              
                              {/* Left: Modern Center Graph Matrix */}
                              <div className="relative flex flex-col items-center justify-center p-6 bg-[#08080a] rounded-xl border border-zinc-800/40 shrink-0 shadow-inner">
                                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 36 36">
                                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#18181b" strokeWidth="2.5" />
                                  {metrics.map((m, i) => {
                                    const offset = i === 0 ? 0 : i === 1 ? -(metrics[0].percentage) : -(metrics[0].percentage + metrics[1].percentage);
                                    if (m.percentage === 0) return null;
                                    return (
                                      <circle 
                                        key={i} 
                                        cx="18" cy="18" r="15.915" fill="none" 
                                        stroke={m.stroke} strokeWidth="2.5" 
                                        strokeDasharray={`${m.percentage} 100`} 
                                        strokeDashoffset={offset} 
                                        className="transition-all duration-1000 ease-out"
                                      />
                                    );
                                  })}
                                </svg>
                                <div className="absolute text-center flex flex-col items-center justify-center">
                                  <span className="text-3xl font-light tracking-tight text-zinc-100">{totalCases}</span>
                                  <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-widest mt-1">Total Cases</span>
                                </div>
                              </div>

                              {/* Right: Metrics Stack */}
                              <div className="flex-1 w-full space-y-6">
                                {metrics.map((m, idx) => (
                                  <div key={idx} className="space-y-2 group">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-zinc-300 font-medium flex items-center gap-3">
                                        <span className={`h-2.5 w-2.5 rounded-full ${m.color} shadow-[0_0_10px_currentColor] opacity-80 group-hover:opacity-100 transition-opacity`} />
                                        {m.label}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-zinc-500 text-xs">{m.count} mandates</span>
                                        <span className="font-mono text-zinc-400 text-xs w-8 text-right">{m.percentage}%</span>
                                      </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${m.percentage}%` }}
                                        transition={{ duration: 1, delay: idx * 0.2, ease: "easeOut" }}
                                        className={`h-full ${m.color} rounded-full`} 
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Launch Secure WebRTC Bridge */}
            <AnimatePresence>
              {isRoomActive && roomData && activeCaseId && (
                <ConsultationRoom 
                  caseId={activeCaseId}
                  consultationId={roomData.id}
                  webrtcRoomId={roomData.webrtcRoomId}
                  isLawyer={true} 
                  onLeave={() => setIsRoomActive(false)}
                />
              )}
            </AnimatePresence>
            {/* Launch Direct Messaging Panel */}
            {activeCaseId && activeCase && (
              <DirectMessagePanel 
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                caseBriefId={activeCaseId}
                chatPartnerName={activeCase.client?.name || "Client"}
              />
            )}

          </>
        ) : (
          <div className="h-full flex items-center justify-center flex-col text-zinc-600">
            <Briefcase className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-mono text-xs uppercase tracking-widest">Select a mandate to review intelligence.</p>
          </div>
        )}
      </div>
    </div>
  );
}