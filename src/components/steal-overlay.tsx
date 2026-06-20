"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "@/components/mascot";

const EVENT = "smf:steal";

/** Fire the steal effect from anywhere (client only). */
export function triggerStealBurst() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

/** Mounted once in the layout: flashes a big, dimmed thief on every steal. */
export function StealOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onSteal = () => {
      setShow(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShow(false), 1500);
    };
    window.addEventListener(EVENT, onSteal);
    return () => {
      window.removeEventListener(EVENT, onSteal);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 0.22, rotate: 0 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Mascot className="h-72 w-72 drop-shadow-[0_0_50px_rgba(154,230,110,0.55)]" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
