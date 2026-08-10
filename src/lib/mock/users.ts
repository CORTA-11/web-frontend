import type { User } from "@/lib/types/user";

export const MOCK_ORG_ID = "1";
export const MOCK_ORG_PUBLIC_ID = "aratuwa";
export const MOCK_TEAM_PUBLIC_ID = "lab-alpha";
export const MOCK_PASSWORD = "password123";

export type MockAccount = User & { password: string };

/** Mutable account list used by mock auth / teams. */
export let mockAccounts: MockAccount[] = [
  {
    id: "1",
    orgId: MOCK_ORG_ID,
    name: "Admin Aratuwa",
    email: "admin@aratuwa.edu",
    avatarUrl: "",
    role: "admin",
    password: MOCK_PASSWORD,
  },
  {
    id: "2",
    orgId: MOCK_ORG_ID,
    name: "Leader Lab",
    email: "leader@aratuwa.edu",
    avatarUrl: "",
    role: "member",
    password: MOCK_PASSWORD,
  },
  {
    id: "3",
    orgId: MOCK_ORG_ID,
    name: "Member Lab",
    email: "member@aratuwa.edu",
    avatarUrl: "",
    role: "member",
    password: MOCK_PASSWORD,
  },
];

export function toUser(account: MockAccount): User {
  const { password: _password, ...user } = account;
  return user;
}

export function findAccountByEmail(email: string): MockAccount | undefined {
  return mockAccounts.find(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
}

export function findAccountById(id: string): MockAccount | undefined {
  return mockAccounts.find((a) => a.id === id);
}

export function addMockAccount(account: MockAccount): void {
  mockAccounts = [...mockAccounts, account];
}

/** @deprecated use mockAccounts / toUser — kept for board/resources mocks */
export const mockUsers: User[] = mockAccounts.map(toUser);
