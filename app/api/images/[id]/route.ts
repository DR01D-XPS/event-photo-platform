import { NextResponse } from "next/server";
import { getBearerToken, verifyModeToken } from "@/lib/auth";
import { deleteImage } from "@/lib/storage";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const token = getBearerToken(request);
  const canDelete =
    verifyModeToken(token, "admin") || verifyModeToken(token, "slideshow");

  if (!canDelete) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteImage(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Изображение не найдено." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
