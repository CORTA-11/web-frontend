import { Fragment, type ReactNode } from "react";
import type { TeamMember } from "@/lib/types";

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Highlights the names a message actually addressed — SRS 3.1.4.3. */
export function renderMessage(text: string, members: TeamMember[], mentions: number[] = []): ReactNode {
  const named = members.filter((member) => mentions.includes(member.user_id));
  if (!named.length) return text;

  const pattern = new RegExp(
    `@(${named.map((member) => escape(member.name)).sort((a, b) => b.length - a.length).join("|")})`,
    "g"
  );

  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="rounded-sm bg-accent px-1 font-medium text-accent-foreground">
        @{part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
}
