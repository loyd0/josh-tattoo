export const runtime = "nodejs";

export async function GET() {
  // Best-effort Basic Auth "logout" fallback.
  // Note: middleware also handles /api/admin/logout (Edge) by rotating the realm cookie.
  const newRealmId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Response("Signed out", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="Admin-${newRealmId}"`,
      "Set-Cookie": `admin_realm=${encodeURIComponent(newRealmId)}; Path=/; HttpOnly; SameSite=Lax`,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}

