import { NextResponse } from "next/server";

export function clampInt(value: string | null, defaultVal: number, min: number, max: number): number {
  const parsed = parseInt(value ?? String(defaultVal), 10);
  if (isNaN(parsed)) return defaultVal;
  return Math.min(Math.max(parsed, min), max);
}

export function errorResponse(err: unknown) {
  console.error("API error:", err);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
