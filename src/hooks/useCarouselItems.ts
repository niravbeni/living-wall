"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CarouselItem } from "@/lib/types";
import { DEFAULT_DIVIDER_BACKGROUND } from "@/lib/types";

function normalizeItem(
  row: CarouselItem & { visible_in_carousel?: boolean | null }
): CarouselItem {
  const dDur = row.divider_duration_seconds;
  const vSpeed = row.video_speed;
  return {
    ...row,
    visible_in_carousel: row.visible_in_carousel !== false,
    video_speed:
      typeof vSpeed === "number" && !Number.isNaN(vSpeed)
        ? Math.max(0.25, Math.min(2, vSpeed))
        : 1.5,
    divider_enabled: row.divider_enabled === true,
    divider_title: row.divider_title ?? "",
    divider_subtitle: row.divider_subtitle ?? "",
    divider_body: row.divider_body ?? "",
    divider_background: row.divider_background || DEFAULT_DIVIDER_BACKGROUND,
    divider_duration_seconds:
      typeof dDur === "number" && !Number.isNaN(dDur)
        ? Math.max(1, Math.min(300, dDur))
        : 3,
    caption_enabled: row.caption_enabled !== false,
  };
}

async function fetchCarouselItems(): Promise<CarouselItem[]> {
  const { data, error } = await supabase
    .from("carousel_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch carousel items:", error);
    return [];
  }
  return (data ?? []).map((row) =>
    normalizeItem(row as CarouselItem & { visible_in_carousel?: boolean | null })
  );
}

export function useCarouselItems() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const data = await fetchCarouselItems();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("carousel_items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carousel_items" },
        () => {
          refetch();
        }
      )
      .subscribe((_status, err) => {
        if (!err) refetch();
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const addItem = useCallback(
    async (item: Omit<CarouselItem, "id" | "created_at">) => {
      const { error } = await supabase.from("carousel_items").insert(item);
      if (error) throw error;
    },
    []
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<CarouselItem>) => {
      const { error } = await supabase
        .from("carousel_items")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    []
  );

  const deleteItem = useCallback(async (id: string, mediaUrl: string) => {
    const path = mediaUrl.split("/media/")[1];
    if (path) {
      await supabase.storage.from("media").remove([decodeURIComponent(path)]);
    }
    const { error } = await supabase
      .from("carousel_items")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }, []);

  const reorderItems = useCallback(
    async (reordered: CarouselItem[]) => {
      setItems(reordered);
      const updates = reordered.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }));
      for (const update of updates) {
        await supabase
          .from("carousel_items")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
    },
    []
  );

  return { items, loading, addItem, updateItem, deleteItem, reorderItems, refetch };
}
