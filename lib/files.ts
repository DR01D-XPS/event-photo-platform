import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { approvedDir, pendingDir } from "@/lib/paths";
import type { ImageStatus, PublicImage, StoredImage } from "@/lib/types";

const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

export function getSafeFileName(file: File) {
  const extension =
    extensionByMime[file.type] || path.extname(file.name).toLowerCase();
  return `${crypto.randomUUID()}${extension}`;
}

export function getUploadPath(status: ImageStatus, fileName: string) {
  return path.join(status === "pending" ? pendingDir : approvedDir, fileName);
}

export function toPublicImage(image: StoredImage, token?: string): PublicImage {
  const query =
    image.status === "pending" && token
      ? `?token=${encodeURIComponent(token)}`
      : "";

  return {
    id: image.id,
    userName: image.userName,
    originalName: image.originalName,
    url: `/api/uploads/${image.status}/${encodeURIComponent(image.fileName)}${query}`,
    status: image.status,
    uploadedAt: image.uploadedAt
  };
}

export async function saveUploadedFile(file: File, filePath: string) {
  const bytes = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));
}

export function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8;
  }

  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }

  if (mimeType === "image/gif") {
    const header = buffer.subarray(0, 6).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  }

  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}
