"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/" },
    { name: "Sample Page", href: "/sample" },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/50 p-6 flex flex-col justify-between dark:border-zinc-800 dark:bg-zinc-950/50">
      <div>
        <div className="flex items-center space-x-2 mb-8">
          <div className="h-6 w-6 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
            <span className="text-xs font-bold text-white dark:text-black">C</span>
          </div>
          <span className="font-bold text-zinc-900 dark:text-white">CORTA</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-50"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="text-xs text-zinc-400 dark:text-zinc-600">
        v0.1.0 • Built with Antigravity
      </div>
    </aside>
  );
}
