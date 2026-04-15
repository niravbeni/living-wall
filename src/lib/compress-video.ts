import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export type CompressionPhase = "loading-engine" | "reading-file" | "compressing" | "finalizing";

interface CompressCallbacks {
  onPhase?: (phase: CompressionPhase) => void;
  onProgress?: (percent: number) => void;
}

async function getFFmpeg(onPhase?: (phase: CompressionPhase) => void): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;

  onPhase?.("loading-engine");
  ffmpeg = new FFmpeg();

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm"
    ),
  });

  return ffmpeg;
}

export async function compressVideo(
  file: File,
  callbacks?: CompressCallbacks
): Promise<File> {
  const ff = await getFFmpeg(callbacks?.onPhase);

  const inputName = "input" + getExtension(file.name);
  const outputName = "output.mp4";

  callbacks?.onPhase?.("reading-file");

  ff.on("progress", ({ progress }) => {
    const pct = Math.min(Math.max(Math.round(progress * 100), 0), 100);
    callbacks?.onProgress?.(pct);
  });

  await ff.writeFile(inputName, await fetchFile(file));

  callbacks?.onPhase?.("compressing");
  callbacks?.onProgress?.(0);

  await ff.exec([
    "-i",
    inputName,
    "-vf",
    "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "28",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputName,
  ]);

  callbacks?.onPhase?.("finalizing");

  const data = await ff.readFile(outputName);

  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "video/mp4" });
  const compressedName = file.name.replace(/\.[^/.]+$/, ".mp4");
  return new File([blob], compressedName, { type: "video/mp4" });
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot) : "";
}

export function shouldCompress(file: File): boolean {
  return file.type.startsWith("video/");
}
