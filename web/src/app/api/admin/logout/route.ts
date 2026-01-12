export const runtime = "nodejs";

export async function GET() {
  // Best-effort Basic Auth "logout":
  // return 401 with a different realm so the browser drops cached credentials.
  return new Response("Signed out", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin-Logout"',
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}

