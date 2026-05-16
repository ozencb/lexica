import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const sidecarUrl = process.env.TTS_SIDECAR_URL || "http://localhost:8000";

  const response = await fetch(`${sidecarUrl}/api/tts/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    return Response.json(
      { error: `TTS sidecar error: ${error}` },
      { status: response.status }
    );
  }

  const audioBuffer = await response.arrayBuffer();
  return new Response(audioBuffer, {
    headers: { "Content-Type": "audio/wav" },
  });
}
