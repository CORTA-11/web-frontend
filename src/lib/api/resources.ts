import type { ApiResponse } from "@/lib/api/client";
import { mockDelay } from "@/lib/mock/delay";
import {
  mockResourceRequests,
  mockResources,
} from "@/lib/mock/resources";
import type {
  CreateBookingRequestInput,
  CreateResourceInput,
  Resource,
  ResourceRequest,
  ResourceRequestStatus,
} from "@/lib/types/resource";

let resources = mockResources.map((r) => ({
  ...r,
  bookings: r.bookings.map((b) => ({ ...b })),
}));
let requests = mockResourceRequests.map((r) => ({ ...r }));

export const resourcesApi = {
  list: async (orgId: string): Promise<ApiResponse<Resource[]>> => {
    await mockDelay();
    return {
      success: true,
      data: resources
        .filter((r) => r.orgId === orgId)
        .map((r) => ({ ...r, bookings: r.bookings.map((b) => ({ ...b })) })),
    };
  },

  create: async (
    orgId: string,
    input: CreateResourceInput
  ): Promise<ApiResponse<Resource>> => {
    await mockDelay();
    const resource: Resource = {
      id: crypto.randomUUID(),
      orgId,
      name: input.name.trim(),
      type: input.type,
      location: input.location.trim(),
      enabled: input.enabled ?? true,
      bookings: [],
    };
    resources = [...resources, resource];
    return { success: true, data: resource };
  },

  remove: async (
    _orgId: string,
    resourceId: string
  ): Promise<ApiResponse<null>> => {
    await mockDelay(150);
    resources = resources.filter((r) => r.id !== resourceId);
    requests = requests.filter((r) => r.resourceId !== resourceId);
    return { success: true, data: null };
  },

  listRequests: async (
    _orgId: string
  ): Promise<ApiResponse<ResourceRequest[]>> => {
    await mockDelay();
    return { success: true, data: requests.map((r) => ({ ...r })) };
  },

  createRequest: async (
    _orgId: string,
    resourceId: string,
    input: CreateBookingRequestInput,
    requestedBy = "2"
  ): Promise<ApiResponse<ResourceRequest>> => {
    await mockDelay();
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource || !resource.enabled) {
      return { success: false, error: "Resource unavailable." };
    }
    const req: ResourceRequest = {
      id: crypto.randomUUID(),
      resourceId,
      teamPublicId: input.teamPublicId,
      requestedBy,
      startTime: input.startTime,
      endTime: input.endTime,
      purpose: input.purpose.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    requests = [...requests, req];
    return { success: true, data: req };
  },

  reviewRequest: async (
    _orgId: string,
    requestId: string,
    status: Extract<ResourceRequestStatus, "approved" | "rejected">
  ): Promise<ApiResponse<ResourceRequest>> => {
    await mockDelay();
    const existing = requests.find((r) => r.id === requestId);
    if (!existing) {
      return { success: false, error: "Request not found." };
    }
    const next = { ...existing, status };
    requests = requests.map((r) => (r.id === requestId ? next : r));

    if (status === "approved") {
      const booking = {
        id: crypto.randomUUID(),
        resourceId: next.resourceId,
        userId: next.requestedBy,
        teamPublicId: next.teamPublicId,
        startTime: next.startTime,
        endTime: next.endTime,
        purpose: next.purpose,
      };
      resources = resources.map((r) =>
        r.id === next.resourceId
          ? { ...r, bookings: [...r.bookings, booking] }
          : r
      );
    }

    return { success: true, data: next };
  },
};
