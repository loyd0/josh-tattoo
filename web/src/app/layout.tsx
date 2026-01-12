import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ink My Canvas | Help Me Ruin My Body (Artistically)",
  description:
    "Submit your best, weirdest, or coolest tattoo ideas. Sketch it on a napkin, find a Pinterest pic, or design a masterpiece. You submit, I might commit.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
