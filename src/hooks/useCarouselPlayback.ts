"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { PlaybackSlide } from "@/lib/playback-slides";
import type { CarouselSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

const IDLE_RESUME_DELAY = 15_000;

interface PlaybackState {
  currentIndex: number;
  progress: number;
  direction: number;
  paused: boolean;
}

export function useCarouselPlayback(
  slides: PlaybackSlide[],
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
    slides.length > 0
      ? Math.min(state.currentIndex, slides.length - 1)
      : 0;

  const currentSlide = slides[safeIndex] ?? null;
  const currentItem = currentSlide?.item ?? null;

  const itemDuration = useMemo(() => {
    if (!currentSlide || !currentItem) {
      return settings.default_item_duration_seconds * 1000;
    }
    if (currentSlide.phase === "intro") {
      return Math.max(
        1000,
        (currentItem.divider_duration_seconds ??
          DEFAULT_SETTINGS.default_item_duration_seconds) * 1000
      );
    }
    return (
      (currentItem.duration_seconds ?? settings.default_item_duration_seconds) *
      1000
    );
  }, [
    currentSlide,
    currentItem,
    settings.default_item_duration_seconds,
  ]);

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
      if (slides.length === 0 || lockedRef.current) return;
      clearTimer();
      lock(settings.transition_duration_ms + 50);

      setState((prev) => {
        const next =
          dir > 0
            ? (prev.currentIndex + 1) % slides.length
            : (prev.currentIndex - 1 + slides.length) % slides.length;
        return {
          ...prev,
          currentIndex: next,
          progress: 0,
          direction: dir,
          paused: settings.auto_loop ? true : prev.paused,
        };
      });
      startTimeRef.current = Date.now();

      if (settings.auto_loop) {
        startIdleTimer();
      }
    },
    [
      slides.length,
      clearTimer,
      lock,
      settings.transition_duration_ms,
      settings.auto_loop,
      startIdleTimer,
    ]
  );

  const goToNext = useCallback(() => {
    manualAdvance(1);
  }, [manualAdvance]);

  const goToPrev = useCallback(() => {
    manualAdvance(-1);
  }, [manualAdvance]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= slides.length || lockedRef.current) return;
      clearTimer();
      lock(settings.transition_duration_ms + 50);

      setState((prev) => ({
        ...prev,
        currentIndex: index,
        progress: 0,
        direction: index > prev.currentIndex ? 1 : -1,
        paused: settings.auto_loop ? true : prev.paused,
      }));
      startTimeRef.current = Date.now();

      if (settings.auto_loop) {
        startIdleTimer();
      }
    },
    [
      slides.length,
      clearTimer,
      lock,
      settings.transition_duration_ms,
      settings.auto_loop,
      startIdleTimer,
    ]
  );

  const onVideoEnded = useCallback(
    (endedItemId?: string) => {
      // Non-looping videos rely exclusively on this callback to advance
      // (the interval timer short-circuits on `isNonLoopingVideo`), so
      // we intentionally DO NOT gate on `state.paused` here. Otherwise a
      // press during the video (which flips auto_loop into its 15s
      // manual-mode window) would leave the carousel stuck on the video
      // final frame forever — `onEnded` would have fired once and been
      // ignored, and nothing else can step the slide forward.
      if (!settings.auto_loop || slides.length === 0) return;

      // Stale-video guard: during a slide transition (AnimatePresence
      // mode="sync") the outgoing video element is still mounted and can
      // fire `onEnded` after we've already navigated elsewhere. If the
      // id doesn't match the currently-visible slide, ignore the event.
      const currentId = slides[safeIndex]?.item.id;
      if (endedItemId && currentId && endedItemId !== currentId) return;

      lockedRef.current = false;
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
      clearTimer();
      clearIdleTimer();
      lock(settings.transition_duration_ms + 50);
      setState((prev) => ({
        ...prev,
        currentIndex: (prev.currentIndex + 1) % slides.length,
        progress: 0,
        direction: 1,
        // A video that ran to completion fulfils whatever the user's
        // 15s manual-mode window was holding them on, so resume
        // auto-loop cleanly instead of sitting paused on the last frame.
        paused: false,
      }));
      startTimeRef.current = Date.now();
    },
    [
      settings.auto_loop,
      settings.transition_duration_ms,
      slides,
      safeIndex,
      clearTimer,
      clearIdleTimer,
      lock,
    ]
  );

  useEffect(() => {
    clearTimer();

    if (!settings.auto_loop || slides.length === 0 || state.paused) {
      return;
    }

    if (currentSlide?.phase === "content" && currentItem?.type === "web") {
      return;
    }

    const isNonLoopingVideo =
      currentSlide?.phase === "content" &&
      currentItem?.type === "video" &&
      !currentItem.video_loop;

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
          currentIndex: (prev.currentIndex + 1) % slides.length,
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
    slides.length,
    state.paused,
    safeIndex,
    currentSlide?.phase,
    currentItem?.type,
    currentItem?.video_loop,
    itemDuration,
    clearTimer,
    lock,
  ]);

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
    currentSlide,
    currentItem,
    goToNext,
    goToPrev,
    goToIndex,
    onVideoEnded,
    totalSlides: slides.length,
  };
}
