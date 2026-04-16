"use client";

import { useRef, useEffect } from "react";
import type { CarouselItem as CarouselItemType, CarouselSettings } from "@/lib/types";

interface CarouselItemProps {
  item: CarouselItemType;
  isActive: boolean;
  onVideoEnded: () => void;
  settings: CarouselSettings;
}

export function CarouselItemDisplay({
  item,
  isActive,
  onVideoEnded,
  settings,
}: CarouselItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  if (item.type === "divider") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white px-6 sm:px-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ideo.svg"
          alt="IDEO"
          className="mb-8 sm:mb-10 w-[min(40vw,220px)] max-h-24 object-contain"
          draggable={false}
        />
        {settings.divider_title ? (
          <h1 className="text-center text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight max-w-4xl">
            {settings.divider_title}
          </h1>
        ) : null}
        {settings.divider_subtitle ? (
          <p className="mt-4 text-center text-lg sm:text-xl text-white/85 max-w-3xl">
            {settings.divider_subtitle}
          </p>
        ) : null}
        {settings.divider_body ? (
          <p className="mt-6 text-center text-base sm:text-lg text-white/70 max-w-2xl whitespace-pre-wrap leading-relaxed">
            {settings.divider_body}
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
