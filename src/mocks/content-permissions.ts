import { db, now, uid } from "@/mocks/db";
import type { AccessSnapshot, ContentKind } from "@/features/content-access/api";

const ownerKey = (kind: ContentKind, id: string) => `${kind}:${id}`;

export const contentPermissions = {
  register(kind: ContentKind, id: string, creatorId: number) {
    db.contentOwners[ownerKey(kind, id)] ??= String(creatorId);
  },
  snapshot(teamId: string, userId: number): AccessSnapshot {
    const items: AccessSnapshot["items"] = [];
    for (const doc of db.docs.filter((entry) => entry.team_public_id === teamId)) {
      const creator = db.people.find((entry) => entry.name === doc.updated_by);
      if (creator) this.register("document", doc.id, creator.id);
      const creatorId = db.contentOwners[ownerKey("document", doc.id)];
      if (creatorId) items.push({ kind: "document", resource_id: doc.id, creator_id: creatorId, can_access: this.allowed("document", doc.id, userId) });
    }
    for (const file of db.files[teamId] ?? []) {
      this.register("file", file.id, file.uploaded_by);
      items.push({ kind: "file", resource_id: file.id, creator_id: String(file.uploaded_by), can_access: this.allowed("file", file.id, userId) });
    }
    const requests = db.contentRequests.filter((entry) => items.some((item) => item.kind === entry.kind && item.resource_id === entry.resource_id &&
      (item.creator_id === String(userId) || entry.requested_by === String(userId))));
    return { items, requests };
  },
  allowed(kind: ContentKind, id: string, userId: number) {
    return db.contentOwners[ownerKey(kind, id)] === String(userId) || db.contentRequests.some((entry) =>
      entry.kind === kind && entry.resource_id === id && entry.requested_by === String(userId) && entry.status === "granted");
  },
  request(teamId: string, userId: number, kind: ContentKind, id: string) {
    const item = this.snapshot(teamId, userId).items.find((entry) => entry.kind === kind && entry.resource_id === id);
    if (!item || item.creator_id === String(userId)) return false;
    const current = db.contentRequests.find((entry) => entry.kind === kind && entry.resource_id === id && entry.requested_by === String(userId));
    if (current) {
      if (current.status !== "denied") return false;
      current.status = "pending"; current.updated_at = now();
    } else db.contentRequests.unshift({ public_id: uid("access"), kind, resource_id: id, requested_by: String(userId),
      requester_name: db.people.find((entry) => entry.id === userId)?.name ?? "", status: "pending", updated_at: now() });
    return true;
  },
  decide(teamId: string, userId: number, id: string, status: "granted" | "denied") {
    const snapshot = this.snapshot(teamId, userId);
    const request = snapshot.requests.find((entry) => entry.public_id === id && entry.status === "pending");
    if (!request || !snapshot.items.some((entry) => entry.kind === request.kind && entry.resource_id === request.resource_id && entry.creator_id === String(userId))) return false;
    if (!db.members[teamId]?.some((entry) => String(entry.user_id) === request.requested_by)) return false;
    request.status = status; request.updated_at = now();
    return true;
  },
  grant(teamId: string, userId: number, kind: ContentKind, id: string, memberId: string) {
    if (!this.snapshot(teamId, userId).items.some((entry) => entry.kind === kind && entry.resource_id === id && entry.creator_id === String(userId))) return false;
    const member = db.members[teamId]?.find((entry) => String(entry.user_id) === memberId);
    if (!member) return false;
    const request = db.contentRequests.find((entry) => entry.kind === kind && entry.resource_id === id && entry.requested_by === memberId);
    if (request) { request.status = "granted"; request.updated_at = now(); }
    else db.contentRequests.unshift({ public_id: uid("access"), kind, resource_id: id, requested_by: memberId,
      requester_name: member.name, status: "granted", updated_at: now() });
    return true;
  },
};
