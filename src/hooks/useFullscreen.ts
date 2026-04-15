"use client";

import { useState, useCallback, useEffect, type RefObject } from "react";

export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (ref.current && !document.fullscreenElement) {
      try {
        await ref.current.requestFullscreen();
      } catch (err) {
        console.error("Fullscreen request failed:", err);
      }
    }
  }, [ref]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error("Exit fullscreen failed:", err);
      }
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
