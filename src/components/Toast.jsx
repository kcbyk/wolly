import React from "react";
import { useApp } from "../context/AppContext";
import { CheckCircle2, Info, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Toast() {
  const { toast } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none flex flex-col gap-2">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1c1c1c] border border-white/15 shadow-2xl text-slate-100 backdrop-blur-xl pointer-events-auto"
          >
            {toast.type === "heart" ? (
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500 animate-pulse" />
            ) : toast.type === "info" ? (
              <Info className="w-5 h-5 text-slate-300" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-sm font-medium tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
