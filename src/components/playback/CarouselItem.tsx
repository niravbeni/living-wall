"use client";

import { useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type {
  CarouselItem as CarouselItemType,
  CaptionTheme,
} from "@/lib/types";
import type { PlaybackSlide } from "@/lib/playback-slides";
import { proxyMediaUrl } from "@/lib/supabase";

/** Helpers — shared with Carousel which now renders the caption itself. */
export function getCaptionTitle(item: CarouselItemType): string | undefined {
  return item.caption_title?.trim() || item.divider_title?.trim();
}
export function getCaptionSubtitle(item: CarouselItemType): string | undefined {
  return item.caption_subtitle?.trim() || item.divider_subtitle?.trim();
}
export function itemHasCaption(item: CarouselItemType): boolean {
  return (
    item.caption_enabled !== false &&
    Boolean(getCaptionTitle(item) || getCaptionSubtitle(item))
  );
}

function textOnBackground(hex: string): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length !== 6) return "#fafafa";
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  if ([r, g, b].some((n) => Number.isNaN(n))) return "#fafafa";
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.55 ? "#18181b" : "#fafafa";
}

interface CarouselItemProps {
  item: CarouselItemType;
  phase: PlaybackSlide["phase"];
  isActive: boolean;
  onVideoEnded: () => void;
}

export function CarouselItemDisplay({
  item,
  phase,
  isActive,
  onVideoEnded,
}: CarouselItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const bg = item.divider_background || "#000000";
  const fg = useMemo(() => textOnBackground(bg), [bg]);
  const mediaSrc = useMemo(() => proxyMediaUrl(item.media_url), [item.media_url]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playbackRate = item.video_speed ?? 1.5;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive, item.video_speed]);

  if (phase === "intro") {
    return (
      <div
        className="absolute inset-0 flex flex-col px-8 sm:px-16 py-12 sm:py-20"
        style={{ backgroundColor: bg, color: fg, fontFamily: "'FH Oscar', sans-serif" }}
      >
        <div className="flex-1 flex flex-col justify-center max-w-5xl">
          {item.divider_title ? (
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              {item.divider_title}
            </h1>
          ) : null}
          {item.divider_subtitle ? (
            <p className="mt-4 sm:mt-6 text-xl sm:text-2xl md:text-3xl font-light opacity-85 max-w-3xl leading-snug">
              {item.divider_subtitle}
            </p>
          ) : null}
          {item.divider_body ? (
            <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl font-light opacity-70 max-w-2xl whitespace-pre-wrap leading-relaxed">
              {item.divider_body}
            </p>
          ) : null}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ideo.svg"
          alt="IDEO"
          className="self-end w-[100px] sm:w-[120px] object-contain"
          style={{
            filter:
              fg === "#18181b"
                ? "invert(1) hue-rotate(180deg) brightness(0.15)"
                : "none",
          }}
          draggable={false}
        />
      </div>
    );
  }

  if (item.type === "web") {
    return (
      <iframe
        src={isActive ? mediaSrc : "about:blank"}
        title={item.title || "Web page"}
        className="absolute inset-0 h-full w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
      />
    );
  }

  if (item.type === "video") {
    return (
      <video
        ref={videoRef}
        src={mediaSrc}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        loop={item.video_loop}
        onEnded={onVideoEnded}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaSrc}
      alt={item.title}
      className="absolute inset-0 h-full w-full object-cover"
      draggable={false}
    />
  );
}

/**
 * CaptionOverlay — rendered at the Carousel level (not inside the media
 * transition wrapper) so it gets an independent, sequential slide-up /
 * slide-down animation via AnimatePresence mode="wait".
 */
export interface CaptionOverlayProps {
  title?: string;
  subtitle?: string;
  theme?: CaptionTheme;
}

const CAPTION_THEME_STYLES: Record<
  CaptionTheme,
  {
    background: string;
    border: string;
    boxShadow: string;
  }
> = {
  light: {
    background:
      "linear-gradient(135deg, rgba(20,20,20,0.32) 0%, rgba(30,30,30,0.22) 60%, rgba(60,60,60,0.12) 100%)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow:
      "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
  },
  dark: {
    // Near-black translucent card with a tighter gradient — reads
    // cleanly over bright / white content where the light variant
    // disappears.
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.68) 60%, rgba(20,20,20,0.58) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
};

export function CaptionOverlay({
  title,
  subtitle,
  theme = "light",
}: CaptionOverlayProps) {
  // Travel far enough that the card + its drop shadow are completely
  // below the viewport before we even touch opacity. Using a calc()
  // string so it works regardless of card height: 100% pushes the top
  // of the card to the bottom of its own box, then +120px clears the
  // bottom-* offset and the box shadow.
  const OFFSCREEN_Y = "calc(100% + 120px)";
  const themeStyles = CAPTION_THEME_STYLES[theme] ?? CAPTION_THEME_STYLES.light;

  return (
    <motion.div
      className="pointer-events-none absolute bottom-6 left-6 sm:bottom-10 sm:left-10 w-[33vw] min-w-[280px] rounded-3xl px-7 py-6 sm:px-10 sm:py-8 overflow-hidden z-40"
      initial={{ y: OFFSCREEN_Y, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: OFFSCREEN_Y, opacity: 0 }}
      transition={{
        y: { type: "spring", stiffness: 140, damping: 24, mass: 0.9 },
        opacity: { duration: 0.35, ease: "easeOut" },
      }}
      style={{
        maxHeight: "72vh",
        color: "#fafafa",
        fontFamily: "'FH Oscar', sans-serif",
        background: themeStyles.background,
        backdropFilter: "blur(22px) saturate(160%)",
        WebkitBackdropFilter: "blur(22px) saturate(160%)",
        border: themeStyles.border,
        boxShadow: themeStyles.boxShadow,
      }}
    >
      {title ? (
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className="mt-3 sm:mt-4 text-lg sm:text-xl md:text-2xl font-light opacity-90 leading-relaxed whitespace-pre-line">
          {subtitle}
        </p>
      ) : null}
    </motion.div>
  );
}
