export async function browserFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(navigator.hardwareConcurrency ?? ""),
    String(navigator.maxTouchPoints ?? ""),
  ];
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "16px Arial";
      ctx.fillStyle = "#1a1a1a";
      ctx.fillText("ink-my-canvas", 2, 2);
      parts.push(canvas.toDataURL());
    }
  } catch {
    parts.push("no-canvas");
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(parts.join("|")),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
