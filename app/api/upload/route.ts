import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Uploads not yet configured. Create a Blob store in the Vercel dashboard (Storage → Blob) and the token will auto-wire.",
      },
      { status: 503 },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ source: "lead-form" }),
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log("[blob:uploaded]", blob.url, blob.pathname);
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
