export interface CarouselItem {
  id: string;
  type: "image" | "video";
  title: string;
  media_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  video_loop: boolean;
  /** When false, item is kept in CMS but excluded from playback */
  visible_in_carousel: boolean;
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

export type TransitionType = "crossfade" | "slide" | "zoomFade" | "cardStack";

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  crossfade: "Crossfade",
  slide: "Slide",
  zoomFade: "Zoom Fade",
  cardStack: "Card Stack",
};

export const DEFAULT_SETTINGS: CarouselSettings = {
  id: 1,
  auto_loop: true,
  transition_type: "crossfade",
  transition_duration_ms: 800,
  default_item_duration_seconds: 5,
  show_progress_bar: true,
};

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
