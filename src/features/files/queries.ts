"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { filesApi } from "@/features/files/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";
import type { StoredFile } from "@/lib/types";

export const useFiles = (teamId: string, orgId: string) =>
  useQuery({ queryKey: qk.files(teamId), queryFn: () => filesApi.list(teamId, orgId) });

export function useUploadFiles(teamId: string, orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => Promise.all(files.map((file) => filesApi.upload(teamId, orgId, file))),
    onSuccess: (uploaded) => {
      client.invalidateQueries({ queryKey: qk.files(teamId) });
      toast.success(`${uploaded.length} file${uploaded.length === 1 ? "" : "s"} uploaded`);
    },
    onError: notifyError,
  });
}

export function useDeleteFile(teamId: string, orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => filesApi.remove(teamId, orgId, fileId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.files(teamId) });
      toast.success("File deleted");
    },
    onError: notifyError,
  });
}

export function useDownloadFile(teamId: string, orgId: string) {
  return useMutation({
    mutationFn: (file: StoredFile) => filesApi.download(teamId, orgId, file),
    onError: notifyError,
  });
}
