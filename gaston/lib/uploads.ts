import { mkdir } from "fs/promises";
import { join, relative, sep } from "path";

const uploadRoot =
  process.env.UPLOAD_DIR ||
  process.env.RAILWAY_UPLOAD_DIR ||
  join(process.cwd(), "public", "uploads");

export function getUploadRoot() {
  return uploadRoot;
}

export function getUploadDir(...segments: string[]) {
  return join(uploadRoot, ...segments);
}

export async function ensureUploadDir(...segments: string[]) {
  const dir = getUploadDir(...segments);
  await mkdir(dir, { recursive: true });
  return dir;
}

export function getUploadUrl(filename: string, ...segments: string[]) {
  return `/uploads/${[...segments, filename].join("/")}`;
}

export function resolveUploadPath(pathSegments: string[]) {
  const target = join(uploadRoot, ...pathSegments);
  const rel = relative(uploadRoot, target);

  if (rel.startsWith("..") || rel.split(sep).includes("..")) {
    return null;
  }

  return target;
}
