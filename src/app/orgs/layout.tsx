import { AuthGuard } from "@/components/auth/AuthGuard";

export default function OrganizationsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
