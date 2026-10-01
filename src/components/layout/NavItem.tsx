"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  exact?: boolean;
  /** Prefix used for the active check when it differs from href. */
  match?: string;
  indent?: boolean;
  trailing?: string | number;
};

export function NavItem({ href, label, icon: Icon, exact, match, indent, trailing }: Props) {
  const pathname = usePathname();
  const target = match ?? href;
  const active = exact ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-9 items-center gap-2 pr-5 text-sm font-bold",
        indent ? "pl-8" : "pl-5",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:underline underline-offset-4"
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span className="truncate">{label}</span>
      {trailing !== undefined && (
        <span className="ml-auto data-mono" data-numeric>
          {trailing}
        </span>
      )}
    </Link>
  );
}
