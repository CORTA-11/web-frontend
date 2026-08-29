import { Suspense } from "react";
import { InvitationPage } from "@/features/invitations/components/InvitationPage";

export default function InvitePage() {
  return <Suspense fallback={null}><InvitationPage /></Suspense>;
}
