import path from "node:path";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/env";
import { hasValidImageSignature } from "@/lib/files";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export function validateUserName(name: string) {
  const cleanName = name.trim();

  if (!cleanName) {
    return "Введите имя.";
  }

  if (cleanName.length > 80) {
    return "Имя слишком длинное. Используйте до 80 символов.";
  }

  return null;
}

export async function validateImageFile(file: File | null) {
  if (!file || file.size === 0) {
    return "Выберите изображение.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return `Файл слишком большой. Максимум ${MAX_UPLOAD_MB} МБ.`;
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    return "Разрешены только jpg, jpeg, png, webp и gif.";
  }

  if (!allowedMimeTypes.has(file.type)) {
    return "Файл должен быть изображением.";
  }

  const sample = Buffer.from(await file.slice(0, 16).arrayBuffer());
  if (!hasValidImageSignature(sample, file.type)) {
    return "Файл не похож на настоящее изображение.";
  }

  return null;
}

export function validateHoneypot(value: FormDataEntryValue | null) {
  return value ? "Загрузка отклонена защитой от спама." : null;
}
