import type { Resource, ResourceRequest } from "@/lib/types/resource";
import { MOCK_ORG_ID, MOCK_TEAM_PUBLIC_ID } from "@/lib/mock/users";

export const mockResources: Resource[] = [
  {
    id: "gpu-1",
    orgId: MOCK_ORG_ID,
    name: "NVIDIA A100",
    type: "gpu",
    location: "Lab B - Rack 2",
    enabled: true,
    bookings: [
      {
        id: "bk-1",
        resourceId: "gpu-1",
        userId: "2",
        teamPublicId: MOCK_TEAM_PUBLIC_ID,
        startTime: "2026-08-12T09:00:00.000Z",
        endTime: "2026-08-12T13:00:00.000Z",
        purpose: "Model training run",
      },
    ],
  },
  {
    id: "room-1",
    orgId: MOCK_ORG_ID,
    name: "Conference Room A",
    type: "room",
    location: "Level 3",
    enabled: true,
    bookings: [],
  },
  {
    id: "sensor-1",
    orgId: MOCK_ORG_ID,
    name: "Environmental Sensor Kit",
    type: "sensor",
    location: "Lab A - Bench 4",
    enabled: false,
    bookings: [],
  },
];

export const mockResourceRequests: ResourceRequest[] = [
  {
    id: "req-1",
    resourceId: "gpu-1",
    teamPublicId: MOCK_TEAM_PUBLIC_ID,
    requestedBy: "2",
    startTime: "2026-08-18T08:00:00.000Z",
    endTime: "2026-08-18T18:00:00.000Z",
    purpose: "Fine-tune privacy model",
    status: "pending",
    createdAt: "2026-08-10T10:00:00.000Z",
  },
];
