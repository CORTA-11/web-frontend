"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlertIcon } from "lucide-react";
import { useSession, useSwitchOrg, useUserOrgs } from "@/features/auth/session";
import { orgRoleOf } from "@/features/auth/api";
import { useOrgSettings } from "@/features/settings/queries";

const Notice = ({ title, body }: { title: string; body: string }) => (
  <div className="flex h-svh items-center justify-center p-6">
    <div className="flex max-w-prose items-start gap-3 border border-border p-4">
      <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  </div>
);

/**
 * Tenant isolation at the routing edge: an account only reaches an organisation
 * they have membership in, and only once the platform has approved it.
 */
export function OrgGate({ orgId, children }: { orgId: string; children: ReactNode }) {
  const { user } = useSession();
  const { data: orgsPage, isPending } = useUserOrgs();
  const switchOrg = useSwitchOrg();
  const settings = useOrgSettings(orgId);
  const router = useRouter();

  useEffect(() => {
    if (user?.platform_role === "SUPER_ADMIN") router.replace("/admin");
  }, [user, router]);

  if (!user || user.platform_role === "SUPER_ADMIN") return null;

  if (isPending) {
    return (
      <div className="flex h-svh items-center justify-center text-xs text-muted-foreground">
        Checking organisation access…
      </div>
    );
  }

  const userOrgs = orgsPage?.items ?? [];
  const targetOrg = userOrgs.find((o) => o.id === orgId);

  if (!targetOrg) {
    return (
      <Notice
        title="This is not your organisation"
        body="Accounts can only reach the organisation they are a member of."
      />
    );
  }

  if (user.org_id !== orgId) {
    const role = orgRoleOf(targetOrg.my_role);
    switchOrg(orgId, role);
    return (
      <div className="flex h-svh items-center justify-center text-xs text-muted-foreground">
        Switching organisation…
      </div>
    );
  }

  if (settings.data?.status === "pending") {
    return (
      <Notice
        title="Waiting for platform approval"
        body="Your organisation has been registered and is queued for review by the platform operator. You will be able to sign in and set up teams as soon as it is approved."
      />
    );
  }

  if (settings.data?.status === "suspended" || settings.data?.status === "rejected") {
    return (
      <Notice
        title="This organisation is not active"
        body="The platform operator has suspended access. Contact them to have it reinstated."
      />
    );
  }

  return <>{children}</>;
}
