import type { Transition, TargetAndTransition } from "framer-motion";
import type { TransitionType } from "./types";

export interface TransitionVariantSet {
  enter: (direction: number) => TargetAndTransition;
  center: TargetAndTransition;
  exit: (direction: number) => TargetAndTransition;
}

export interface TransitionConfig {
  variants: TransitionVariantSet;
  transition: Transition;
}

const crossfade: TransitionConfig = {
  variants: {
    enter: () => ({ opacity: 0, zIndex: 1 }),
    center: { opacity: 1, zIndex: 1 },
    exit: () => ({ opacity: 0, zIndex: 0 }),
  },
  transition: { duration: 0.8, ease: "easeInOut" },
};

const slide: TransitionConfig = {
  variants: {
    enter: (d: number) => ({
      x: d > 0 ? "100%" : "-100%",
      zIndex: 1,
    }),
    center: { x: 0, zIndex: 1 },
    exit: (d: number) => ({
      x: d > 0 ? "-100%" : "100%",
      zIndex: 0,
    }),
  },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
};

const zoomFade: TransitionConfig = {
  variants: {
    enter: () => ({ scale: 0.9, opacity: 0, zIndex: 1 }),
    center: { scale: 1, opacity: 1, zIndex: 1 },
    exit: () => ({ scale: 1.1, opacity: 0, zIndex: 0 }),
  },
  transition: { duration: 0.7, ease: "easeInOut" },
};

const zoomBurst: TransitionConfig = {
  variants: {
    enter: () => ({
      scale: 0.2,
      opacity: 0,
      filter: "blur(16px)",
      zIndex: 2,
    }),
    center: {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
      zIndex: 2,
    },
    exit: () => ({
      scale: 2.6,
      opacity: 0,
      filter: "blur(20px)",
      zIndex: 1,
    }),
  },
  transition: {
    type: "spring",
    stiffness: 110,
    damping: 18,
    mass: 0.9,
    opacity: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    filter: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const cardStack: TransitionConfig = {
  variants: {
    enter: (d: number) => ({
      x: d > 0 ? "80%" : "-80%",
      scale: 0.85,
      rotateY: d > 0 ? -15 : 15,
      opacity: 0,
      zIndex: 1,
    }),
    center: { x: 0, scale: 1, rotateY: 0, opacity: 1, zIndex: 1 },
    exit: (d: number) => ({
      x: d > 0 ? "-80%" : "80%",
      scale: 0.85,
      rotateY: d > 0 ? 15 : -15,
      opacity: 0,
      zIndex: 0,
    }),
  },
  transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
};

const transitionMap: Record<TransitionType, TransitionConfig> = {
  crossfade,
  slide,
  zoomFade,
  cardStack,
  zoomBurst,
};

export function getTransitionConfig(
  type: TransitionType,
  durationMs?: number
): TransitionConfig {
  const config = transitionMap[type];
  if (durationMs) {
    return {
      ...config,
      transition: { ...config.transition, duration: durationMs / 1000 },
    };
  }
  return config;
}
