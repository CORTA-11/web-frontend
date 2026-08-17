import type { Metadata } from "next";

import "./globals.css";




export const metadata: Metadata = {
  title: "CORTA",
  description: "Privacy-preserving collaborative research platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en">
      <body className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
