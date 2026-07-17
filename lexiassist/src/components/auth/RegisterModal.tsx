"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, UserPlus, ShieldAlert, CheckCircle2 } from "lucide-react";
import { registerClient } from "@/app/actions/register";
import { signIn } from "next-auth/react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const result = await registerClient({ name, email, password });

    if (result.success) {
      setIsSuccess(true);
      // Automatically log the user in after a successful registration
      setTimeout(async () => {
        await signIn("credentials", {
          email: email.toLowerCase().trim(),
          password,
          callbackUrl: "/dashboard",
        });
      }, 1500);
    } else {
      setErrorMessage(result.error || "Failed to create secure client portal.");
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
          />

          {/* Centered Modal Content Card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-center text-emerald-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-zinc-100 text-lg font-medium tracking-wide">Create Client Portal</h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">// Secure Registration</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Success State Overlay */}
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-zinc-200 font-medium">Profile Securely Created</h4>
                    <p className="text-xs text-zinc-500 font-mono mt-1.5 uppercase tracking-widest">Initializing intake terminal...</p>
                  </div>
                </motion.div>
              ) : (
                /* The Registration Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3.5 bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-xl text-xs font-mono flex items-center gap-2.5">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        {errorMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Peter Parker"
                      className="w-full bg-[#0c0c0e] border border-zinc-800/80 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/30 transition-colors shadow-inner"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#0c0c0e] border border-zinc-800/80 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/30 transition-colors shadow-inner"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">Secure Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0c0c0e] border border-zinc-800/80 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/30 transition-colors shadow-inner"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 bg-zinc-100 hover:bg-white text-zinc-950 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize Portal Access"}
                  </button>

                  {onSwitchToLogin && (
                    <p className="text-center text-xs text-zinc-600 font-sans pt-4">
                      Already have an assignment token?{" "}
                      <button 
                        type="button" 
                        onClick={onSwitchToLogin}
                        className="text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-4"
                      >
                        Sign In
                      </button>
                    </p>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}