import { fileCrypto } from "@/lib/crypto";
import { isLive } from "@/lib/env";
import { API_BASE } from "@/lib/env";
import { api, ApiError } from "@/lib/http";
import { fileKey } from "@/lib/keystore";
import type { StoredFile, User } from "@/lib/types";
import { getOrCreateTeamKey, getTeamKey, initializeUserKeys } from "@/features/files/keystore";

const orgHeader = (orgId: string) => ({ "X-Org-ID": orgId });

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
  upload: async (teamId: string, orgId: string, file: File, user: User) => {
    if (isLive("files")) {
      await initializeUserKeys(user);
      const keyInfo = await getOrCreateTeamKey(orgId, teamId, user);
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
  download: async (teamId: string, orgId: string, file: StoredFile, user: User) => {
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
      const key = await getTeamKey(orgId, teamId, keyVersion, user);
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
