import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const sessionCookieOptions = {
  path: "/",
  maxAge: SESSION_MAX_AGE,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET, NEXTAUTH_SECRET ou SESSION_SECRET doit etre defini en production.");
  }

  return "gaston-dev-session-secret-change-me";
}

function signSession(userId: string, role: Role | string) {
  return createHmac("sha256", getSessionSecret())
    .update(`${userId}.${String(role)}`)
    .digest("hex");
}

function safeEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function setSessionCookies(user: { id: string; role: Role | string }) {
  const store = await cookies();
  const role = String(user.role);

  store.set("userId", user.id, sessionCookieOptions);
  store.set("userRole", role, sessionCookieOptions);
  store.set("sessionSig", signSession(user.id, role), sessionCookieOptions);
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete("userId");
  store.delete("userRole");
  store.delete("sessionSig");
}

export async function getCurrentUser() {
  const store = await cookies();
  const userId = store.get("userId")?.value;
  const sessionSig = store.get("sessionSig")?.value;

  if (!userId || !sessionSig) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, avatar: true },
  });

  if (!user) return null;

  const expected = signSession(user.id, user.role);
  if (!safeEquals(sessionSig, expected)) return null;

  return user;
}

export async function requireAuth(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) return null;

  if (roles && !roles.includes(user.role)) return null;
  return user;
}

export async function requireRole(...roles: Role[]) {
  return requireAuth(roles);
}

export function unauthorized(message = "Non autorise.") {
  return Response.json({ success: false, error: message }, { status: 401 });
}
