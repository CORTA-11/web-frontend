import type { Doc } from "@/lib/types/document";
import { MOCK_TEAM_PUBLIC_ID } from "@/lib/mock/users";

export const mockDocs: Doc[] = [
  {
    id: "doc-1",
    teamPublicId: MOCK_TEAM_PUBLIC_ID,
    title: "Lab Alpha — weekly notes",
    content:
      "# Weekly notes\n\n- Calibrated A100 cluster\n- Drafted methodology section\n",
    updatedAt: "2026-08-09T16:00:00.000Z",
    updatedBy: "2",
  },
  {
    id: "doc-2",
    teamPublicId: MOCK_TEAM_PUBLIC_ID,
    title: "Meeting minutes — Aug 5",
    content:
      "# Meeting minutes\n\nAttendees: Leader, Member\n\nAction: review encryption benchmarks.\n",
    updatedAt: "2026-08-05T12:30:00.000Z",
    updatedBy: "3",
  },
];
