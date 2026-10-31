import path from "node:path";

export const projectRoot = process.cwd();
export const dataDir = path.join(projectRoot, "data");
export const uploadsDir = path.join(projectRoot, "uploads");
export const pendingDir = path.join(uploadsDir, "pending");
export const approvedDir = path.join(uploadsDir, "approved");
export const imageDbPath = path.join(dataDir, "images.json");
export const rateLimitPath = path.join(dataDir, "rate-limit.json");
