import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getBearerToken, resolveMode, verifyModeToken } from "@/lib/auth";
import { getSafeFileName, getUploadPath, saveUploadedFile, toPublicImage } from "@/lib/files";
import { checkAndRecordUpload, getClientIp } from "@/lib/rateLimit";
import { addImage, getImagesByStatus } from "@/lib/storage";
import type { ImageStatus, StoredImage } from "@/lib/types";
import { validateHoneypot, validateImageFile, validateUserName } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = (url.searchParams.get("status") ?? "approved") as ImageStatus;

  if (status !== "approved" && status !== "pending") {
    return NextResponse.json({ error: "Неизвестный статус." }, { status: 400 });
  }

  const token = getBearerToken(request);
  if (status === "pending" && !verifyModeToken(token, "admin")) {
    return NextResponse.json({ error: "Недостаточно прав." }, { status: 401 });
  }

  const images = await getImagesByStatus(status);
  return NextResponse.json({
    images: images.map((image) => toPublicImage(image, token ?? undefined))
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "");
  const honeypotError = validateHoneypot(formData.get("website"));
  const nameError = validateUserName(name);

  if (honeypotError || nameError) {
    return NextResponse.json(
      { error: honeypotError ?? nameError },
      { status: 400 }
    );
  }

  if (resolveMode(name) !== "user") {
    return NextResponse.json(
      { error: "Сервисный код нельзя использовать как имя для загрузки." },
      { status: 400 }
    );
  }

  const file = formData.get("image");
  const imageFile = file instanceof File ? file : null;
  const fileError = await validateImageFile(imageFile);

  if (fileError || !imageFile) {
    return NextResponse.json({ error: fileError }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rateLimitError = await checkAndRecordUpload(ip, name);

  if (rateLimitError) {
    return NextResponse.json({ error: rateLimitError }, { status: 429 });
  }

  const fileName = getSafeFileName(imageFile);
  const filePath = getUploadPath("pending", fileName);
  await saveUploadedFile(imageFile, filePath);

  const image: StoredImage = {
    id: crypto.randomUUID(),
    userName: name.trim(),
    originalName: imageFile.name,
    fileName,
    filePath,
    status: "pending",
    uploadedAt: new Date().toISOString()
  };

  await addImage(image);

  return NextResponse.json({
    message: "Изображение отправлено на модерацию"
  });
}
