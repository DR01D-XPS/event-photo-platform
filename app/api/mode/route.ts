import { NextResponse } from "next/server";
import { createModeToken, resolveMode } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = typeof body.name === "string" ? body.name : "";
  const mode = resolveMode(name);

  if (mode === "admin" || mode === "slideshow") {
    return NextResponse.json({
      mode,
      token: createModeToken(mode)
    });
  }

  return NextResponse.json({ mode: "user" });
}
