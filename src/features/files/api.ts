import { fileCrypto } from "@/lib/crypto";
import { isLive } from "@/lib/env";
import { API_BASE } from "@/lib/env";
import { api, ApiError } from "@/lib/http";
import { fileKey } from "@/lib/keystore";
import type { StoredFile } from "@/lib/types";
import { getOrCreateTeamKey, getTeamKey } from "@/features/files/keystore";

const orgHeader = (orgId: string) => ({ "X-Org-ID": orgId });

export type TeamKeyWrap = {
  user_id: string;
  key: string;
  algorithm: string;
};
export type UserKeyView = {
  user_id: string;
  public_key: string;
  encrypted_private_key?: string | null;
  kek_salt?: string | null;
  kek_iterations?: number | null;
  kek_algorithm?: string | null;
};

export type TeamKeyView = {
  id: number;
  team_id: string;
  version: number;
  status: string;
  algorithm: string;
  wraps: TeamKeyWrap[];
  wrapped_user_ids: string[];
  created_by: string;
  created_at: string;
};

export type KeyAccessRequestView = {
  id: string;
  team_id: string;
  team_name: string;
  requested_by: string;
  requested_by_name: string;
  status: string;
  created_at: string;
  decided_by?: string | null;
  decided_by_name?: string;
  decided_at?: string | null;
};

export const keysApi = {
  getUserKeys: () => api<UserKeyView>("/v1/auth/user-keys", { method: "GET" }),

  upsertUserKeys: (update: {
    public_key: string;
    encrypted_private_key: string;
    kek_salt: string;
    kek_iterations: number;
    kek_algorithm: string;
  }) => api<UserKeyView>("/v1/auth/user-keys", { method: "PUT", json: update }),

  getPublicKeysForTeam: (orgId: string, teamId: string) =>
    api<{ user_id: string; public_key: string; created_at: string }[]>(
      `/v1/orgs/${orgId}/teams/${teamId}/members/public-keys`
    ),

  createTeamKey: (orgId: string, teamId: string, wraps: TeamKeyWrap[]) =>
    api<TeamKeyView>(`/v1/orgs/${orgId}/teams/${teamId}/keys`, {
      method: "POST",
      json: { algorithm: "aes-256-gcm", wraps },
    }),

  listTeamKeys: (orgId: string, teamId: string) =>
    api<TeamKeyView[]>(`/v1/orgs/${orgId}/teams/${teamId}/keys`, { method: "GET" }),

  /** Appends a re-wrap so the target member can decrypt this key version. */
  addTeamKeyMemberWrap: (orgId: string, teamId: string, version: number, wrap: TeamKeyWrap) =>
    api<TeamKeyView>(`/v1/orgs/${orgId}/teams/${teamId}/keys/${version}/wraps`, {
      method: "POST",
      json: wrap,
    }),
};

/** Requests from members to read team key versions that predate their joining. */
export const keyAccessApi = {
  create: (teamId: string, orgId: string) =>
    api<KeyAccessRequestView>(`/v1/orgs/${orgId}/teams/${teamId}/key-access-requests`, {
      method: "POST",
    }),

  list: (teamId: string, orgId: string) =>
    api<{ items: KeyAccessRequestView[] }>(`/v1/orgs/${orgId}/teams/${teamId}/key-access-requests`, {
      method: "GET",
    }).then((body) => body.items),

  approve: (teamId: string, orgId: string, requestId: string) =>
    api<KeyAccessRequestView>(`/v1/orgs/${orgId}/teams/${teamId}/key-access-requests/${requestId}/approve`, {
      method: "POST",
    }),

  deny: (teamId: string, orgId: string, requestId: string) =>
    api<KeyAccessRequestView>(`/v1/orgs/${orgId}/teams/${teamId}/key-access-requests/${requestId}/deny`, {
      method: "POST",
    }),
};

type LiveFileView = {
  id: string;
  name: string;
  size: number;
  content_type: string;
  iv: string;
  key_version: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

const fromLive = (file: LiveFileView): StoredFile => ({
  id: file.id,
  name: file.name,
  size: file.size,
  content_type: file.content_type,
  uploaded_by: 0,
  uploaded_by_name: "—",
  uploaded_at: file.created_at,
});

export const filesApi = {
  list: (teamId: string, orgId: string) =>
    isLive("files")
      ? api<LiveFileView[]>(`/v1/orgs/${orgId}/teams/${teamId}/files`).then((files) => files.map(fromLive))
      : api<StoredFile[]>(`/teams/${teamId}/files`),

  /** Sealed before it is attached, so plaintext never reaches the network. */
  upload: async (teamId: string, orgId: string, file: File) => {
    if (isLive("files")) {
      const keyInfo = await getOrCreateTeamKey(orgId, teamId);
      const { file: encryptedFile, iv } = await fileCrypto.encrypt(file, keyInfo.key);

      const form = new FormData();
      form.append("name", file.name);
      form.append("key_version", String(keyInfo.version));
      form.append("iv", String.fromCharCode(...iv));
      form.append("file", encryptedFile);

      return api<LiveFileView>(`/v1/orgs/${orgId}/teams/${teamId}/files`, {
        method: "POST",
        body: form,
      }).then(fromLive);
    } else {
      const form = new FormData();
      const { file: encryptedFile } = await fileCrypto.encrypt(file);
      form.append("file", encryptedFile);
      return api<StoredFile>(`/teams/${teamId}/files/upload`, { method: "POST", body: form });
    }
  },

  remove: (teamId: string, orgId: string, fileId: string) =>
    isLive("files")
      ? api<void>(`/v1/orgs/${orgId}/teams/${teamId}/files/${fileId}`, { method: "DELETE" })
      : api<void>(`/teams/${teamId}/files/${fileId}`, { method: "DELETE" }),

  /**
   * Streams through fetch so the bearer token travels with the request — and so
   * the bytes are unsealed in the page, never handed to the browser encrypted.
   */
  download: async (teamId: string, orgId: string, file: StoredFile) => {
    const path = isLive("files")
      ? `/v1/orgs/${orgId}/teams/${teamId}/files/${file.id}`
      : `/teams/${teamId}/files/download/${file.id}`;
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: isLive("files") ? orgHeader(orgId) : {},
    });
    if (!response.ok) throw new ApiError(response.status, "Could not download that file");

    let decryptedBlob: Blob;
    if (isLive("files")) {
      const keyVersionStr = response.headers.get("X-File-Key-Version");
      const keyVersion = keyVersionStr ? parseInt(keyVersionStr, 10) : 1;
      const key = await getTeamKey(orgId, teamId, keyVersion);
      decryptedBlob = await fileCrypto.decrypt(await response.blob(), key);
    } else {
      const key = await fileKey();
      decryptedBlob = await fileCrypto.decrypt(await response.blob(), key);
    }

    const url = URL.createObjectURL(decryptedBlob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    // Revoked a tick later: Chromium reads the blob after the click returns.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  },
};
