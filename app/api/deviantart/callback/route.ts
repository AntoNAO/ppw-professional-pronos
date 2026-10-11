
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error: "DeviantArt authorization was declined." },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing OAuth authorization code." },
      { status: 400 }
    );
  }

  // The authorization code will be exchanged for a token
  // in a later step. Do not expose client secrets here.
  return NextResponse.json({
    message: "DeviantArt callback reached successfully.",
    receivedCode: true,
  });
}
