"use client";

import { useRef, useEffect, useCallback } from "react";
import { useCarouselItems } from "@/hooks/useCarouselItems";
import { useSettings } from "@/hooks/useSettings";
import { useCarouselPlayback } from "@/hooks/useCarouselPlayback";
import { useFullscreen } from "@/hooks/useFullscreen";
import { CarouselItemDisplay } from "./CarouselItem";
import { TransitionWrapper } from "./TransitionWrapper";
import { ProgressBar } from "./ProgressBar";
import { Loader2, Maximize, Minimize } from "lucide-react";

export function Carousel() {
  const { items, loading: itemsLoading } = useCarouselItems();
  const { settings, loading: settingsLoading } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  const {
    currentIndex,
    currentItem,
    progress,
    direction,
    goToNext,
    goToPrev,
    onVideoEnded,
    totalItems,
  } = useCarouselPlayback(items, settings);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
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
    [goToNext, goToPrev, toggleFullscreen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const loading = itemsLoading || settingsLoading;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-white/40" />
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white/60">
        <p className="text-xl font-light">No content yet</p>
        <p className="mt-2 text-sm">
          Add items via{" "}
          <a href="/cms" className="underline hover:text-white/80">
            /cms
          </a>
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-black cursor-none group"
      onClick={settings.auto_loop ? undefined : goToNext}
    >
      {currentItem && (
        <TransitionWrapper
          itemKey={currentItem.id + "-" + currentIndex}
          transitionType={settings.transition_type}
          transitionDurationMs={settings.transition_duration_ms}
          direction={direction}
        >
          <CarouselItemDisplay
            item={currentItem}
            isActive={true}
            onVideoEnded={onVideoEnded}
          />
        </TransitionWrapper>
      )}

      <ProgressBar
        progress={progress}
        visible={settings.show_progress_bar}
      />

      {/* Fullscreen toggle - visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
        className="absolute top-4 right-4 z-30 rounded-full bg-black/40 p-2 text-white/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white hover:bg-black/60 cursor-pointer"
      >
        {isFullscreen ? (
          <Minimize className="h-5 w-5" />
        ) : (
          <Maximize className="h-5 w-5" />
        )}
      </button>

      {/* Item counter - visible on hover */}
      <div className="absolute bottom-4 right-4 z-30 rounded-full bg-black/40 px-3 py-1 text-xs text-white/60 opacity-0 transition-opacity group-hover:opacity-100">
        {currentIndex + 1} / {totalItems}
      </div>

      {/* Manual mode hint - visible on hover when not auto-looping */}
      {!settings.auto_loop && (
        <div className="absolute bottom-4 left-4 z-30 rounded-full bg-black/40 px-3 py-1 text-xs text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
          Space / Click to advance
        </div>
      )}
    </div>
  );
}
