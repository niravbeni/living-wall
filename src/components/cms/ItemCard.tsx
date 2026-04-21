"use client";

import { useState, useEffect, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CarouselItem } from "@/lib/types";
import { normalizeWebUrl } from "@/lib/url";
import { proxyMediaUrl } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
  Globe,
  LayoutTemplate,
} from "lucide-react";

interface ItemCardProps {
  item: CarouselItem;
  onUpdate: (id: string, updates: Partial<CarouselItem>) => Promise<void>;
  onDelete: (id: string, mediaUrl: string) => Promise<void>;
}

/**
 * Local-state text input that only pushes to the DB on blur.
 * Resyncs from the prop when the prop changes externally (e.g. realtime).
 */
function BufferedInput({
  value,
  onCommit,
  ...rest
}: {
  value: string;
  onCommit: (v: string) => void;
} & Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "onBlur" | "onKeyDown"
>) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <Input
      {...rest}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

function BufferedTextarea({
  value,
  onCommit,
  ...rest
}: {
  value: string;
  onCommit: (v: string) => void;
} & Omit<
  React.ComponentProps<typeof Textarea>,
  "value" | "onChange" | "onBlur"
>) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <Textarea
      {...rest}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local);
      }}
    />
  );
}

export function ItemCard({ item, onUpdate, onDelete }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async () => {
    if (!confirm("Delete this item?")) return;
    setDeleting(true);
    try {
      await onDelete(item.id, item.media_url);
    } catch {
      setDeleting(false);
    }
  };

  const commit = useCallback(
    (updates: Partial<CarouselItem>) => onUpdate(item.id, updates),
    [item.id, onUpdate]
  );

  const handleDownload = async () => {
    if (!item.media_url) return;
    setDownloading(true);
    try {
      const res = await fetch(proxyMediaUrl(item.media_url));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = item.media_url.split(".").pop()?.split("?")[0] ?? "";
      a.download = `${item.title || "download"}${ext ? `.${ext}` : ""}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const isVisible = item.visible_in_carousel !== false;
  const isLegacyDivider = item.type === "divider";
  const isContentItem =
    item.type === "image" ||
    item.type === "video" ||
    item.type === "web";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden transition-opacity ${!isVisible ? "opacity-60" : ""}`}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <button
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="relative h-14 w-20 shrink-0 rounded-md overflow-hidden bg-muted">
          {item.type === "web" ? (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Globe className="h-7 w-7 text-muted-foreground" />
            </div>
          ) : isLegacyDivider ? (
            <div className="flex h-full w-full items-center justify-center bg-black">
              <LayoutTemplate className="h-6 w-6 text-white/40" />
            </div>
          ) : item.type === "video" ? (
            <video
              src={proxyMediaUrl(item.media_url)}
              className="h-full w-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proxyMediaUrl(item.media_url)}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          )}
          {item.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Video className="h-4 w-4 text-white/80" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {item.title || "Untitled"}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs gap-1">
              {item.type === "web" ? (
                <Globe className="h-3 w-3" />
              ) : isLegacyDivider ? (
                <LayoutTemplate className="h-3 w-3" />
              ) : item.type === "video" ? (
                <Video className="h-3 w-3" />
              ) : (
                <ImageIcon className="h-3 w-3" />
              )}
              {isLegacyDivider ? "legacy" : item.type === "web" ? "web" : item.type}
            </Badge>
            {item.type === "web" ? (
              <span className="text-xs text-muted-foreground">
                Manual advance
              </span>
            ) : isLegacyDivider ? (
              <span className="text-xs text-muted-foreground">
                Remove this row
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {item.duration_seconds}s
                {item.divider_enabled ? " · intro" : ""}
              </span>
            )}
            {!isVisible && (
              <Badge variant="outline" className="text-xs gap-1">
                <EyeOff className="h-3 w-3" />
                Hidden
              </Badge>
            )}
          </div>
        </div>

        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground hidden sm:block">
              Display
            </span>
            <div className="flex items-center gap-1.5">
              {isVisible ? (
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <Switch
                id={`visible-${item.id}`}
                className="cursor-pointer scale-90"
                checked={isVisible}
                onCheckedChange={(checked) =>
                  commit({ visible_in_carousel: checked })
                }
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {expanded && (
        <div
          className="border-t px-4 py-4 space-y-4 bg-muted/30"
          onClick={(e) => e.stopPropagation()}
        >
          {isLegacyDivider ? (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This row used an older &quot;divider&quot; item type. Intros are
                now configured on each image, video, or web item. Delete this
                row when you no longer need it.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete legacy row"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor={`title-${item.id}`}>Title</Label>
                <BufferedInput
                  id={`title-${item.id}`}
                  value={item.title}
                  onCommit={(v) => commit({ title: v })}
                  placeholder="Item title"
                />
              </div>

              {item.type === "web" ? (
                <div className="space-y-2">
                  <Label htmlFor={`url-${item.id}`}>Page URL</Label>
                  <BufferedInput
                    id={`url-${item.id}`}
                    type="url"
                    value={item.media_url}
                    onCommit={(v) => {
                      const n = normalizeWebUrl(v);
                      commit({ media_url: n || v });
                    }}
                    placeholder="https://"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-advance is off for this slide until you press Space or
                    arrows. Some sites block embedding in iframes.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`duration-${item.id}`}>
                      Duration (seconds)
                    </Label>
                    <BufferedInput
                      id={`duration-${item.id}`}
                      type="number"
                      min={1}
                      max={300}
                      value={String(item.duration_seconds)}
                      onCommit={(v) =>
                        commit({ duration_seconds: parseInt(v) || 5 })
                      }
                    />
                  </div>

                  {item.type === "video" && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`loop-${item.id}`}
                          className="cursor-pointer"
                        >
                          Loop video
                        </Label>
                        <Switch
                          id={`loop-${item.id}`}
                          className="cursor-pointer"
                          checked={item.video_loop}
                          onCheckedChange={(checked) =>
                            commit({ video_loop: checked })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Playback speed</Label>
                          <span className="text-xs text-muted-foreground">
                            {item.video_speed}x
                          </span>
                        </div>
                        <Slider
                          className="cursor-pointer"
                          value={[item.video_speed]}
                          onValueChange={(v) =>
                            commit({
                              video_speed: Math.round((Array.isArray(v) ? v[0] : v) * 100) / 100,
                            })
                          }
                          min={0.25}
                          max={2}
                          step={0.25}
                        />
                        <div className="relative h-4 text-xs text-muted-foreground">
                          <span className="absolute left-0">0.25x</span>
                          <span className="absolute" style={{ left: `${((0.75 - 0.25) / 1.75) * 100}%`, transform: "translateX(-50%)" }}>0.75x</span>
                          <span className="absolute" style={{ left: `${((1 - 0.25) / 1.75) * 100}%`, transform: "translateX(-50%)" }}>1x</span>
                          <span className="absolute" style={{ left: `${((1.25 - 0.25) / 1.75) * 100}%`, transform: "translateX(-50%)" }}>1.25x</span>
                          <span className="absolute" style={{ left: `${((1.5 - 0.25) / 1.75) * 100}%`, transform: "translateX(-50%)" }}>1.5x</span>
                          <span className="absolute" style={{ left: `${((1.75 - 0.25) / 1.75) * 100}%`, transform: "translateX(-50%)" }}>1.75x</span>
                          <span className="absolute right-0">2x</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {isContentItem && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-1">
                      Intro before this slide
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Full-screen intro with the IDEO logo (
                      <code className="text-[11px]">/ideo.svg</code>
                      ), your copy, and background color. Shown only when enabled.
                    </p>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <Label
                        htmlFor={`intro-on-${item.id}`}
                        className="cursor-pointer"
                      >
                        Show intro
                      </Label>
                      <Switch
                        id={`intro-on-${item.id}`}
                        className="cursor-pointer"
                        checked={item.divider_enabled}
                        onCheckedChange={(checked) =>
                          commit({ divider_enabled: checked })
                        }
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`div-title-${item.id}`}>
                          Intro title
                        </Label>
                        <BufferedInput
                          id={`div-title-${item.id}`}
                          value={item.divider_title}
                          onCommit={(v) => commit({ divider_title: v })}
                          placeholder="Headline"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div-sub-${item.id}`}>
                          Intro subtitle
                        </Label>
                        <BufferedInput
                          id={`div-sub-${item.id}`}
                          value={item.divider_subtitle}
                          onCommit={(v) => commit({ divider_subtitle: v })}
                          placeholder="Supporting line"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div-body-${item.id}`}>
                          Intro body
                        </Label>
                        <BufferedTextarea
                          id={`div-body-${item.id}`}
                          rows={3}
                          value={item.divider_body}
                          onCommit={(v) => commit({ divider_body: v })}
                          placeholder="Optional longer copy"
                          className="resize-y min-h-[72px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div-bg-${item.id}`}>
                          Background color
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id={`div-bg-${item.id}`}
                            type="color"
                            className="h-10 w-14 shrink-0 cursor-pointer p-1"
                            value={item.divider_background}
                            onChange={(e) =>
                              commit({ divider_background: e.target.value })
                            }
                          />
                          <BufferedInput
                            value={item.divider_background}
                            onCommit={(v) =>
                              commit({ divider_background: v })
                            }
                            placeholder="#000000"
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div-dur-${item.id}`}>
                          Intro duration (seconds)
                        </Label>
                        <BufferedInput
                          id={`div-dur-${item.id}`}
                          type="number"
                          min={1}
                          max={300}
                          value={String(item.divider_duration_seconds)}
                          onCommit={(v) =>
                            commit({
                              divider_duration_seconds:
                                parseInt(v, 10) || 5,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isContentItem && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-1">
                      Caption overlay
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      A translucent card in the bottom-left corner that
                      fades out after a few seconds. Leave the fields
                      blank to reuse the intro title / subtitle.
                    </p>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <Label
                        htmlFor={`caption-on-${item.id}`}
                        className="cursor-pointer"
                      >
                        Show caption
                      </Label>
                      <Switch
                        id={`caption-on-${item.id}`}
                        className="cursor-pointer"
                        checked={item.caption_enabled}
                        onCheckedChange={(checked) =>
                          commit({ caption_enabled: checked })
                        }
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`cap-title-${item.id}`}>
                          Caption title
                        </Label>
                        <BufferedInput
                          id={`cap-title-${item.id}`}
                          value={item.caption_title}
                          onCommit={(v) => commit({ caption_title: v })}
                          placeholder={
                            item.divider_title ||
                            "Uses intro title when blank"
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`cap-sub-${item.id}`}>
                          Caption subtitle
                        </Label>
                        <BufferedInput
                          id={`cap-sub-${item.id}`}
                          value={item.caption_subtitle}
                          onCommit={(v) => commit({ caption_subtitle: v })}
                          placeholder={
                            item.divider_subtitle ||
                            "Uses intro subtitle when blank"
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(item.type === "image" || item.type === "video") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? "Downloading..." : "Download file"}
                </Button>
              )}

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete Item"}
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
