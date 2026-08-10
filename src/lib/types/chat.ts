export type ChatSender = {
  id: number;
  name: string;
  avatarUrl?: string;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  sender: ChatSender;
  replyToId?: string;
  message: string;
  createdAt: string;
  deletedAt?: string;
};
