export interface CarouselItem {
  id: string;
  /** Legacy `divider` rows are ignored in CMS/playback; use per-item intro instead */
  type: "image" | "video" | "web" | "divider";
  title: string;
  media_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  video_loop: boolean;
  /** Playback rate: 0.25–2, default 1.5 */
  video_speed: number;
  /** When false, item is kept in CMS but excluded from playback */
  visible_in_carousel: boolean;
  /** Full-screen intro before this item’s content (IDEO logo + copy on colored bg) */
  divider_enabled: boolean;
  divider_title: string;
  divider_subtitle: string;
  divider_body: string;
  /** CSS hex background, e.g. #000000 */
  divider_background: string;
  divider_duration_seconds: number;
  /** When true, show a fading bottom-left caption on this item during playback */
  caption_enabled: boolean;
  /** Caption title. Falls back to divider_title when empty. */
  caption_title: string;
  /** Caption subtitle. Falls back to divider_subtitle when empty. */
  caption_subtitle: string;
  sort_order: number;
  created_at: string;
}

export interface CarouselSettings {
  id: number;
  auto_loop: boolean;
  transition_type: TransitionType;
  transition_duration_ms: number;
  default_item_duration_seconds: number;
  show_progress_bar: boolean;
}

export type TransitionType =
  | "crossfade"
  | "slide"
  | "zoomFade"
  | "cardStack"
  | "zoomBurst";

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  crossfade: "Crossfade",
  slide: "Slide",
  zoomFade: "Zoom Fade",
  cardStack: "Card Stack",
  zoomBurst: "Zoom Burst",
};

export const DEFAULT_SETTINGS: CarouselSettings = {
  id: 1,
  auto_loop: true,
  transition_type: "crossfade",
  transition_duration_ms: 800,
  default_item_duration_seconds: 5,
  show_progress_bar: true,
};

export const DEFAULT_DIVIDER_BACKGROUND = "#000000";

/** Defaults for per-item intro fields on new media / web rows */
export const DEFAULT_ITEM_DIVIDER_FIELDS = {
  divider_enabled: true,
  divider_title: "",
  divider_subtitle: "Lorem ipsum dolor sit amet",
  divider_body:
    "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  divider_background: DEFAULT_DIVIDER_BACKGROUND,
  divider_duration_seconds: 3,
  caption_enabled: true,
  caption_title: "",
  caption_subtitle: "",
} as const;

export const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

export const ACCEPTED_VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
};

export const ACCEPTED_FILE_TYPES = {
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
