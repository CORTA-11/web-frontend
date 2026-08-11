import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-zinc-200 bg-white/95 px-6 backdrop-blur dark:border-zinc-800 dark:bg-slate-900/95 md:left-60 md:right-0">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="search"
          placeholder="Search…"
          className="pl-8"
          aria-label="Search"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell />
        </Button>

        <ProfileMenu />
      </div>
    </header>
  );
}
