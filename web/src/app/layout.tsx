/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ink My Canvas | Help Me Ruin My Body (Artistically)",
  description:
    "Three designs. One very permanent decision. Vote for your favourite tattoo for Josh and confirm your choice by email.",
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
