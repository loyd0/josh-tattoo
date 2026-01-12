import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { validateTurnstileToken } from "next-turnstile";
import { v4 as uuidv4 } from "uuid";

import { enforceRateLimit } from "@/lib/rateLimit";
import { getClientIpFromHeaders, hashIp } from "@/lib/ip";
import { AllowedContentTypes, MAX_UPLOAD_BYTES } from "@/lib/validation";

export const runtime = "nodejs";

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  const ip = getClientIpFromHeaders(request.headers);
  const ipHash = ip ? hashIp(ip, process.env.IP_HASH_SALT) : "unknown";

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
      let turnstileToken: string | undefined;
      if (clientPayload) {
        try {
          const parsed = JSON.parse(clientPayload) as { turnstileToken?: string };
          turnstileToken = parsed.turnstileToken;
        } catch {
          // ignore
        }
      }

      if (!turnstileToken) {
        throw new Error("Missing Turnstile token");
      }

      // Validate Turnstile token with idempotency key to prevent reuse
      const validationResponse = await validateTurnstileToken({
        token: turnstileToken,
        secretKey: process.env.TURNSTILE_SECRET_KEY!,
        idempotencyKey: uuidv4(), // Prevents token reuse
      });

      if (!validationResponse.success) {
        const errorCodes = validationResponse.error_codes?.join(", ") || "unknown";
        throw new Error(`Turnstile validation failed: ${errorCodes}`);
      }

      const windowSeconds = Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? "600");
      const max = Number(process.env.RATE_LIMIT_MAX_TOKENS ?? "10");
      const rl = await enforceRateLimit({
        scope: "blob_token",
        ipHash,
        windowSeconds,
        max,
      });
      if (!rl.ok) {
        const err = new Error("Rate limit exceeded");
        // @ts-expect-error annotate for route error mapping below
        err.status = 429;
        // @ts-expect-error annotate for route error mapping below
        err.retryAfterSeconds = rl.retryAfterSeconds;
        throw err;
      }

      return {
        allowedContentTypes: [...AllowedContentTypes],
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
      };
      },
      onUploadCompleted: async () => {
        // We finalize the submission separately in /api/submissions.
      },
    });

    return Response.json(jsonResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload error";
    const status = typeof (e as any)?.status === "number" ? (e as any).status : 400;
    const headers: Record<string, string> = {};
    if (status === 429 && typeof (e as any)?.retryAfterSeconds === "number") {
      headers["Retry-After"] = String((e as any).retryAfterSeconds);
    }
    return Response.json({ error: message }, { status, headers });
  }
}

