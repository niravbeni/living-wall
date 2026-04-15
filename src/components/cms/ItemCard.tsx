"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CarouselItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
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

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden">
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
          {item.type === "video" ? (
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
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs gap-1">
              {item.type === "video" ? (
                <Video className="h-3 w-3" />
              ) : (
                <ImageIcon className="h-3 w-3" />
              )}
              {item.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {item.duration_seconds}s
            </span>
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
          <div className="space-y-2">
            <Label htmlFor={`title-${item.id}`}>Title</Label>
            <Input
              id={`title-${item.id}`}
              value={item.title}
              onChange={(e) => onUpdate(item.id, { title: e.target.value })}
              placeholder="Item title"
            />
          </div>

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
              <Label htmlFor={`loop-${item.id}`} className="cursor-pointer">
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
        </div>
      )}
    </Card>
  );
}
