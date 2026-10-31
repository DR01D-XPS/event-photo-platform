import { NextResponse } from "next/server";
import { getBearerToken, verifyModeToken } from "@/lib/auth";
import { deleteImage, moveImageToApproved } from "@/lib/storage";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const token = getBearerToken(request);

  if (!verifyModeToken(token, "admin")) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "approve" | "reject";
  };
  const { id } = await context.params;

  if (body.action === "approve") {
    const image = await moveImageToApproved(id);

    if (!image) {
      return NextResponse.json({ error: "Изображение не найдено." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    const deleted = await deleteImage(id);

    if (!deleted) {
      return NextResponse.json({ error: "Изображение не найдено." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Неизвестное действие." }, { status: 400 });
}
