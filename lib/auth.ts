import crypto from "node:crypto";
import { ADMIN_ACTION_SECRET, ADMIN_CODE, SHOWROOM_CODE } from "@/lib/env";

export type AppMode = "user" | "admin" | "slideshow";

const tokenTtlMs = 12 * 60 * 60 * 1000;

function sign(payload: string) {
  return crypto
    .createHmac("sha256", ADMIN_ACTION_SECRET)
    .update(payload)
    .digest("hex");
}

export function resolveMode(input: string): AppMode {
  const value = input.trim();

  if (value === ADMIN_CODE) {
    return "admin";
  }

  if (value === SHOWROOM_CODE) {
    return "slideshow";
  }

  return "user";
}

export function createModeToken(mode: Exclude<AppMode, "user">) {
  const expiresAt = Date.now() + tokenTtlMs;
  const payload = `${mode}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyModeToken(
  token: string | null | undefined,
  expectedMode: Exclude<AppMode, "user">
) {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [mode, expiresAtRaw, signature] = parts;
  if (mode !== expectedMode) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const payload = `${mode}.${expiresAtRaw}`;
  const expected = sign(payload);

  if (signature.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }

  return request.headers.get("x-admin-token");
}
