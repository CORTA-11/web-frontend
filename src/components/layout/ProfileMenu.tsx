"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", onPointerDown);
    }
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await logout();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        <Avatar size="sm">
          <AvatarFallback>{initials(user.display_name) || "U"}</AvatarFallback>
        </Avatar>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-2 py-2 dark:border-zinc-800">
            <p className="truncate text-sm font-medium">{user.display_name}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
