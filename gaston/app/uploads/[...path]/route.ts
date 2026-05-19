import { readFile, stat } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { resolveUploadPath } from "@/lib/uploads";

export const dynamic = "force-dynamic";

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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const filePath = resolveUploadPath(path);

  if (!filePath) {
    return NextResponse.json({ error: "Invalid upload path." }, { status: 400 });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Upload not found." }, { status: 404 });
    }

    const body = await readFile(filePath);
    const ext = path.at(-1)?.split(".").pop()?.toLowerCase() ?? "";

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentTypes[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }
}
