const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidClassId(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  return UUID_REGEX.test(value.trim());
}

export function isValidBookingDate(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const date = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsed >= today;
}

export function sanitizeFullName(value: string) {
  return value
    .trim()
    .replace(/[<>]/g, "")
    .replace(/<script|script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string) {
  return /^[0-9+()\-\s]{7,20}$/.test(value.trim());
}

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

export async function enforceRateLimit(
  request: Request,
  userId: string,
  options: { limit?: number; windowMs?: number } = {},
) {
  const limit = options.limit ?? 10;
  const windowMs = options.windowMs ?? 60_000;

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwardedFor.split(",")[0]?.trim() ?? "unknown";
  const key = `${ip}:${userId}`;
  const now = Date.now();

  const existing = rateLimitMap.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterMs: windowMs - (now - existing.windowStart) };
  }

  existing.count += 1;
  rateLimitMap.set(key, existing);
  return { allowed: true };
}
