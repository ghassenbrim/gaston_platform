import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

export function isPasswordHashed(password: string | null | undefined) {
  return typeof password === "string" && password.startsWith(`${HASH_PREFIX}$`);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${HASH_PREFIX}$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, storedPassword: string | null | undefined) {
  if (!storedPassword) return false;

  if (!isPasswordHashed(storedPassword)) {
    return storedPassword === password;
  }

  const [, salt, storedKey] = storedPassword.split("$");
  if (!salt || !storedKey) return false;

  const key = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const stored = Buffer.from(storedKey, "hex");
  if (stored.length !== key.length) return false;

  return timingSafeEqual(stored, key);
}
