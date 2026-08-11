"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col md:ml-60">
          <Header />
          <main ref={mainRef} className="flex min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
