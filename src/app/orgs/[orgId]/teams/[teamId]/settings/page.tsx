"use client";

import { useParams } from "next/navigation";
import { TeamSettingsPage } from "@/features/team-settings/components/TeamSettingsPage";

export default function SettingsPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  return <TeamSettingsPage orgId={orgId} teamId={teamId} />;
}
