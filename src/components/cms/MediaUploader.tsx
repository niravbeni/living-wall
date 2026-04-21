"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { supabase, getPublicUrl } from "@/lib/supabase";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
  DEFAULT_ITEM_DIVIDER_FIELDS,
} from "@/lib/types";
import type { CarouselItem } from "@/lib/types";
import { Upload, Loader2, AlertCircle } from "lucide-react";

interface MediaUploaderProps {
  itemCount: number;
  defaultDuration: number;
  onUpload: (item: Omit<CarouselItem, "id" | "created_at">) => Promise<void>;
}

export function MediaUploader({
  itemCount,
  defaultDuration,
  onUpload,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string>("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setError("");

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setProgress(`Uploading ${i + 1}/${acceptedFiles.length}: ${file.name}`);

        try {
          const ext = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("media")
            .upload(fileName, file, { cacheControl: "31536000", upsert: false });

          if (uploadError) throw uploadError;

          const mediaUrl = getPublicUrl(fileName);
          const isVideo = file.type.startsWith("video/");

          const label = file.name.replace(/\.[^/.]+$/, "");
          await onUpload({
            type: isVideo ? "video" : "image",
            title: label,
            media_url: mediaUrl,
            thumbnail_url: "",
            duration_seconds: defaultDuration,
            video_loop: false,
            video_speed: 1.5,
            visible_in_carousel: true,
            ...DEFAULT_ITEM_DIVIDER_FIELDS,
            divider_title: label,
            sort_order: itemCount + i,
          });
        } catch (err) {
          console.error("Upload failed:", err);
          setError(`Failed to upload ${file.name}`);
        }
      }

      setUploading(false);
      setProgress("");
    },
    [itemCount, defaultDuration, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: uploading,
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.message ?? "File rejected";
      setError(msg);
    },
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
          p-8 transition-all cursor-pointer
          ${isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"}
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{progress}</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop media files"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Images (JPG, PNG, WebP, GIF) or Videos (MP4, WebM) up to 100MB
            </p>
          </>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
