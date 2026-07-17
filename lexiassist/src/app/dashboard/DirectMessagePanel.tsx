"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, MessageSquare } from "lucide-react";
import { getDirectMessages, sendDirectMessage } from "@/app/actions/messaging";
import { getPusherClient } from "@/lib/pusher/client";
import { useSession } from "next-auth/react";

interface DirectMessagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  caseBriefId: string;
  chatPartnerName: string;
}

export default function DirectMessagePanel({ isOpen, onClose, caseBriefId, chatPartnerName }: DirectMessagePanelProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Fetch initial messages when opened
  useEffect(() => {
    if (!isOpen || !caseBriefId) return;
    
    const fetchHistory = async () => {
      setIsLoading(true);
      const result = await getDirectMessages(caseBriefId);
      if (result.success && result.messages) {
        setMessages(result.messages);
      }
      setIsLoading(false);
    };
    
    fetchHistory();
  }, [isOpen, caseBriefId]);

  // TIER 1 SYNC: Listen for real-time incoming messages
  useEffect(() => {
    if (!isOpen || !caseBriefId) return;
    
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `chat-${caseBriefId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('new-message', (newMessage: any) => {
      // Append the message if it isn't already in the list (prevents double-rendering for sender)
      setMessages((prev) => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [isOpen, caseBriefId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const messageContent = input.trim();
    setInput("");
    setIsSending(true);

    const result = await sendDirectMessage(caseBriefId, messageContent);
    
    if (!result.success) {
      // If it fails, put the text back so the user doesn't lose it
      setInput(messageContent);
      alert("Failed to send message. Please check your connection.");
    }
    
    setIsSending(false);
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-112.5 bg-[#0c0c0e] border-l border-zinc-800/80 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="h-20 shrink-0 border-b border-zinc-800/80 bg-[#08080a] px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-950/50 border border-blue-900/50 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-zinc-100 font-medium tracking-wide flex items-center gap-2">
                    {chatPartnerName}
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Secure Channel
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-60">
                  <Loader2 className="w-6 h-6 text-zinc-500 animate-spin mb-3" />
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Decrypting ledger...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-60 text-center px-4">
                  <MessageSquare className="w-10 h-10 text-zinc-600 mb-4" />
                  <p className="text-sm text-zinc-400">No messages yet.</p>
                  <p className="text-xs text-zinc-600 mt-2">Send a message to begin the encrypted connection.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[9px] font-mono text-zinc-500 mb-1 px-1">
                        {isMe ? "You" : msg.sender?.name || "User"} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <div className={`px-4 py-3 max-w-[85%] text-sm leading-relaxed rounded-2xl ${
                        isMe 
                          ? "bg-blue-600 text-white rounded-tr-sm" 
                          : "bg-zinc-800/80 border border-zinc-700/50 text-zinc-200 rounded-tl-sm"
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Field */}
            <div className="p-4 bg-[#08080a] border-t border-zinc-800/80 shrink-0">
              <form 
                onSubmit={handleSendMessage}
                className="flex items-end gap-2 bg-[#0c0c0e] border border-zinc-700/60 rounded-xl p-1.5 focus-within:border-blue-500/50 transition-colors"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type a secure message..."
                  className="flex-1 max-h-32 min-h-11 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 px-3 py-2.5 resize-none focus:outline-none scrollbar-thin"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="w-11 h-11 shrink-0 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg flex items-center justify-center transition-all"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}