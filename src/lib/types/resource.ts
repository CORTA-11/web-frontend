export type ResourceType = "gpu" | "sensor" | "room" | "workstation";

export type ResourceBooking = {
  id: string;
  resourceId: string;
  userId: string;
  teamPublicId?: string;
  startTime: string;
  endTime: string;
  purpose: string;
};

export type Resource = {
  id: string;
  orgId: string;
  name: string;
  type: ResourceType;
  location: string;
  enabled: boolean;
  bookings: ResourceBooking[];
};

export type ResourceRequestStatus = "pending" | "approved" | "rejected";

export type ResourceRequest = {
  id: string;
  resourceId: string;
  teamPublicId: string;
  requestedBy: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: ResourceRequestStatus;
  createdAt: string;
};

export type CreateResourceInput = {
  name: string;
  type: ResourceType;
  location: string;
  enabled?: boolean;
};

export type CreateBookingRequestInput = {
  teamPublicId: string;
  startTime: string;
  endTime: string;
  purpose: string;
};
