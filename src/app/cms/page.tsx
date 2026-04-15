"use client";

import dynamic from "next/dynamic";

const CMSContent = dynamic(() => import("@/components/cms/CMSContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
    </div>
  ),
});

export default function CMSPage() {
  return <CMSContent />;
}
