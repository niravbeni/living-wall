"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CarouselItem } from "@/lib/types";
import { normalizeWebUrl } from "@/lib/url";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
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

export function ItemCard({ item, onUpdate, onDelete }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
              src={item.media_url}
              className="h-full w-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.media_url}
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
                  onUpdate(item.id, { visible_in_carousel: checked })
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
                <Input
                  id={`title-${item.id}`}
                  value={item.title}
                  onChange={(e) => onUpdate(item.id, { title: e.target.value })}
                  placeholder="Item title"
                />
              </div>

              {item.type === "web" ? (
                <div className="space-y-2">
                  <Label htmlFor={`url-${item.id}`}>Page URL</Label>
                  <Input
                    id={`url-${item.id}`}
                    type="url"
                    value={item.media_url}
                    onChange={(e) =>
                      onUpdate(item.id, { media_url: e.target.value })
                    }
                    onBlur={(e) => {
                      const n = normalizeWebUrl(e.target.value);
                      if (n) onUpdate(item.id, { media_url: n });
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
                    <Input
                      id={`duration-${item.id}`}
                      type="number"
                      min={1}
                      max={300}
                      value={item.duration_seconds}
                      onChange={(e) =>
                        onUpdate(item.id, {
                          duration_seconds: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>

                  {item.type === "video" && (
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
                          onUpdate(item.id, { video_loop: checked })
                        }
                      />
                    </div>
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
                          onUpdate(item.id, { divider_enabled: checked })
                        }
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`div-title-${item.id}`}>
                          Intro title
                        </Label>
                        <Input
                          id={`div-title-${item.id}`}
                          value={item.divider_title}
                          onChange={(e) =>
                            onUpdate(item.id, { divider_title: e.target.value })
                          }
                          placeholder="Headline"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div-sub-${item.id}`}>
                          Intro subtitle
                        </Label>
                        <Input
                          id={`div-sub-${item.id}`}
                          value={item.divider_subtitle}
                          onChange={(e) =>
                            onUpdate(item.id, {
                              divider_subtitle: e.target.value,
                            })
                          }
                          placeholder="Supporting line"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div-body-${item.id}`}>
                          Intro body
                        </Label>
                        <Textarea
                          id={`div-body-${item.id}`}
                          rows={3}
                          value={item.divider_body}
                          onChange={(e) =>
                            onUpdate(item.id, { divider_body: e.target.value })
                          }
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
                              onUpdate(item.id, {
                                divider_background: e.target.value,
                              })
                            }
                          />
                          <Input
                            value={item.divider_background}
                            onChange={(e) =>
                              onUpdate(item.id, {
                                divider_background: e.target.value,
                              })
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
                        <Input
                          id={`div-dur-${item.id}`}
                          type="number"
                          min={1}
                          max={300}
                          value={item.divider_duration_seconds}
                          onChange={(e) =>
                            onUpdate(item.id, {
                              divider_duration_seconds:
                                parseInt(e.target.value, 10) || 5,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
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
