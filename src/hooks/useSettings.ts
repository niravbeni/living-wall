"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CarouselSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

async function fetchCarouselSettings(): Promise<CarouselSettings> {
  const { data, error } = await supabase
    .from("carousel_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Failed to fetch settings:", error);
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...data };
}

export function useSettings() {
  const [settings, setSettings] = useState<CarouselSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const data = await fetchCarouselSettings();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("carousel_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carousel_settings" },
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

  const updateSettings = useCallback(
    async (updates: Partial<CarouselSettings>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
      const { error } = await supabase
        .from("carousel_settings")
        .update(updates)
        .eq("id", 1);
      if (error) {
        console.error("Failed to update settings:", error);
        refetch();
      }
    },
    [refetch]
  );

  return { settings, loading, updateSettings };
}
