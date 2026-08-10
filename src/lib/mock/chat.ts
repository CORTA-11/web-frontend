import { MOCK_TEAM_PUBLIC_ID } from "@/lib/mock/users";
import type { ChatMessage } from "@/lib/types/chat";

const CHANNEL = `channel-${MOCK_TEAM_PUBLIC_ID}`;

export let mockMessages: ChatMessage[] = [
  {
    id: "msg-1",
    channelId: CHANNEL,
    sender: { id: 2, name: "Leader Lab", avatarUrl: "" },
    message: "Welcome to Lab Alpha chat — kickoff notes are in Docs.",
    createdAt: "2026-08-08T09:00:00.000Z",
  },
  {
    id: "msg-2",
    channelId: CHANNEL,
    sender: { id: 3, name: "Member Lab", avatarUrl: "" },
    replyToId: "msg-1",
    message: "Thanks — I'll review the encryption benchmarks today.",
    createdAt: "2026-08-08T09:12:00.000Z",
  },
  {
    id: "msg-3",
    channelId: CHANNEL,
    sender: { id: 2, name: "Leader Lab", avatarUrl: "" },
    message: "Book the A100 for Tuesday if you need a training run.",
    createdAt: "2026-08-09T14:20:00.000Z",
  },
];

export function channelIdFor(teamPublicId: string): string {
  return `channel-${teamPublicId}`;
}
