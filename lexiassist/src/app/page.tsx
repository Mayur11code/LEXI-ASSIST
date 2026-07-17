// src/app/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Added router for switching to login
import IpBox from "./ip"; 
import RegisterModal from "@/components/auth/RegisterModal"; // Added the new Modal

const initialCards = [
  {
    id: 1,
    title: "NDA_DRAFT.pdf",
    x: -180,
    y: -120,
    rot: -8,
  },
  {
    id: 2,
    title: "CLIENT_INTAKE.msg",
    x: 170,
    y: -100,
    rot: 6,
  },
  {
    id: 3,
    title: "CASE_FILES.zip",
    x: -160,
    y: 90,
    rot: 4,
  },
  {
    id: 4,
    title: "DEPOSITION.txt",
    x: 160,
    y: 110,
    rot: -6,
  },
  {
    id: 5,
    title: "MERGER_AGREEMENT.docx",
    x: 0,
    y: 0,
    rot: 2,
  },
];

export default function Home() {
  const router = useRouter(); // Added router instance
  const [moved, setMoved] = useState<number[]>([]);
  const [scale, setScale] = useState(1);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false); // Added modal state

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setScale(0.45);
      } else if (width < 1024) {
        setScale(0.7);
      } else {
        setScale(1);
      }
    };

    updateScale();

    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const reveal = moved.length === initialCards.length;

  const markMoved = (id: number) => {
    setMoved((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-zinc-200 font-sans selection:bg-emerald-500/30">
      
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#111_0%,#08080a_60%,#050505_100%)]" />

      {/* Grain Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/asfalt-dark.png')",
        }}
      />

      {/* Logo */}
      <div className="absolute left-4 top-4 z-50 sm:left-6 sm:top-6 lg:left-10 lg:top-10">
        <h1 className="text-2xl font-light tracking-[0.22em] text-zinc-100 sm:text-3xl sm:tracking-[0.3em] lg:text-4xl lg:tracking-[0.35em] flex items-center gap-3">
          <span className="text-emerald-500">⚖️</span> LEXIASSIST
        </h1>

        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-emerald-500/70 sm:text-xs font-mono ml-13">
          AI Legal Advisor Matrix
        </p>
      </div>

      {/* Counter */}
      <div className="absolute right-4 top-4 z-50 text-right text-zinc-500 sm:right-6 sm:top-6 lg:right-10 lg:top-10 font-mono">
        <p className="text-[10px] uppercase tracking-[0.25em] sm:text-xs">
          Documents Cleared
        </p>

        <p className="mt-1 text-lg font-light sm:text-2xl lg:mt-2 lg:text-3xl text-emerald-500/80">
          {moved.length}/{initialCards.length}
        </p>
      </div>

      {/* Hero Reveal */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: reveal ? 1 : 0.05,
            scale: reveal ? 1 : 0.95,
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center"
        >
          <h2 className="select-none text-4xl font-thin tracking-[0.25em] text-white sm:text-6xl sm:tracking-[0.45em] lg:text-7xl lg:tracking-[0.6em]">
            INTELLIGENCE
          </h2>

          <motion.p
            animate={{
              opacity: reveal ? 1 : 0,
              y: reveal ? 0 : 20,
            }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mx-auto mt-6 max-w-xl px-4 text-sm text-zinc-400 sm:text-base leading-relaxed"
          >
            An advanced AI-powered legal triage engine. Automate document redlines, extract chronological timelines, and seamlessly connect with specialized attorneys.
          </motion.p>

          {reveal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-10 sm:mt-12 flex flex-col items-center gap-5"
            >
              {/* 🔴 Client Route: Now triggers the Registration Modal */}
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="inline-block rounded-full border border-emerald-500/50 bg-emerald-950/20 px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-emerald-400 transition-all hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] sm:text-sm font-medium"
              >
                INITIALIZE TRIAGE
              </button>
              
              {/* Lawyer Route */}
              <div className="flex flex-col items-center gap-3">
                <Link
                  href="/attorney/join"
                  className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-colors font-mono mt-2"
                >
                  // Apply as Attorney Counsel
                </Link>
                <Link
                  href="/login"
                  className="text-[9px] uppercase tracking-widest text-zinc-700 hover:text-zinc-400 transition-colors font-mono"
                >
                  Existing Counsel Login
                </Link>
              </div>
              
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Draggable Evidence Cards */}
      {initialCards.map((card) => (
        <motion.div
          key={card.id}
          drag
          dragMomentum={false}
          dragElastic={0.12}
          onDragStart={() => markMoved(card.id)}
          initial={{
            x: card.x * scale,
            y: card.y * scale,
            rotate: card.rot,
          }}
          whileDrag={{
            scale: 1.06,
            rotate: 0,
            cursor: "grabbing",
            zIndex: 999,
          }}
          className="absolute left-1/2 top-1/2 h-36 w-56 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-xl border border-zinc-800/80 bg-[#0c0c0e]/95 p-4 shadow-2xl backdrop-blur-md sm:h-40 sm:w-64 sm:p-5 lg:h-44 lg:w-72 hover:border-zinc-700 transition-colors"
        >
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <p className="text-[9px] uppercase tracking-[0.3em] text-emerald-500/70 font-mono">
                  Privileged
                </p>
                <span className="text-[10px] text-zinc-600 font-mono">FILE_{card.id}</span>
              </div>

              <h3 className="text-sm font-medium tracking-wide text-zinc-200 sm:text-base">
                {card.title}
              </h3>
            </div>

            <div className="space-y-2.5 opacity-60">
              <div className="h-0.5 w-full bg-zinc-800/80 rounded" />
              <div className="h-0.5 w-5/6 bg-zinc-800/80 rounded" />
              <div className="h-0.5 w-4/6 bg-zinc-800/80 rounded" />
            </div>
          </div>
        </motion.div>
      ))}

      {/* Bottom Left Context */}
      <div className="absolute bottom-4 left-4 z-50 max-w-xs text-zinc-500 sm:bottom-6 sm:left-6 sm:max-w-sm lg:bottom-10 lg:left-10 font-mono">
        <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-400 sm:text-xs">
          System Awaiting Input.
        </p>

        <p className="mt-2 text-[10px] sm:text-xs leading-relaxed opacity-70">
          Clear the workspace.
          <br />
          Reveal the architecture.
        </p>
      </div>

      {/* Bottom Right IP Component */}
      <div className="absolute bottom-4 right-4 z-50 sm:bottom-6 sm:right-6 lg:bottom-10 lg:right-10">
        <IpBox />
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 text-center text-[9px] uppercase tracking-[0.25em] text-zinc-700 sm:bottom-4 sm:text-[10px] lg:bottom-8 font-mono">
        LexiAssist AI • Next-Gen Legal Infrastructure
      </div>

      {/* 🔴 Registration Modal Injection */}
      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onSwitchToLogin={() => {
          setIsRegisterOpen(false);
          router.push('/login');
        }} 
      />
    </main>
  );
}