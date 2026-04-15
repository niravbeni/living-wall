"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { CarouselItem, CarouselSettings } from "@/lib/types";

const IDLE_RESUME_DELAY = 10_000;

interface PlaybackState {
  currentIndex: number;
  progress: number;
  direction: number;
  paused: boolean;
}

export function useCarouselPlayback(
  items: CarouselItem[],
  settings: CarouselSettings
) {
  const [state, setState] = useState<PlaybackState>({
    currentIndex: 0,
    progress: 0,
    direction: 1,
    paused: false,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const lockedRef = useRef(false);
  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
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

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, paused: false, progress: 0 }));
    }, IDLE_RESUME_DELAY);
  }, [clearIdleTimer]);

  const manualAdvance = useCallback(
    (dir: number) => {
      if (items.length === 0 || lockedRef.current) return;
      clearTimer();
      lock(settings.transition_duration_ms + 50);

      const shouldPause = settings.auto_loop;

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
          paused: shouldPause ? true : prev.paused,
        };
      });
      startTimeRef.current = Date.now();

      if (shouldPause) {
        startIdleTimer();
      }
    },
    [items.length, clearTimer, lock, settings.transition_duration_ms, settings.auto_loop, startIdleTimer]
  );

  const goToNext = useCallback(() => {
    manualAdvance(1);
  }, [manualAdvance]);

  const goToPrev = useCallback(() => {
    manualAdvance(-1);
  }, [manualAdvance]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length || lockedRef.current) return;
      clearTimer();
      lock(settings.transition_duration_ms + 50);

      const shouldPause = settings.auto_loop;

      setState((prev) => ({
        ...prev,
        currentIndex: index,
        progress: 0,
        direction: index > prev.currentIndex ? 1 : -1,
        paused: shouldPause ? true : prev.paused,
      }));
      startTimeRef.current = Date.now();

      if (shouldPause) {
        startIdleTimer();
      }
    },
    [items.length, clearTimer, lock, settings.transition_duration_ms, settings.auto_loop, startIdleTimer]
  );

  const onVideoEnded = useCallback(() => {
    if (settings.auto_loop && !state.paused && items.length > 0) {
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
    }
  }, [settings.auto_loop, settings.transition_duration_ms, state.paused, items.length, clearTimer, lock]);

  // Auto-loop timer
  useEffect(() => {
    clearTimer();

    if (!settings.auto_loop || items.length === 0 || state.paused) {
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
    state.paused,
    safeIndex,
    currentItem?.type,
    currentItem?.video_loop,
    itemDuration,
    clearTimer,
    lock,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, []);

  return {
    currentIndex: safeIndex,
    progress: state.progress,
    direction: state.direction,
    paused: state.paused,
    currentItem,
    goToNext,
    goToPrev,
    goToIndex,
    onVideoEnded,
    totalItems: items.length,
  };
}
