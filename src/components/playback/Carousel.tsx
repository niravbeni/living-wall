"use client";

import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  const PULSE_DURATION_MS = 800;
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
          <motion.div
            key={pulseKey}
            className="pointer-events-none absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: PULSE_DURATION_MS / 1000,
              times: [0, 0.18, 0.55, 1],
              ease: "easeOut",
            }}
            style={{
              boxShadow:
                "inset 0 0 140px 20px #b6ff3d, inset 0 0 320px 80px rgba(182,255,61,0.45)",
            }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [1.02, 1, 1.01],
              }}
              transition={{
                duration: PULSE_DURATION_MS / 1000,
                times: [0, 0.25, 1],
                ease: "easeOut",
              }}
              style={{
                border: "3px solid #b6ff3d",
                boxShadow:
                  "0 0 24px #b6ff3d, inset 0 0 24px rgba(182,255,61,0.6)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
