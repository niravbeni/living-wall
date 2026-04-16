import type { CarouselItem } from "@/lib/types";

export type PlaybackSlide = {
  key: string;
  phase: "intro" | "content";
  item: CarouselItem;
};

/** Build ordered playback steps: optional intro per content row, then the asset. */
export function expandPlaybackSlides(items: CarouselItem[]): PlaybackSlide[] {
  const out: PlaybackSlide[] = [];
  for (const item of items) {
    if (item.type === "divider") continue;
    if (item.divider_enabled) {
      out.push({ key: `${item.id}-intro`, phase: "intro", item });
    }
    out.push({ key: `${item.id}-content`, phase: "content", item });
  }
  return out;
}
