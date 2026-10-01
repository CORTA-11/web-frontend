import { filesApi } from "@/features/files/api";
import { grantMemberAccess } from "@/features/files/keystore";
import { isLive } from "@/lib/env";

/** Permission to fetch ciphertext and ability to decrypt are separate gates.
 * Re-wrap only this file's key version before recording approval. Other files
 * using that team key still require their own server-side creator permission.
 */
export async function prepareFileAccess(orgId: string, teamId: string, resourceId: string, memberId: string) {
  if (!isLive("files")) return;
  const files = await filesApi.list(teamId, orgId);
  const file = files.find((entry) => entry.id === resourceId);
  if (!file?.key_version) throw new Error("File encryption metadata is unavailable.");
  await grantMemberAccess(orgId, teamId, memberId, file.key_version);
}
