"use client";

import { useParams } from "next/navigation";
import { DocDetail } from "@/features/docs/components/DocDetail";

export default function DocPage() {
  const params = useParams<{ orgId: string; teamId: string; docId: string }>();
  return <DocDetail {...params} />;
}
