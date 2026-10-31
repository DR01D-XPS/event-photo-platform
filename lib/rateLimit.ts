import { promises as fs } from "node:fs";
import { UPLOAD_DELAY_SECONDS, UPLOAD_HOURLY_LIMIT } from "@/lib/env";
import { dataDir, rateLimitPath } from "@/lib/paths";

type RateState = Record<
  string,
  {
    attempts: number[];
  }
>;

async function readRateState(): Promise<RateState> {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    const raw = await fs.readFile(rateLimitPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeRateState(state: RateState) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(rateLimitPath, JSON.stringify(state, null, 2), "utf8");
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "local";
  }

  return request.headers.get("x-real-ip") || "local";
}

export async function checkAndRecordUpload(ip: string, userName: string) {
  const key = `${ip}:${userName.trim().toLowerCase()}`;
  const state = await readRateState();
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const attempts = (state[key]?.attempts ?? []).filter((time) => time > hourAgo);
  const lastAttempt = attempts.at(-1);

  if (lastAttempt && now - lastAttempt < UPLOAD_DELAY_SECONDS * 1000) {
    const waitSeconds = Math.ceil(
      (UPLOAD_DELAY_SECONDS * 1000 - (now - lastAttempt)) / 1000
    );
    return `Подождите ${waitSeconds} сек. перед следующей загрузкой.`;
  }

  if (attempts.length >= UPLOAD_HOURLY_LIMIT) {
    return "Слишком много загрузок за час. Попробуйте позже.";
  }

  attempts.push(now);
  state[key] = { attempts };
  await writeRateState(state);

  return null;
}
