import { NextResponse } from "next/server";

// Healthcheck für Coolify (analog Brainmotion: /api/health → 200)
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
