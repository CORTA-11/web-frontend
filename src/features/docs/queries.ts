"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { docsApi } from "@/features/docs/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";

export const useDocs = (orgId: string, teamId: string) =>
  useQuery({ queryKey: qk.docs(teamId), queryFn: () => docsApi.list(orgId, teamId) });

export const useDoc = (orgId: string, teamId: string, docId: string) =>
  useQuery({
    queryKey: qk.doc(teamId, docId),
    queryFn: () => docsApi.get(orgId, teamId, docId),
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
