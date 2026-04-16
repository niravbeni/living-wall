"use client";

import { useCarouselItems } from "@/hooks/useCarouselItems";
import { useSettings } from "@/hooks/useSettings";
import { MediaUploader } from "@/components/cms/MediaUploader";
import { WebPageAdd } from "@/components/cms/WebPageAdd";
import { ItemList } from "@/components/cms/ItemList";
import { GlobalSettings } from "@/components/cms/GlobalSettings";
import { PinGate } from "@/components/cms/PinGate";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Loader2, Settings, LayoutList } from "lucide-react";
import { useState } from "react";

export default function CMSContent() {
  const { items, loading, addItem, updateItem, deleteItem, reorderItems } =
    useCarouselItems();
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"content" | "settings">(
    "content"
  );

  if (loading || settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showingCount = items.filter((i) => i.visible_in_carousel !== false)
    .length;

  return (
    <PinGate>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
            <h1 className="text-lg font-semibold tracking-tight">
              Living Wall
            </h1>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => window.open("/", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Preview
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab("content")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "content"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="h-4 w-4" />
              Content ({showingCount}/{items.length})
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "settings"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>

          {activeTab === "content" ? (
            <div className="space-y-6">
              {items.length > 0 && (
                <p className="text-xs text-muted-foreground -mt-1">
                  Toggle <span className="font-medium">Display</span> on each
                  row to include or hide items on the wall without removing them.
                </p>
              )}
              <MediaUploader
                itemCount={items.length}
                defaultDuration={settings.default_item_duration_seconds}
                onUpload={addItem}
              />
              <WebPageAdd
                itemCount={items.length}
                defaultDuration={settings.default_item_duration_seconds}
                onAdd={addItem}
              />
              <Separator />
              <ItemList
                items={items}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onReorder={reorderItems}
              />
            </div>
          ) : (
            <GlobalSettings
              settings={settings}
              onUpdate={updateSettings}
            />
          )}
        </div>
      </div>
    </PinGate>
  );
}
