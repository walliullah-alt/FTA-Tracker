import { NextRequest, NextResponse } from "next/server";

// Server-side proxy — browser never talks to n8n directly, eliminating CORS issues
const N8N_BASE =
  process.env.NEXT_PUBLIC_N8N_BASE_URL || "https://n8nnextventures.xyz";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path") ?? "";

  // Forward all params except "path" to n8n
  const forward = new URLSearchParams(searchParams);
  forward.delete("path");
  const query = forward.size > 0 ? `?${forward.toString()}` : "";

  try {
    const res = await fetch(`${N8N_BASE}/webhook/${path}${query}`, {
      cache: "no-store",
    });
    const text = await res.text();
    if (!text) return NextResponse.json([]);
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path") ?? "";
  const body = await request.json();

  const res = await fetch(`${N8N_BASE}/webhook/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
