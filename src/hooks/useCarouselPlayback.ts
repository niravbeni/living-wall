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
  const lockedRef = useRef(false);
  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const safeIndex =
    items.length > 0
      ? Math.min(state.currentIndex, items.length - 1)
      : 0;

  const currentItem = items[safeIndex] ?? null;

  const itemDuration = useMemo(
    () =>
      (currentItem?.duration_seconds ??
        settings.default_item_duration_seconds) * 1000,
    [currentItem?.duration_seconds, settings.default_item_duration_seconds]
  );

  const lock = useCallback((durationMs: number) => {
    lockedRef.current = true;
    if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    lockTimeoutRef.current = setTimeout(() => {
      lockedRef.current = false;
    }, durationMs);
  }, []);

  const advance = useCallback(
    (dir: number) => {
      if (items.length === 0) return;
      clearTimer();
      lock(settings.transition_duration_ms + 50);
      setState((prev) => {
        const next =
          dir > 0
            ? (prev.currentIndex + 1) % items.length
            : (prev.currentIndex - 1 + items.length) % items.length;
        return {
          ...prev,
          currentIndex: next,
          progress: 0,
          direction: dir,
        };
      });
      startTimeRef.current = Date.now();
    },
    [items.length, clearTimer, lock, settings.transition_duration_ms]
  );

  const goToNext = useCallback(() => {
    if (lockedRef.current) return;
    advance(1);
  }, [advance]);

  const goToPrev = useCallback(() => {
    if (lockedRef.current) return;
    advance(-1);
  }, [advance]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length || lockedRef.current) return;
      clearTimer();
      lock(settings.transition_duration_ms + 50);
      setState((prev) => ({
        ...prev,
        currentIndex: index,
        progress: 0,
        direction: index > prev.currentIndex ? 1 : -1,
      }));
      startTimeRef.current = Date.now();
    },
    [items.length, clearTimer, lock, settings.transition_duration_ms]
  );

  const onVideoEnded = useCallback(() => {
    if (settings.auto_loop && items.length > 0) {
      lockedRef.current = false;
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      advance(1);
    }
  }, [settings.auto_loop, items.length, advance]);

  useEffect(() => {
    clearTimer();

    if (!settings.auto_loop || items.length === 0 || !state.isPlaying) {
      return;
    }

    const isNonLoopingVideo =
      currentItem?.type === "video" && !currentItem.video_loop;

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / itemDuration, 1);

      if (!isNonLoopingVideo && progress >= 1) {
        lockedRef.current = false;
        if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
        clearTimer();
        lock(settings.transition_duration_ms + 50);
        setState((prev) => ({
          ...prev,
          currentIndex: (prev.currentIndex + 1) % items.length,
          progress: 0,
          direction: 1,
        }));
        startTimeRef.current = Date.now();
      } else {
        setState((prev) => ({ ...prev, progress }));
      }
    }, 50);

    return clearTimer;
  }, [
    settings.auto_loop,
    settings.transition_duration_ms,
    items.length,
    state.isPlaying,
    safeIndex,
    currentItem?.type,
    currentItem?.video_loop,
    itemDuration,
    clearTimer,
    lock,
  ]);

  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    };
  }, []);

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
