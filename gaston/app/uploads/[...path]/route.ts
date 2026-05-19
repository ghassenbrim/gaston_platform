import { readFile, stat } from "fs/promises";
import { join, relative, sep } from "path";
import { NextRequest, NextResponse } from "next/server";
import { resolveUploadPath } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  pdf: "application/pdf",
};

function isImageExtension(ext: string) {
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
}

function resolvePublicUploadPath(pathSegments: string[]) {
  const publicUploadRoot = join(process.cwd(), "public", "uploads");
  const target = join(publicUploadRoot, ...pathSegments);
  const rel = relative(publicUploadRoot, target);

  if (rel.startsWith("..") || rel.split(sep).includes("..")) {
    return null;
  }

  return target;
}

async function getExistingFilePath(pathSegments: string[]) {
  const candidates = [
    resolveUploadPath(pathSegments),
    resolvePublicUploadPath(pathSegments),
  ].filter(Boolean) as string[];

  for (const filePath of candidates) {
    try {
      const fileStat = await stat(filePath);
      if (fileStat.isFile()) return filePath;
    } catch {
      // Try the next storage location.
    }
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const filePath = await getExistingFilePath(path);
  const ext = path.at(-1)?.split(".").pop()?.toLowerCase() ?? "";

  if (!filePath) {
    if (isImageExtension(ext)) {
      return new NextResponse(new Uint8Array(transparentPng), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    return new NextResponse("Upload not found.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const body = await readFile(filePath);

    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentTypes[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Upload not found.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
