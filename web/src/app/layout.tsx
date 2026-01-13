import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ink My Canvas | Help Me Ruin My Body (Artistically)",
  description:
    "Before I’m 30, I need to get a tattoo. I can’t decide what it should be, so I’m crowdsourcing anonymous design submissions, picking my top three, and (probably) putting it to a public vote.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Londrina+Solid:wght@400;900&family=Patrick+Hand&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="paper-bg min-h-dvh antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
