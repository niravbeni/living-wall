"use client";

import { useRef, useEffect, useMemo } from "react";
import type { CarouselItem as CarouselItemType } from "@/lib/types";
import type { PlaybackSlide } from "@/lib/playback-slides";

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

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  if (phase === "intro") {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 sm:px-10"
        style={{ backgroundColor: bg, color: fg }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ideo.svg"
          alt="IDEO"
          className="mb-8 sm:mb-10 w-[min(40vw,220px)] max-h-24 object-contain"
          style={{
            filter:
              fg === "#18181b"
                ? "invert(1) hue-rotate(180deg) brightness(0.15)"
                : "none",
          }}
          draggable={false}
        />
        {item.divider_title ? (
          <h1
            className="text-center text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight max-w-4xl"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
          >
            {item.divider_title}
          </h1>
        ) : null}
        {item.divider_subtitle ? (
          <p
            className="mt-4 text-center text-lg sm:text-xl max-w-3xl opacity-90"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.08)" }}
          >
            {item.divider_subtitle}
          </p>
        ) : null}
        {item.divider_body ? (
          <p
            className="mt-6 text-center text-base sm:text-lg max-w-2xl whitespace-pre-wrap leading-relaxed opacity-80"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.08)" }}
          >
            {item.divider_body}
          </p>
        ) : null}
      </div>
    );
  }

  if (item.type === "web") {
    return (
      <iframe
        src={isActive ? item.media_url : "about:blank"}
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
        src={item.media_url}
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
      src={item.media_url}
      alt={item.title}
      className="absolute inset-0 h-full w-full object-cover"
      draggable={false}
    />
  );
}
