"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { CarouselItem, CarouselSettings } from "@/lib/types";

interface PlaybackState {
  currentIndex: number;
  progress: number;
  isPlaying: boolean;
  direction: number;
}

export function useCarouselPlayback(
  items: CarouselItem[],
  settings: CarouselSettings
) {
  const [state, setState] = useState<PlaybackState>({
    currentIndex: 0,
    progress: 0,
    isPlaying: true,
    direction: 1,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const safeIndex = items.length > 0
    ? Math.min(state.currentIndex, items.length - 1)
    : 0;

  const currentItem = items[safeIndex] ?? null;

  const itemDuration = useMemo(
    () =>
      (currentItem?.duration_seconds ?? settings.default_item_duration_seconds) *
      1000,
    [currentItem?.duration_seconds, settings.default_item_duration_seconds]
  );

  const goToNext = useCallback(() => {
    if (items.length === 0) return;
    setState((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % items.length,
      progress: 0,
      direction: 1,
    }));
    startTimeRef.current = Date.now();
  }, [items.length]);

  const goToPrev = useCallback(() => {
    if (items.length === 0) return;
    setState((prev) => ({
      ...prev,
      currentIndex:
        (prev.currentIndex - 1 + items.length) % items.length,
      progress: 0,
      direction: -1,
    }));
    startTimeRef.current = Date.now();
  }, [items.length]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      setState((prev) => ({
        ...prev,
        currentIndex: index,
        progress: 0,
        direction: index > prev.currentIndex ? 1 : -1,
      }));
      startTimeRef.current = Date.now();
    },
    [items.length]
  );

  const onVideoEnded = useCallback(() => {
    if (settings.auto_loop) {
      goToNext();
    }
  }, [settings.auto_loop, goToNext]);

  // Auto-loop timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!settings.auto_loop || items.length === 0 || !state.isPlaying) {
      return;
    }

    const isNonLoopingVideo = currentItem?.type === "video" && !currentItem.video_loop;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / itemDuration, 1);

      if (!isNonLoopingVideo && progress >= 1) {
        goToNext();
      } else {
        setState((prev) => ({ ...prev, progress }));
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    settings.auto_loop,
    items.length,
    state.isPlaying,
    safeIndex,
    currentItem?.type,
    currentItem?.video_loop,
    itemDuration,
    goToNext,
  ]);

  return {
    currentIndex: safeIndex,
    progress: state.progress,
    isPlaying: state.isPlaying,
    direction: state.direction,
    currentItem,
    goToNext,
    goToPrev,
    goToIndex,
    onVideoEnded,
    totalItems: items.length,
  };
}
