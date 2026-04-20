import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/media`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.map(decodeURIComponent).join("/");

  if (!filePath || !SUPABASE_URL) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const upstream = await fetch(`${STORAGE_BASE}/${filePath}`, {
    next: { revalidate: false },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Upstream not found" },
      { status: upstream.status }
    );
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "CDN-Cache-Control": "public, max-age=31536000, immutable",
      "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
