export type DocSummary = {
  id: string;
  teamPublicId: string;
  title: string;
  updatedAt: string;
  updatedBy: string;
};

export type Doc = DocSummary & {
  content: string;
};

export type CreateDocInput = {
  title: string;
};

export type UpdateDocInput = {
  title?: string;
  content?: string;
};
