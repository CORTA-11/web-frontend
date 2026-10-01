import type { KeyAccessRequestView } from "@/features/files/api";

/** Requests arrive newest first. Members only receive their latest decision. */
export function accessNotifications(requests: KeyAccessRequestView[], userId: string, isLeader: boolean) {
  const received = isLeader
    ? requests.filter((entry) => entry.requested_by !== userId && entry.status === "pending")
    : [];
  const latest = requests.find((entry) => entry.requested_by === userId);
  if (latest && (latest.status === "granted" || latest.status === "denied")) received.push(latest);
  return received.map((entry) => ({
    key: `${entry.id}:${entry.status}`,
    message: entry.status === "pending"
      ? `${entry.requested_by_name} requested access to previous files`
      : `Your access to previous files was ${entry.status === "granted" ? "approved" : "denied"}`,
  }));
}
