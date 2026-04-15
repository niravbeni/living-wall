"use client";

import { useRef, useEffect } from "react";
import type { CarouselItem as CarouselItemType } from "@/lib/types";

interface CarouselItemProps {
  item: CarouselItemType;
  isActive: boolean;
  onVideoEnded: () => void;
}

export function CarouselItemDisplay({
  item,
  isActive,
  onVideoEnded,
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
