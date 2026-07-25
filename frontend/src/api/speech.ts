import { ApiError, apiBase } from "@/api/http";
import { getClientId } from "@/utils/clientId";

export async function synthesizeSpeech(
  text: string,
  companionId: string,
): Promise<Blob> {
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Client-Id": getClientId(),
  });
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/v1/speech/tts`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text, companion_id: companionId || "nuan" }),
    });
  } catch {
    throw new ApiError("network", "连不上服务器，请确认后端已启动");
  }
  if (!res.ok) {
    let code = "request_error";
    let message = "现在读不了，稍后再试";
    try {
      const body = await res.json();
      if (body?.error?.code) code = body.error.code;
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(code, message);
  }
  const blob = await res.blob();
  if (!blob.size) {
    throw new ApiError("speech_upstream", "现在读不了，稍后再试");
  }
  return blob;
}

export async function transcribeSpeech(blob: Blob, filename = "talk.webm"): Promise<string> {
  const headers = new Headers({
    "X-Client-Id": getClientId(),
  });
  const form = new FormData();
  form.append("file", blob, filename);
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/v1/speech/asr`, {
      method: "POST",
      headers,
      body: form,
    });
  } catch {
    throw new ApiError("network", "连不上服务器，请确认后端已启动");
  }
  if (!res.ok) {
    let code = "request_error";
    let message = "没听清，再试一次或打字吧";
    try {
      const body = await res.json();
      if (body?.error?.code) code = body.error.code;
      if (body?.error?.message) message = body.error.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(code, message);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text || "").trim();
}
