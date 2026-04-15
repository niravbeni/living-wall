"use client";

import dynamic from "next/dynamic";

const Carousel = dynamic(() => import("@/components/playback/Carousel").then(m => m.Carousel), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
    </div>
  ),
});

export default function PlaybackPage() {
  return <Carousel />;
}
