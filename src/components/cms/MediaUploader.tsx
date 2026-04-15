"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { supabase, getPublicUrl } from "@/lib/supabase";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/types";
import type { CarouselItem } from "@/lib/types";
import { compressVideo, shouldCompress } from "@/lib/compress-video";
import { Upload, Loader2, AlertCircle } from "lucide-react";

interface MediaUploaderProps {
  itemCount: number;
  defaultDuration: number;
  onUpload: (item: Omit<CarouselItem, "id" | "created_at">) => Promise<void>;
}

type UploadPhase = "idle" | "compressing" | "uploading";

export function MediaUploader({
  itemCount,
  defaultDuration,
  onUpload,
}: MediaUploaderProps) {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [statusText, setStatusText] = useState("");
  const [compressPercent, setCompressPercent] = useState(0);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setError("");

      for (let i = 0; i < acceptedFiles.length; i++) {
        let file = acceptedFiles[i];
        const label = `${i + 1}/${acceptedFiles.length}: ${file.name}`;

        try {
          if (shouldCompress(file)) {
            setPhase("compressing");
            setCompressPercent(0);
            setStatusText(`Compressing ${label}`);

            file = await compressVideo(file, (pct) => {
              setCompressPercent(pct);
            });
          }

          setPhase("uploading");
          setStatusText(`Uploading ${label}`);

          const ext = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("media")
            .upload(fileName, file, { cacheControl: "3600", upsert: false });

          if (uploadError) throw uploadError;

          const mediaUrl = getPublicUrl(fileName);
          const isVideo = file.type.startsWith("video/");

          await onUpload({
            type: isVideo ? "video" : "image",
            title: file.name.replace(/\.[^/.]+$/, ""),
            media_url: mediaUrl,
            thumbnail_url: "",
            duration_seconds: defaultDuration,
            video_loop: false,
            sort_order: itemCount + i,
          });
        } catch (err) {
          console.error("Upload failed:", err);
          setError(
            `Failed to process ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      }

      setPhase("idle");
      setStatusText("");
      setCompressPercent(0);
    },
    [itemCount, defaultDuration, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: phase !== "idle",
    onDropRejected: (rejections) => {
      const msg = rejections[0]?.errors[0]?.message ?? "File rejected";
      setError(msg);
    },
  });

  const busy = phase !== "idle";

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
          p-8 transition-all cursor-pointer
          ${isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"}
          ${busy ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input {...getInputProps()} />
        {busy ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{statusText}</p>
            {phase === "compressing" && (
              <div className="w-full max-w-xs">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-[width] duration-300 ease-out rounded-full"
                    style={{ width: `${compressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                  {compressPercent}% compressed
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop media files"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Images (JPG, PNG, WebP, GIF) or Videos (MP4, WebM, MOV, AVI)
            </p>
            <p className="text-xs text-muted-foreground">
              Videos are automatically compressed to 1080p
            </p>
          </>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
