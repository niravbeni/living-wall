"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import type { CarouselItem as CarouselItemType } from "@/lib/types";
import type { PlaybackSlide } from "@/lib/playback-slides";
import { proxyMediaUrl } from "@/lib/supabase";

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

  const [captionVisible, setCaptionVisible] = useState(true);
  useEffect(() => {
    if (phase !== "content") return;
    setCaptionVisible(true);
    const CAPTION_VISIBLE_MS = 5000;
    const CAPTION_FADE_MS = 600;
    const t = setTimeout(
      () => setCaptionVisible(false),
      CAPTION_VISIBLE_MS - CAPTION_FADE_MS
    );
    return () => clearTimeout(t);
  }, [item.id, phase]);

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

  const captionTitle =
    item.caption_title?.trim() || item.divider_title?.trim();
  const captionSubtitle =
    item.caption_subtitle?.trim() || item.divider_subtitle?.trim();
  const hasCaption =
    item.caption_enabled !== false &&
    Boolean(captionTitle || captionSubtitle);

  if (item.type === "web") {
    return (
      <>
        <iframe
          src={isActive ? mediaSrc : "about:blank"}
          title={item.title || "Web page"}
          className="absolute inset-0 h-full w-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
          referrerPolicy="no-referrer-when-downgrade"
          loading="eager"
        />
        {hasCaption && (
          <CaptionOverlay
            title={captionTitle}
            subtitle={captionSubtitle}
            visible={captionVisible}
          />
        )}
      </>
    );
  }

  if (item.type === "video") {
    return (
      <>
        <video
          ref={videoRef}
          src={mediaSrc}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          loop={item.video_loop}
          onEnded={onVideoEnded}
        />
        {hasCaption && (
          <CaptionOverlay
            title={captionTitle}
            subtitle={captionSubtitle}
            visible={captionVisible}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mediaSrc}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {hasCaption && (
        <CaptionOverlay
          title={captionTitle}
          subtitle={captionSubtitle}
          visible={captionVisible}
        />
      )}
    </>
  );
}

interface CaptionOverlayProps {
  title?: string;
  subtitle?: string;
  visible: boolean;
}

function CaptionOverlay({ title, subtitle, visible }: CaptionOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute bottom-6 left-6 sm:bottom-10 sm:left-10 max-w-[70%] rounded-2xl px-5 py-4 sm:px-7 sm:py-5 transition-opacity duration-[600ms] ease-out"
      style={{
        opacity: visible ? 1 : 0,
        color: "#fafafa",
        fontFamily: "'FH Oscar', sans-serif",
        background:
          "linear-gradient(135deg, rgba(20,20,20,0.32) 0%, rgba(30,30,30,0.22) 60%, rgba(60,60,60,0.12) 100%)",
        backdropFilter: "blur(22px) saturate(160%)",
        WebkitBackdropFilter: "blur(22px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      {title ? (
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight">
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className="mt-1 sm:mt-2 text-base sm:text-lg md:text-xl font-light opacity-90 leading-snug">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
