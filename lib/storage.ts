import { promises as fs } from "node:fs";
import path from "node:path";
import { approvedDir, dataDir, imageDbPath, pendingDir } from "@/lib/paths";
import type { ImageStatus, StoredImage } from "@/lib/types";

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(pendingDir, { recursive: true });
  await fs.mkdir(approvedDir, { recursive: true });

  try {
    await fs.access(imageDbPath);
  } catch {
    await fs.writeFile(imageDbPath, "[]", "utf8");
  }
}

export async function readImages(): Promise<StoredImage[]> {
  await ensureStorage();
  const raw = await fs.readFile(imageDbPath, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeImages(images: StoredImage[]) {
  await ensureStorage();
  const tmpPath = `${imageDbPath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(images, null, 2), "utf8");
  await fs.rename(tmpPath, imageDbPath);
}

export async function addImage(image: StoredImage) {
  const images = await readImages();
  images.unshift(image);
  await writeImages(images);
  return image;
}

export async function getImagesByStatus(status: ImageStatus) {
  const images = await readImages();
  return images.filter((image) => image.status === status);
}

export async function moveImageToApproved(id: string) {
  const images = await readImages();
  const image = images.find((item) => item.id === id && item.status === "pending");

  if (!image) {
    return null;
  }

  const oldPath = image.filePath;
  const newPath = path.join(approvedDir, image.fileName);
  await fs.rename(oldPath, newPath);

  image.status = "approved";
  image.filePath = newPath;
  await writeImages(images);

  return image;
}

export async function deleteImage(id: string) {
  const images = await readImages();
  const image = images.find((item) => item.id === id);

  if (!image) {
    return false;
  }

  try {
    await fs.unlink(image.filePath);
  } catch {
    // The metadata is still removed if the file was already missing.
  }

  await writeImages(images.filter((item) => item.id !== id));
  return true;
}
