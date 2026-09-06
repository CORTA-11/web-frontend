import { addDays, addHours, setHours, setMinutes, startOfWeek, subDays, subHours, subMinutes } from "date-fns";
import type {
  Booking, ChatMessage, Doc, Organization, OrgSettings, Resource, ResourceRequest,
  StoredFile, Task, Team, TeamMember, User,
} from "@/lib/types";

export const ORG_ID = "8f1d2a60-4c7e-4f1a-9b23-0d5e6a7c1b40";
export const ORG_PUBLIC_ID = "aratuwa";

export const TEAM_IDS = {
  imaging: "b21c7f04-3e58-4a19-8d6c-2f9a01e4c773",
  protein: "c93a5d18-7b26-4e30-91af-6c04d2b85e19",
  platform: "d47b9e21-5a13-4c88-b0e7-8391f6a2d504",
};

const at = (base: Date, hour: number, minute = 0) =>
  setMinutes(setHours(base, hour), minute).toISOString();

const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
const weekday = (offset: number) => addDays(monday, offset);

export const people: (User & { password: string })[] = [
  { id: 1, org_id: ORG_ID, name: "Nilupa Rathnayake", email: "admin@aratuwa.edu", org_role: "ORG_ADMIN", password: "synodus-demo-password" },
  { id: 2, org_id: ORG_ID, name: "Teshan Kannangara", email: "leader@aratuwa.edu", org_role: "ORG_MEMBER", password: "synodus-demo-password" },
  { id: 3, org_id: ORG_ID, name: "Sangeeth Kariyapperuma", email: "member@aratuwa.edu", org_role: "ORG_MEMBER", password: "synodus-demo-password" },
  { id: 4, org_id: ORG_ID, name: "Kamsan Suntharalingam", email: "kamsan@aratuwa.edu", org_role: "ORG_MEMBER", password: "synodus-demo-password" },
  { id: 5, org_id: ORG_ID, name: "Dilini Perera", email: "dilini@aratuwa.edu", org_role: "ORG_MEMBER", password: "synodus-demo-password" },
  { id: 6, org_id: ORG_ID, name: "Ravindu Jayasuriya", email: "ravindu@aratuwa.edu", org_role: "ORG_MEMBER", password: "synodus-demo-password" },
  { id: 7, org_id: ORG_ID, name: "Ayesha Fernando", email: "ayesha@aratuwa.edu", org_role: "ORG_MEMBER", password: "synodus-demo-password" },
  { id: 99, org_id: "", name: "Platform Operations", email: "platform@corta.dev", org_role: "ORG_MEMBER", platform_role: "SUPER_ADMIN", password: "synodus-demo-password" },
];

/**
 * Tenants as the deployment operator sees them: who asked, how big, what state.
 * Deliberately no window into what any of them are working on.
 */
export const organizations: Organization[] = [
  { id: ORG_ID, name: "Aratuwa Research Lab", public_id: ORG_PUBLIC_ID, status: "active", owner_name: "Nilupa Rathnayake", owner_email: "admin@aratuwa.edu", user_count: 7, team_count: 3, requested_at: subDays(new Date(), 140).toISOString(), decided_at: subDays(new Date(), 139).toISOString() },
  { id: "3c8e1b52-90a4-4d77-b16e-51ff0a2c9d38", name: "Kelaniya Materials Lab", public_id: "kelaniya-mat", status: "pending", owner_name: "Priyanka Wijesinghe", owner_email: "p.wijesinghe@kln.ac.lk", user_count: 1, team_count: 0, requested_at: subHours(new Date(), 9).toISOString() },
  { id: "6a2f4d19-7c05-4b83-a94d-2e1b8f70c645", name: "Ruhuna Marine Station", public_id: "ruhuna-marine", status: "active", owner_name: "Chathura Amarasekara", owner_email: "chathura@ruh.ac.lk", user_count: 12, team_count: 4, requested_at: subDays(new Date(), 62).toISOString(), decided_at: subDays(new Date(), 61).toISOString() },
  { id: "b7d3e806-2f41-49ca-8d5b-0c96a13e7f22", name: "Peradeniya Agri Genomics", public_id: "pdn-agri", status: "suspended", owner_name: "Malsha Ekanayake", owner_email: "malsha@pdn.ac.lk", user_count: 5, team_count: 2, requested_at: subDays(new Date(), 210).toISOString(), decided_at: subDays(new Date(), 12).toISOString() },
];

export const teams: Team[] = [
  { id: 1, public_id: TEAM_IDS.imaging, org_id: ORG_ID, name: "Neural Imaging", description: "Two-photon acquisition and segmentation pipeline.", member_count: 4, created_at: subDays(new Date(), 96).toISOString() },
  { id: 2, public_id: TEAM_IDS.protein, org_id: ORG_ID, name: "Protein Dynamics", description: "Cryo-EM sample prep and MD simulation runs.", member_count: 3, created_at: subDays(new Date(), 71).toISOString() },
  { id: 3, public_id: TEAM_IDS.platform, org_id: ORG_ID, name: "Platform Engineering", description: "Cluster provisioning, storage and internal tooling.", member_count: 3, created_at: subDays(new Date(), 40).toISOString() },
];

const member = (user_id: number, role: TeamMember["role"], days: number): TeamMember => {
  const person = people.find((p) => p.id === user_id)!;
  return { user_id, name: person.name, email: person.email, role, joined_at: subDays(new Date(), days).toISOString() };
};

export const members: Record<string, TeamMember[]> = {
  [TEAM_IDS.imaging]: [member(2, "TEAM_LEADER", 96), member(3, "TEAM_MEMBER", 90), member(6, "TEAM_MEMBER", 61), member(7, "TEAM_MEMBER", 22)],
  [TEAM_IDS.protein]: [member(5, "TEAM_LEADER", 71), member(3, "TEAM_MEMBER", 64), member(7, "TEAM_MEMBER", 30)],
  [TEAM_IDS.platform]: [member(4, "TEAM_LEADER", 40), member(3, "TEAM_MEMBER", 40), member(6, "TEAM_MEMBER", 12)],
};

export const columns = [
  { id: "backlog", title: "Backlog" },
  { id: "in_progress", title: "In progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

const task = (
  id: string, column_id: string, title: string, assignee_id: number | null,
  priority: Task["priority"], dueInDays: number | null, tags: string[], description = ""
): Task => ({
  id, column_id, title, description, assignee_id, priority, tags,
  start_date: dueInDays === null ? null : subDays(new Date(), 2).toISOString(),
  due_date: dueInDays === null ? null : addDays(new Date(), dueInDays).toISOString(),
  created_at: subDays(new Date(), 14).toISOString(),
});

export const tasks: Record<string, Task[]> = {
  [TEAM_IDS.imaging]: [
    task("t-1", "in_progress", "Re-run segmentation on 12 Aug stack", 3, "high", 2, ["pipeline"], "Batch 04 came out of the LSM900 with a shifted z-offset. Re-run with the corrected calibration file before the Friday review."),
    task("t-2", "in_progress", "Calibrate LSM900 after objective swap", 6, "high", 1, ["instrument"]),
    task("t-3", "review", "Draft methods section for the imaging paper", 7, "medium", 5, ["writing"]),
    task("t-4", "backlog", "Automate TIFF → Zarr conversion", 3, "medium", 9, ["pipeline", "storage"]),
    task("t-5", "backlog", "Order replacement immersion oil", 7, "low", null, ["admin"]),
    task("t-6", "done", "Book A100 time for the August batch", 2, "medium", -3, ["compute"]),
    task("t-7", "done", "Fix drift correction off-by-one", 6, "high", -6, ["pipeline"]),
  ],
  [TEAM_IDS.protein]: [
    task("t-8", "in_progress", "MD run 400ns — trajectory 3", 5, "high", 3, ["simulation"]),
    task("t-9", "backlog", "Re-prep grids for the cryo session", 7, "medium", 6, ["wet-lab"]),
    task("t-10", "done", "Cold room B temperature log review", 3, "low", -2, ["compliance"]),
  ],
  [TEAM_IDS.platform]: [
    task("t-11", "in_progress", "Move object storage to the new MinIO node", 4, "high", 4, ["infra"]),
    task("t-12", "review", "Rotate internal API keys", 6, "high", 1, ["security"]),
    task("t-13", "backlog", "Write runbook for cluster restarts", 3, "low", 12, ["docs"]),
  ],
};

const message = (
  id: string, channel: string, senderId: number, text: string,
  minutesAgo: number, reply_to_id: string | null = null, mentions: number[] = []
): ChatMessage => {
  const person = people.find((p) => p.id === senderId)!;
  return {
    id, channel_id: channel, sender: { id: person.id, name: person.name },
    message: text, reply_to_id, mentions,
    created_at: subMinutes(new Date(), minutesAgo).toISOString(),
  };
};

export const chat: Record<string, ChatMessage[]> = {
  [TEAM_IDS.imaging]: [
    message("m-1", TEAM_IDS.imaging, 2, "Batch 04 finished overnight. The z-offset looks wrong on slices 60 onward.", 320),
    message("m-2", TEAM_IDS.imaging, 6, "That will be the objective swap on Tuesday — I never re-ran the calibration.", 314),
    message("m-3", TEAM_IDS.imaging, 3, "Do we re-acquire or correct in post?", 300, "m-2"),
    message("m-4", TEAM_IDS.imaging, 6, "Correct in post for batch 04, re-calibrate before batch 05. I will do it this afternoon.", 292, "m-3"),
    message("m-5", TEAM_IDS.imaging, 2, "Agreed. @Sangeeth Kariyapperuma can you re-run segmentation once the corrected file is in?", 250, null, [3]),
    message("m-6", TEAM_IDS.imaging, 3, "Yes — I will queue it on the A100 tonight, results by tomorrow morning.", 244),
    message("m-7", TEAM_IDS.imaging, 7, "Methods draft is at 60%. I need the final calibration numbers before I can finish 2.3.", 120),
    message("m-8", TEAM_IDS.imaging, 2, "Review meeting Friday 10:00 in seminar room 2.14, agenda is in the shared doc.", 45),
  ],
  [TEAM_IDS.protein]: [
    message("m-9", TEAM_IDS.protein, 5, "Trajectory 3 is at 260ns, no instability so far.", 180),
    message("m-10", TEAM_IDS.protein, 7, "Grids from Monday are unusable, ice is far too thick. Re-prepping tomorrow.", 96),
    message("m-11", TEAM_IDS.protein, 5, "Book cold room B for the morning then.", 90, "m-10"),
  ],
  [TEAM_IDS.platform]: [
    message("m-12", TEAM_IDS.platform, 4, "New MinIO node is racked. Migration window Saturday 08:00–12:00.", 400),
    message("m-13", TEAM_IDS.platform, 6, "Key rotation is done for the socket server, core-api is next.", 150),
  ],
};

export const resources: Resource[] = [
  { id: "r-1", org_id: ORG_ID, name: "A100 node 2", code: "GPU-A100-02", kind: "gpu", location: "Server room B", enabled: true, availability: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start: "08:00", end: "22:00" })) },
  { id: "r-2", org_id: ORG_ID, name: "RTX 6000 workstation", code: "WS-RTX-04", kind: "workstation", location: "Lab 3, bench 4", enabled: true, availability: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start: "09:00", end: "18:00" })) },
  { id: "r-3", org_id: ORG_ID, name: "Confocal microscope (Zeiss LSM 900)", code: "INS-LSM900", kind: "instrument", location: "Imaging suite", enabled: true, availability: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start: "08:30", end: "17:30" })) },
  { id: "r-4", org_id: ORG_ID, name: "Cold room B", code: "RM-COLD-B", kind: "room", location: "Basement", enabled: true, availability: [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, start: "07:00", end: "20:00" })) },
  { id: "r-5", org_id: ORG_ID, name: "Seminar room 2.14", code: "RM-214", kind: "room", location: "Block 2, level 2", enabled: false, availability: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start: "08:00", end: "18:00" })) },
];

export const bookings: Booking[] = [
  { id: "bk-1", resource_id: "r-1", details_visible: true, team_public_id: TEAM_IDS.imaging, team_name: "Neural Imaging", requested_by_name: "Teshan Kannangara", start_time: at(weekday(1), 20), end_time: at(weekday(1), 22), purpose: "Segmentation batch 04" },
  { id: "bk-2", resource_id: "r-3", details_visible: true, team_public_id: TEAM_IDS.imaging, team_name: "Neural Imaging", requested_by_name: "Ravindu Jayasuriya", start_time: at(weekday(2), 9), end_time: at(weekday(2), 12, 30), purpose: "Calibration after objective swap" },
  { id: "bk-3", resource_id: "r-4", details_visible: true, team_public_id: TEAM_IDS.protein, team_name: "Protein Dynamics", requested_by_name: "Dilini Perera", start_time: at(weekday(3), 8), end_time: at(weekday(3), 11), purpose: "Grid preparation" },
  { id: "bk-4", resource_id: "r-1", details_visible: true, team_public_id: TEAM_IDS.protein, team_name: "Protein Dynamics", requested_by_name: "Dilini Perera", start_time: at(weekday(3), 14), end_time: at(weekday(3), 19), purpose: "MD trajectory 3" },
  { id: "bk-5", resource_id: "r-2", details_visible: true, team_public_id: TEAM_IDS.platform, team_name: "Platform Engineering", requested_by_name: "Kamsan Suntharalingam", start_time: at(weekday(4), 10), end_time: at(weekday(4), 16), purpose: "Storage migration rehearsal" },
];

export const requests: ResourceRequest[] = [
  { id: "rq-1", resource_id: "r-3", resource_name: "Confocal microscope (Zeiss LSM 900)", team_public_id: TEAM_IDS.imaging, team_name: "Neural Imaging", requested_by: 2, requested_by_name: "Teshan Kannangara", start_time: at(addDays(monday, 7), 9), end_time: at(addDays(monday, 7), 13), purpose: "Batch 05 acquisition", status: "pending", created_at: subHours(new Date(), 5).toISOString() },
  { id: "rq-2", resource_id: "r-1", resource_name: "A100 node 2", team_public_id: TEAM_IDS.platform, team_name: "Platform Engineering", requested_by: 4, requested_by_name: "Kamsan Suntharalingam", start_time: at(addDays(monday, 8), 8), end_time: at(addDays(monday, 8), 18), purpose: "Benchmark the new storage path", status: "pending", created_at: subHours(new Date(), 26).toISOString() },
  { id: "rq-3", resource_id: "r-4", resource_name: "Cold room B", team_public_id: TEAM_IDS.protein, team_name: "Protein Dynamics", requested_by: 5, requested_by_name: "Dilini Perera", start_time: at(weekday(3), 8), end_time: at(weekday(3), 11), purpose: "Grid preparation", status: "approved", created_at: subDays(new Date(), 3).toISOString(), decided_at: subDays(new Date(), 2).toISOString() },
  { id: "rq-4", resource_id: "r-2", resource_name: "RTX 6000 workstation", team_public_id: TEAM_IDS.imaging, team_name: "Neural Imaging", requested_by: 2, requested_by_name: "Teshan Kannangara", start_time: at(subDays(monday, 3), 9), end_time: at(subDays(monday, 3), 17), purpose: "Ad-hoc rendering", status: "rejected", created_at: subDays(new Date(), 9).toISOString(), decided_at: subDays(new Date(), 8).toISOString() },
];

export const docs: Doc[] = [
  { id: "d-1", team_public_id: TEAM_IDS.imaging, title: "Weekly sync — imaging", updated_at: subHours(new Date(), 3).toISOString(), updated_by: "Teshan Kannangara", content: "<h2>Agenda</h2><p>Batch 04 z-offset, calibration schedule, methods draft.</p><h2>Decisions</h2><ul><li>Correct batch 04 in post, re-calibrate before batch 05.</li><li>Friday review moved to 10:00, seminar room 2.14.</li></ul><h2>Actions</h2><ul><li>Ravindu: re-calibrate LSM900 before Wednesday.</li><li>Sangeeth: re-run segmentation once the corrected file lands.</li></ul>" },
  { id: "d-2", team_public_id: TEAM_IDS.imaging, title: "Imaging pipeline v2 — spec", updated_at: subDays(new Date(), 2).toISOString(), updated_by: "Sangeeth Kariyapperuma", content: "<h2>Scope</h2><p>Replace the TIFF intermediate with Zarr and move drift correction upstream of segmentation.</p><h2>Open questions</h2><ul><li>Chunk size for the 16-bit stacks.</li><li>Whether to keep the MATLAB step at all.</li></ul>" },
  { id: "d-3", team_public_id: TEAM_IDS.protein, title: "Cryo session — prep checklist", updated_at: subDays(new Date(), 1).toISOString(), updated_by: "Ayesha Fernando", content: "<h2>Before the session</h2><ul><li>Cold room B booked and logged.</li><li>Grids glow-discharged same morning.</li><li>Blotting time recorded per grid.</li></ul>" },
  { id: "d-4", team_public_id: TEAM_IDS.platform, title: "Storage migration runbook", updated_at: subHours(new Date(), 30).toISOString(), updated_by: "Kamsan Suntharalingam", content: "<h2>Window</h2><p>Saturday 08:00–12:00.</p><h2>Steps</h2><ul><li>Drain writes, snapshot the current bucket.</li><li>Sync to the new node, verify checksums.</li><li>Flip the endpoint, keep the old node read-only for a week.</li></ul>" },
];

const file = (id: string, name: string, size: number, type: string, by: number, hoursAgo: number): StoredFile => ({
  id, name, size, content_type: type, uploaded_by: by,
  uploaded_by_name: people.find((p) => p.id === by)!.name,
  uploaded_at: subHours(new Date(), hoursAgo).toISOString(),
});

export const files: Record<string, StoredFile[]> = {
  [TEAM_IDS.imaging]: [
    file("f-1", "lsm900-calibration-2026-08.pdf", 412_336, "application/pdf", 6, 4),
    file("f-2", "batch04-sample-manifest.xlsx", 28_914, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 3, 29),
    file("f-3", "segmentation-params.json", 3_112, "application/json", 3, 52),
  ],
  [TEAM_IDS.protein]: [file("f-4", "grid-prep-log.docx", 96_500, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 7, 20)],
  [TEAM_IDS.platform]: [file("f-5", "minio-migration-plan.pdf", 187_442, "application/pdf", 4, 33)],
};

export const settings: OrgSettings = {
  org_id: ORG_ID,
  name: "Aratuwa Research Lab",
  public_id: ORG_PUBLIC_ID,
  status: "active",
  registration_fields: [
    { key: "student_id", label: "University ID", type: "text", required: true },
    { key: "department", label: "Department", type: "select", required: true, options: ["Computer Science", "Molecular Biology", "Physics", "Chemistry"] },
    { key: "supervisor", label: "Supervisor", type: "text", required: false },
  ],
  ai: {
    enabled: true, provider: "builtin", model: "llama-3.1-8b-instruct",
    available_models: ["llama-3.1-8b-instruct", "mistral-7b-instruct", "qwen2.5-14b-instruct"],
  },
};

export const nextBookingWindow = () => ({
  start: at(addHours(new Date(), 24), 9),
  end: at(addHours(new Date(), 24), 12),
});
