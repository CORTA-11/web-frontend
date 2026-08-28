import Link from "next/link";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

export function Header() {
  return <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-white/95 px-6 backdrop-blur dark:bg-slate-900/95 md:left-60">
    <Link href="/orgs" className="text-sm text-zinc-500 hover:text-zinc-900">Switch organization</Link>
    <ProfileMenu />
  </header>;
}
