"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DIVIDER_MEDIA_PLACEHOLDER } from "@/lib/types";
import type { CarouselItem } from "@/lib/types";
import { LayoutTemplate, Plus } from "lucide-react";

interface DividerAddProps {
  itemCount: number;
  defaultDuration: number;
  onAdd: (item: Omit<CarouselItem, "id" | "created_at">) => Promise<void>;
}

export function DividerAdd({ itemCount, defaultDuration, onAdd }: DividerAddProps) {
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await onAdd({
        type: "divider",
        title: "Divider",
        media_url: DIVIDER_MEDIA_PLACEHOLDER,
        thumbnail_url: "",
        duration_seconds: defaultDuration,
        video_loop: false,
        visible_in_carousel: true,
        sort_order: itemCount,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-muted-foreground/20 bg-muted/15 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <LayoutTemplate className="h-4 w-4" />
        Add divider intro
      </div>
      <p className="text-xs text-muted-foreground">
        Full-screen black slide with the IDEO logo and text from{" "}
        <span className="font-medium">Settings → Divider intros</span>. Place
        dividers before images, videos, or web pages in the list order.
      </p>
      <Button
        type="button"
        variant="secondary"
        disabled={saving}
        onClick={handleAdd}
        className="cursor-pointer w-full sm:w-auto"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        {saving ? "Adding…" : "Add divider"}
      </Button>
    </div>
  );
}
