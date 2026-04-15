"use client";

import dynamic from "next/dynamic";

const Carousel = dynamic(
  () => import("@/components/playback/Carousel").then((m) => m.Carousel),
  {
    ssr: false,
    loading: () => <div className="h-screen w-screen bg-black" />,
  }
);

export default function PlaybackPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <Carousel />
    </div>
  );
}
