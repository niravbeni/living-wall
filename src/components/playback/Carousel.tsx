"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionTemplate,
  animate,
} from "framer-motion";
import type { TransitionType } from "@/lib/types";
import { useCarouselItems } from "@/hooks/useCarouselItems";
import { useSettings } from "@/hooks/useSettings";
import { useCarouselPlayback } from "@/hooks/useCarouselPlayback";
import { useFullscreen } from "@/hooks/useFullscreen";
import { expandPlaybackSlides } from "@/lib/playback-slides";
import { CarouselItemDisplay } from "./CarouselItem";
import { TransitionWrapper } from "./TransitionWrapper";
import { ProgressBar } from "./ProgressBar";

export function Carousel() {
  const { items, loading: itemsLoading } = useCarouselItems();
  const { settings, loading: settingsLoading } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleFullscreen } = useFullscreen(containerRef);

  const visibleItems = useMemo(
    () => items.filter((i) => i.visible_in_carousel !== false),
    [items]
  );

  const slides = useMemo(
    () => expandPlaybackSlides(visibleItems),
    [visibleItems]
  );

  const {
    currentSlide,
    currentItem,
    progress,
    direction,
    paused,
    goToNext,
    goToPrev,
    onVideoEnded,
  } = useCarouselPlayback(slides, settings);

  const [transitionOverride, setTransitionOverride] =
    useState<TransitionType | null>(null);
  const overrideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerOverride = useCallback(
    (type: TransitionType, durationMs: number) => {
      setTransitionOverride(type);
      if (overrideTimeoutRef.current) clearTimeout(overrideTimeoutRef.current);
      overrideTimeoutRef.current = setTimeout(
        () => setTransitionOverride(null),
        durationMs + 150
      );
    },
    []
  );

  useEffect(() => {
    return () => {
      if (overrideTimeoutRef.current) clearTimeout(overrideTimeoutRef.current);
    };
  }, []);

  const ZOOM_BURST_DURATION_MS = 1250;
  const PULSE_DURATION_MS = 1050;
  const ADVANCE_DELAY_MS = 160;
  const [pulseKey, setPulseKey] = useState(0);

  const triggerBurst = useCallback(() => {
    setPulseKey((k) => k + 1);
    triggerOverride("zoomBurst", ZOOM_BURST_DURATION_MS + ADVANCE_DELAY_MS);
    setTimeout(() => {
      goToNext();
    }, ADVANCE_DELAY_MS);
  }, [goToNext, triggerOverride]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          triggerBurst();
          break;
        case " ":
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrev();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    },
    [goToNext, goToPrev, toggleFullscreen, triggerBurst]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const loading = itemsLoading || settingsLoading;

  if (loading) {
    return <div className="h-screen w-screen bg-black" />;
  }

  if (slides.length === 0) {
    return <div className="h-screen w-screen bg-black" />;
  }

  const isWebContent =
    currentSlide?.phase === "content" && currentItem?.type === "web";

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-black cursor-none"
      onClick={goToNext}
    >
      {currentSlide && currentItem && (
        <TransitionWrapper
          itemKey={currentSlide.key}
          transitionType={transitionOverride ?? settings.transition_type}
          transitionDurationMs={
            transitionOverride === "zoomBurst"
              ? ZOOM_BURST_DURATION_MS
              : settings.transition_duration_ms
          }
          direction={direction}
        >
          <CarouselItemDisplay
            item={currentItem}
            phase={currentSlide.phase}
            isActive={true}
            onVideoEnded={onVideoEnded}
          />
        </TransitionWrapper>
      )}

      <ProgressBar
        progress={progress}
        visible={
          settings.show_progress_bar && !paused && !isWebContent
        }
      />

      <AnimatePresence>
        {pulseKey > 0 && (
          <AppleGlowPulse key={pulseKey} durationMs={PULSE_DURATION_MS} />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Apple Intelligence style border pulse.
 *
 * Shape: layered inset box-shadows in Alchemy green. box-shadow has true
 * gaussian falloff so the glow has zero hard edges / mask shoulders /
 * ring seams — it blooms smoothly from bright at the screen edge to
 * transparent toward the center.
 *
 * Motion: a rotating conic gradient (Alchemy + Deep) is overlaid with
 * `mix-blend-mode: overlay` and softly masked to the edge zone, giving
 * the color a subtle flowing shift without introducing any outline.
 */
function AppleGlowPulse({ durationMs }: { durationMs: number }) {
  const seconds = durationMs / 1000;

  const angle = useMotionValue(0);

  useEffect(() => {
    const c = animate(angle, 360, {
      duration: 3.2,
      ease: "linear",
      repeat: Infinity,
    });
    return () => c.stop();
  }, [angle]);

  const conic = useMotionTemplate`conic-gradient(from ${angle}deg at 50% 50%, #D9FF00, #B9E800, #7B92A5, #151F27, #D9FF00, #B9E800, #D9FF00)`;

  const opacityKeyframes: number[] = [0, 1, 0.95, 0];
  const opacityTransition = {
    duration: seconds,
    times: [0, 0.22, 0.65, 1] as number[],
    ease: "easeOut" as const,
  };

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: opacityKeyframes }}
      exit={{ opacity: 0 }}
      transition={opacityTransition}
    >
      <div
        className="absolute inset-0"
        style={{
          boxShadow: [
            "inset 0 0 40px 0px rgba(217, 255, 0, 0.95)",
            "inset 0 0 100px 0px rgba(217, 255, 0, 0.55)",
            "inset 0 0 180px 0px rgba(217, 255, 0, 0.22)",
          ].join(", "),
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: conic,
          mixBlendMode: "overlay",
          opacity: 0.6,
          WebkitMaskImage:
            "radial-gradient(ellipse 120% 120% at 50% 50%, transparent 55%, black 100%)",
          maskImage:
            "radial-gradient(ellipse 120% 120% at 50% 50%, transparent 55%, black 100%)",
          filter: "blur(24px) saturate(160%)",
        }}
      />
    </motion.div>
  );
}
