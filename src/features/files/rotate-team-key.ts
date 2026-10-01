import { E2EE } from "@/lib/crypto";
import { keysApi, type TeamKeyWrap, type TeamKeyView } from "@/features/files/api";
import { isUserKeyUnlocked } from "@/features/files/keystore";

/** Explicit rotation never reuses the active key or silently adopts a concurrent
 * writer's key. The versioned API retains old wraps for existing files. */
export async function rotateTeamKey(orgId: string, teamId: string): Promise<TeamKeyView> {
  if (!isUserKeyUnlocked()) throw new Error("Unlock your encryption keys before rotating the team key.");
  const members = await keysApi.getPublicKeysForTeam(orgId, teamId);
  if (members.length === 0) throw new Error("No team members have registered encryption keys.");

  // Do not supersede the active version if a registered key cannot be wrapped.
  const recipients = await Promise.all(members.map(async (member) => ({
    userId: member.user_id,
    publicKey: await E2EE.importPublicKey(member.public_key),
  })));
  const { raw } = await E2EE.generateTeamKey();
  const wraps: TeamKeyWrap[] = await Promise.all(recipients.map(async (recipient) => ({
    user_id: recipient.userId,
    key: await E2EE.wrapFor(recipient.publicKey, raw),
    algorithm: "rsa-oaep-2048",
  })));
  return keysApi.createTeamKey(orgId, teamId, wraps);
}
