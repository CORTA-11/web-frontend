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
        "flex h-7 items-center gap-2 border-l-2 border-transparent pr-2 text-sm transition-colors",
        indent ? "pl-6" : "pl-2.5",
        active
          ? "border-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" />}
      <span className="truncate">{label}</span>
      {trailing !== undefined && (
        <span className="ml-auto data-mono text-muted-foreground" data-numeric>
          {trailing}
        </span>
      )}
    </Link>
  );
}
