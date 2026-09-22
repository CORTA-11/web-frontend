"use client";

import { useMutation } from "@tanstack/react-query";
import { aiApi, type ChatRange } from "@/features/ai/api";
import { notifyError } from "@/lib/query";

export const useChatSummary = (orgId: string, teamId: string) =>
  useMutation({
    mutationFn: (body: Parameters<typeof aiApi.chatSummary>[2]) => aiApi.chatSummary(orgId, teamId, body),
    onError: notifyError,
  });

export const useTranscriptSummary = (teamId: string) =>
  useMutation({
    mutationFn: (body: { transcript: string; question?: string }) =>
      aiApi.transcriptSummary(teamId, body),
    onError: notifyError,
  });

export const useExtractTasks = (teamId: string) =>
  useMutation({
    mutationFn: (body: ChatRange & { transcript?: string }) => aiApi.extractTasks(teamId, body),
    onError: notifyError,
  });
