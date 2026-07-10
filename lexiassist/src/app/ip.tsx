"use client";

import { useEffect, useState } from "react";

export default function IpBox() {
  const [ip, setIp] = useState("Locating...");

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();

        // Mask the IP for the joke
        const masked = data.ip.replace(/\.\d+\.\d+$/, ".xxx.xxx");

        setIp(masked);
      } catch {
        setIp("Unknown");
      }
    };

    fetchIP();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 w-72 rounded-lg border border-zinc-800 bg-black/70 p-4 font-mono text-xs text-zinc-300 backdrop-blur-md shadow-2xl">
      <p className="mb-3 text-zinc-500">SYSTEM LOG</p>

      <div className="space-y-2">
        <p>
          &gt; scanning...
        </p>

        <p>
          &gt; IP: <span className="text-white">{ip}</span>
        </p>

        <p className="text-zinc-400">
          &gt; Found you lil bro 👉😂
        </p>

        <p className="text-[11px] text-zinc-600">
          Pack it up unc
        </p>
      </div>
    </div>
  );
}