"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: Record<string, unknown>,
      ) => string | number;
      remove: (widgetId: string | number) => void;
    };
  }
}

export function TurnstileWidget(props: {
  siteKey?: string;
  onToken: (token: string) => void;
  theme?: "light" | "dark" | "auto";
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (!props.siteKey) return;

    const scriptId = "turnstile-script";
    if (!document.getElementById(scriptId)) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    let cancelled = false;
    let interval: number | undefined;

    const tryRender = () => {
      if (cancelled) return;
      if (!containerRef.current) return;
      if (!window.turnstile?.render) return;

      // Reset token on re-render/expiry.
      props.onToken("");

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: props.siteKey,
        theme: props.theme ?? "auto",
        callback: (token: unknown) => {
          if (typeof token === "string") props.onToken(token);
        },
        "expired-callback": () => props.onToken(""),
        "error-callback": () => props.onToken(""),
      });
    };

    interval = window.setInterval(() => {
      if (window.turnstile?.render) {
        window.clearInterval(interval);
        tryRender();
      }
    }, 50);

    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
      if (widgetIdRef.current != null && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.siteKey, props.theme]);

  if (!props.siteKey) {
    return (
      <div className="rounded-xl border border-amber-400/40 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-300/30 dark:bg-amber-950/30 dark:text-amber-100">
        Turnstile is not configured. Set{" "}
        <code className="font-mono">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>.
      </div>
    );
  }

  return <div ref={containerRef} />;
}

