import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  uid: string;
  exp: number;
};

function getAdminSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "fallback-admin-session-secret"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getAdminSessionSecret()).update(payload).digest("hex");
}

function encodePayload(payload: AdminSessionPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): AdminSessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<AdminSessionPayload>;
    if (!parsed || typeof parsed.uid !== "string" || typeof parsed.exp !== "number") return null;
    return { uid: parsed.uid, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function createAdminSessionToken(userId: string, nowMs = Date.now()) {
  const payload: AdminSessionPayload = {
    uid: userId,
    exp: nowMs + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
  };
  const payloadBase64 = encodePayload(payload);
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function isAdminSessionValue(value: string | undefined) {
  if (!value) return false;
  const [payloadBase64, signature] = value.split(".");
  if (!payloadBase64 || !signature) return false;
  const expected = signPayload(payloadBase64);
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return false;
  const payload = decodePayload(payloadBase64);
  if (!payload) return false;
  return payload.exp > Date.now();
}

export async function getAdminSessionCookieValue() {
  const store = await cookies();
  return store.get(ADMIN_SESSION_COOKIE)?.value;
}

export async function hasAdminCookieSession() {
  return isAdminSessionValue(await getAdminSessionCookieValue());
}

export function getAdminSessionMaxAgeSeconds() {
  return ADMIN_SESSION_MAX_AGE_SECONDS;
}
