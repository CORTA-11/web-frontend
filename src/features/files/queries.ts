"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { filesApi } from "@/features/files/api";
import { useSession } from "@/features/auth/session";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";
import type { StoredFile } from "@/lib/types";

export const useFiles = (teamId: string, orgId: string) =>
  useQuery({ queryKey: qk.files(teamId), queryFn: () => filesApi.list(teamId, orgId) });

export function useUploadFiles(teamId: string, orgId: string) {
  const client = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: (files: File[]) => {
      if (!user) throw new Error("Unauthenticated");
      return Promise.all(files.map((file) => filesApi.upload(teamId, orgId, file, user)));
    },
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
  const { user } = useSession();
  return useMutation({
    mutationFn: (file: StoredFile) => {
      if (!user) throw new Error("Unauthenticated");
      return filesApi.download(teamId, orgId, file, user);
    },
    onError: notifyError,
  });
}
