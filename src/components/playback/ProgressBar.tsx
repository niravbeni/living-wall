"use client";

interface ProgressBarProps {
  progress: number;
  visible: boolean;
}

export function ProgressBar({ progress, visible }: ProgressBarProps) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/10">
      <div
        className="h-full bg-white/60 transition-[width] duration-100 ease-linear"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
