"use client";

import type { CarouselSettings, TransitionType } from "@/lib/types";
import { TRANSITION_LABELS } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface GlobalSettingsProps {
  settings: CarouselSettings;
  onUpdate: (updates: Partial<CarouselSettings>) => Promise<void>;
}

export function GlobalSettings({ settings, onUpdate }: GlobalSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-4">Playback</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-loop" className="cursor-pointer">
                Auto Loop
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically advance through items
              </p>
            </div>
            <Switch
              id="auto-loop"
              className="cursor-pointer"
              checked={settings.auto_loop}
              onCheckedChange={(checked) => onUpdate({ auto_loop: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-duration">Default Duration (seconds)</Label>
            <Input
              id="default-duration"
              type="number"
              min={1}
              max={120}
              value={settings.default_item_duration_seconds}
              onChange={(e) =>
                onUpdate({
                  default_item_duration_seconds:
                    parseInt(e.target.value) || 5,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Default display time for new items
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-4">Transitions</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Transition Style</Label>
            <Select
              value={settings.transition_type}
              onValueChange={(value) =>
                onUpdate({ transition_type: value as TransitionType })
              }
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(TRANSITION_LABELS) as [
                    TransitionType,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="cursor-pointer"
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Transition Speed</Label>
              <span className="text-xs text-muted-foreground">
                {settings.transition_duration_ms}ms
              </span>
            </div>
            <Slider
              className="cursor-pointer"
              value={[settings.transition_duration_ms]}
              onValueChange={(value) =>
                onUpdate({
                  transition_duration_ms: Array.isArray(value)
                    ? value[0]
                    : value,
                })
              }
              min={200}
              max={2000}
              step={100}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fast</span>
              <span>Slow</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-4">Divider intros</h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Full-screen black slides with the IDEO logo (
          <code className="text-[11px]">/ideo.svg</code>
          ). Add <span className="font-medium">divider</span> items in Content
          and order them before images, videos, or web pages.
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="divider-title">Title</Label>
            <Input
              id="divider-title"
              value={settings.divider_title ?? ""}
              onChange={(e) =>
                onUpdate({ divider_title: e.target.value })
              }
              placeholder="Main headline"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="divider-subtitle">Subtitle</Label>
            <Input
              id="divider-subtitle"
              value={settings.divider_subtitle ?? ""}
              onChange={(e) =>
                onUpdate({ divider_subtitle: e.target.value })
              }
              placeholder="Supporting line"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="divider-body">Body text</Label>
            <Textarea
              id="divider-body"
              rows={4}
              value={settings.divider_body ?? ""}
              onChange={(e) =>
                onUpdate({ divider_body: e.target.value })
              }
              placeholder="Additional copy (optional)"
              className="resize-y min-h-[96px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="divider-duration">
              Divider duration (seconds)
            </Label>
            <Input
              id="divider-duration"
              type="number"
              min={1}
              max={120}
              value={settings.divider_duration_seconds ?? 5}
              onChange={(e) =>
                onUpdate({
                  divider_duration_seconds:
                    parseInt(e.target.value, 10) || 5,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              How long each divider slide stays on screen before the next item.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-4">Display</h3>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="progress-bar" className="cursor-pointer">
              Progress Bar
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Show progress indicator on playback
            </p>
          </div>
          <Switch
            id="progress-bar"
            className="cursor-pointer"
            checked={settings.show_progress_bar}
            onCheckedChange={(checked) =>
              onUpdate({ show_progress_bar: checked })
            }
          />
        </div>
      </div>
    </div>
  );
}
