"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getTransitionConfig } from "@/lib/transitions";
import type { TransitionType } from "@/lib/types";

interface TransitionWrapperProps {
  itemKey: string;
  transitionType: TransitionType;
  transitionDurationMs: number;
  direction: number;
  children: React.ReactNode;
}

export function TransitionWrapper({
  itemKey,
  transitionType,
  transitionDurationMs,
  direction,
  children,
}: TransitionWrapperProps) {
  const config = getTransitionConfig(transitionType, transitionDurationMs);

  const variants = {
    enter: (d: number) => config.variants.enter(d),
    center: config.variants.center,
    exit: (d: number) => config.variants.exit(d),
  };

  return (
    <AnimatePresence initial={false} custom={direction} mode="sync">
      <motion.div
        key={itemKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={config.transition}
        className="absolute inset-0"
        style={
          transitionType === "cardStack"
            ? { perspective: 1200, transformStyle: "preserve-3d" }
            : undefined
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
