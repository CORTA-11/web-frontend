import { PeopleWorkspace } from "@/features/memberships/components/PeopleWorkspace";

export default async function PeoplePage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return <PeopleWorkspace orgId={orgId} />;
}
