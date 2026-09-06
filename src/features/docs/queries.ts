"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { docsApi } from "@/features/docs/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";

export const useDocs = (orgId: string, teamId: string) =>
  useQuery({ queryKey: qk.docs(teamId), queryFn: () => docsApi.list(orgId, teamId) });

/** Polled so other people's saves show up without a manual refresh. */
export const useDoc = (orgId: string, teamId: string, docId: string) =>
  useQuery({
    queryKey: qk.doc(teamId, docId),
    queryFn: () => docsApi.get(orgId, teamId, docId),
    refetchInterval: 20_000,
    staleTime: 0,
  });

export function useCreateDoc(orgId: string, teamId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => docsApi.create(orgId, teamId, title),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.docs(teamId) }),
    onError: notifyError,
  });
}

/** Autosave: the list needs refreshing, the open document does not. */
export function useSaveDoc(orgId: string, teamId: string, docId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { title?: string; content?: string }) => docsApi.update(orgId, teamId, docId, body),
    onSuccess: (doc) => {
      client.setQueryData(qk.doc(teamId, docId), doc);
      client.invalidateQueries({ queryKey: qk.docs(teamId) });
    },
    onError: notifyError,
  });
}

export function useDeleteDoc(orgId: string, teamId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => docsApi.remove(orgId, teamId, docId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.docs(teamId) });
      toast.success("Document deleted");
    },
    onError: notifyError,
  });
}
