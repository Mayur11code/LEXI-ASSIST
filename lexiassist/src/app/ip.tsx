"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SystemLog() {
  const [connectionState, setConnectionState] = useState("Establishing secure tunnel...");

  useEffect(() => {
    // Simulate a secure handshake for the UI
    const timer = setTimeout(() => {
      setConnectionState("Connected (End-to-End Encrypted)");
    }, 1800);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="mt-4 w-full max-w-70 sm:max-w-[320px] rounded-sm border border-zinc-800/70 bg-white/5 p-3 sm:p-4 backdrop-blur-sm font-mono text-[10px] sm:text-[11px] tracking-[0.08em] text-zinc-500 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="uppercase tracking-[0.28em] text-zinc-400 sm:tracking-[0.35em]">
          SECURITY LOG
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
      </div>

      <div className="space-y-2 sm:space-y-3">
        <p className="flex gap-2">
          <span className="text-zinc-600">&gt;</span>
          <span>Status:</span>
          <span className={connectionState.includes("Connected") ? "text-emerald-400/80" : "text-amber-400/80"}>
            {connectionState}
          </span>
        </p>

        <p className="flex gap-2">
          <span className="text-zinc-600">&gt;</span>
          <span>Protocol:</span>
          <span className="text-zinc-300">WebRTC Ready</span>
        </p>

        <div className="my-3 h-px bg-zinc-800/80" />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-zinc-500"
        >
          &gt; Environment strictly strictly isolated. Data extraction is temporary and localized.
        </motion.p>
      </div>
    </motion.div>
  );
}