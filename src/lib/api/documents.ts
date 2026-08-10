import type { ApiResponse } from "@/lib/api/client";
import { mockDelay } from "@/lib/mock/delay";
import { mockDocs } from "@/lib/mock/documents";
import type {
  CreateDocInput,
  Doc,
  DocSummary,
  UpdateDocInput,
} from "@/lib/types/document";

let docs = mockDocs.map((d) => ({ ...d }));

function toSummary(doc: Doc): DocSummary {
  return {
    id: doc.id,
    teamPublicId: doc.teamPublicId,
    title: doc.title,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
  };
}

export const documentsApi = {
  list: async (
    teamPublicId: string
  ): Promise<ApiResponse<DocSummary[]>> => {
    await mockDelay();
    return {
      success: true,
      data: docs
        .filter((d) => d.teamPublicId === teamPublicId)
        .map(toSummary),
    };
  },

  get: async (
    teamPublicId: string,
    docId: string
  ): Promise<ApiResponse<Doc>> => {
    await mockDelay();
    const doc = docs.find(
      (d) => d.id === docId && d.teamPublicId === teamPublicId
    );
    if (!doc) return { success: false, error: "Document not found." };
    return { success: true, data: { ...doc } };
  },

  create: async (
    teamPublicId: string,
    input: CreateDocInput,
    updatedBy = "2"
  ): Promise<ApiResponse<Doc>> => {
    await mockDelay();
    const doc: Doc = {
      id: crypto.randomUUID(),
      teamPublicId,
      title: input.title.trim() || "Untitled",
      content: "",
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    docs = [...docs, doc];
    return { success: true, data: doc };
  },

  update: async (
    teamPublicId: string,
    docId: string,
    input: UpdateDocInput,
    updatedBy = "2"
  ): Promise<ApiResponse<Doc>> => {
    await mockDelay(150);
    const existing = docs.find(
      (d) => d.id === docId && d.teamPublicId === teamPublicId
    );
    if (!existing) return { success: false, error: "Document not found." };
    const next: Doc = {
      ...existing,
      title: input.title?.trim() ?? existing.title,
      content: input.content ?? existing.content,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    docs = docs.map((d) => (d.id === docId ? next : d));
    return { success: true, data: next };
  },

  remove: async (
    teamPublicId: string,
    docId: string
  ): Promise<ApiResponse<null>> => {
    await mockDelay(150);
    const exists = docs.some(
      (d) => d.id === docId && d.teamPublicId === teamPublicId
    );
    if (!exists) return { success: false, error: "Document not found." };
    docs = docs.filter((d) => d.id !== docId);
    return { success: true, data: null };
  },
};
