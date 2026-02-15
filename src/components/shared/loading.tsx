"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Loading() {
  const dots = Array.from({ length: 9 });

  const messages = [
    "Processing with precision...",
    "Syncing the signal...",
    "Charging the algorithms...",
    "Building something smart...",
    "Calibrating data flow...",
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden">
      {/* Subtle rotating ring */}
      <motion.div
        className="absolute rounded-full border border-primary/30 w-32 h-32"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Pulsing grid */}
      <div className="grid grid-cols-3 gap-2">
        {dots.map((_, i) => (
          <motion.div
            key={i}
            className="h-4 w-4 rounded-full bg-primary/60 shadow-[0_0_8px_var(--color-primary)]"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 1, 0.5],
              backgroundColor: [
                "var(--color-primary)",
                "var(--color-accent)",
                "var(--color-secondary)",
              ],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Dynamic pulsing text */}
      <motion.p
        key={messageIndex} // triggers animation when message changes
        className="mt-8 text-sm font-mono text-muted-foreground tracking-widest"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: [0.4, 1, 0.4], y: 0 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        {messages[messageIndex]}
      </motion.p>

      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 animate-gradient-x pointer-events-none" />
    </div>
  );
}
