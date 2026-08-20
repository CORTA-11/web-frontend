"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { resourcesApi, type RequestDraft, type ResourceDraft } from "@/features/resources/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";

export const useResources = (orgId: string) =>
  useQuery({ queryKey: qk.resources(orgId), queryFn: () => resourcesApi.list(orgId) });

export const useBookings = (orgId: string) =>
  useQuery({ queryKey: qk.bookings(orgId), queryFn: () => resourcesApi.bookings(orgId) });

export const useResourceRequests = (orgId: string) =>
  useQuery({ queryKey: qk.requests(orgId), queryFn: () => resourcesApi.requests(orgId) });

function useResourceMutation<TArgs>(
  orgId: string,
  mutationFn: (args: TArgs) => Promise<unknown>,
  message: string
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.resources(orgId) });
      client.invalidateQueries({ queryKey: qk.bookings(orgId) });
      client.invalidateQueries({ queryKey: qk.requests(orgId) });
      toast.success(message);
    },
    onError: notifyError,
  });
}

export const useCreateResource = (orgId: string) =>
  useResourceMutation(orgId, (body: ResourceDraft) => resourcesApi.create(orgId, body), "Resource added");

export const useUpdateResource = (orgId: string) =>
  useResourceMutation(
    orgId,
    ({ id, body }: { id: string; body: Partial<ResourceDraft> }) => resourcesApi.update(orgId, id, body),
    "Resource updated"
  );

export const useDeleteResource = (orgId: string) =>
  useResourceMutation(orgId, (id: string) => resourcesApi.remove(orgId, id), "Resource removed");

export const useRequestResource = (orgId: string) =>
  useResourceMutation(
    orgId,
    ({ resourceId, body }: { resourceId: string; body: RequestDraft }) =>
      resourcesApi.request(orgId, resourceId, body),
    "Request submitted for approval"
  );

export const useDecideRequest = (orgId: string) =>
  useResourceMutation(
    orgId,
    ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      resourcesApi.decide(orgId, id, status),
    "Request updated"
  );
