import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;

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
  onProgress?: (percent: number) => void
): Promise<File> {
  const ff = await getFFmpeg();

  const inputName = "input" + getExtension(file.name);
  const outputName = "output.mp4";

  ff.on("progress", ({ progress }) => {
    onProgress?.(Math.min(Math.round(progress * 100), 100));
  });

  await ff.writeFile(inputName, await fetchFile(file));

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

  const data = await ff.readFile(outputName);

  // Clean up virtual filesystem
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
