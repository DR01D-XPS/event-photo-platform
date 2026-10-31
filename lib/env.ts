function requiredSecret(name: string): string {
  const value = process.env[name]?.trim();
  const minimum = name === "ADMIN_ACTION_SECRET" ? 32 : 16;
  if (!value || value.length < minimum) {
    throw new Error(`${name} must be set to a unique value of at least ${minimum} characters.`);
  }
  return value;
}

export const ADMIN_CODE = requiredSecret("ADMIN_CODE");
export const SHOWROOM_CODE = requiredSecret("SHOWROOM_CODE");
export const ADMIN_ACTION_SECRET = requiredSecret("ADMIN_ACTION_SECRET");
if (new Set([ADMIN_CODE, SHOWROOM_CODE, ADMIN_ACTION_SECRET]).size !== 3) {
  throw new Error("Access codes and the signing secret must be different values.");
}

export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? "10");
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const UPLOAD_DELAY_SECONDS = Number(
  process.env.UPLOAD_DELAY_SECONDS ?? "30"
);
export const UPLOAD_HOURLY_LIMIT = Number(process.env.UPLOAD_HOURLY_LIMIT ?? "8");
