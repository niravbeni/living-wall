"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeWebUrl } from "@/lib/url";
import type { CarouselItem } from "@/lib/types";
import { DEFAULT_ITEM_DIVIDER_FIELDS } from "@/lib/types";
import { Globe, Plus } from "lucide-react";

interface WebPageAddProps {
  itemCount: number;
  defaultDuration: number;
  onAdd: (item: Omit<CarouselItem, "id" | "created_at">) => Promise<void>;
}

export function WebPageAdd({
  itemCount,
  defaultDuration,
  onAdd,
}: WebPageAddProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalized = normalizeWebUrl(url);
    if (!normalized) {
      setError("Enter a valid URL (https://…)");
      return;
    }
    setSaving(true);
    try {
      let label = title.trim();
      if (!label) {
        try {
          label = new URL(normalized).hostname;
        } catch {
          label = "Web page";
        }
      }
      await onAdd({
        type: "web",
        title: label,
        media_url: normalized,
        thumbnail_url: "",
        duration_seconds: defaultDuration,
        video_loop: false,
        visible_in_carousel: true,
        ...DEFAULT_ITEM_DIVIDER_FIELDS,
        divider_title: label,
        sort_order: itemCount,
      });
      setUrl("");
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-muted-foreground/20 bg-muted/20 p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Globe className="h-4 w-4" />
        Add website (iframe)
      </div>
      <p className="text-xs text-muted-foreground">
        Shown full screen. Auto-advance pauses until you press Space or arrow
        keys to go to the next item.
      </p>
      <div className="space-y-2">
        <Label htmlFor="web-url">Page URL</Label>
        <Input
          id="web-url"
          type="url"
          inputMode="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={saving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="web-title">Label (optional)</Label>
        <Input
          id="web-title"
          placeholder="Defaults to hostname"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving || !url.trim()} className="cursor-pointer w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-1.5" />
        {saving ? "Adding…" : "Add to carousel"}
      </Button>
    </form>
  );
}
