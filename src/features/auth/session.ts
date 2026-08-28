"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, type RegisterInput } from "@/features/auth/api";
import { qk } from "@/lib/query-keys";
import { setCSRFToken } from "@/lib/token";
import type { User } from "@/lib/types";

/** Where a signed-in account belongs: operators to the console, everyone else to their org. */
export const homeFor = (user: User) =>
  user.platform_role === "SUPER_ADMIN" ? "/admin" : `/orgs/${user.org_id}`;

/**
 * The session is a query, not a store: the CSRF token stays in memory and the
 * enriched user object lives in the cache, so every consumer gets it without
 * prop drilling. core-api reads the httpOnly session cookie on GET /auth/session.
 */
export function useSession() {
  const { data, isPending } = useQuery({
    queryKey: qk.session,
    queryFn: () => authApi.session(),
    retry: false,
    staleTime: Infinity,
  });

  return { user: data ?? null, isPending };
}

export function useLogin() {
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (user) => {
      client.setQueryData<User>(qk.session, user);
      router.replace(homeFor(user));
    },
  });
}

export function useRegister() {
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (user) => {
      client.setQueryData<User>(qk.session, user);
      router.replace(homeFor(user));
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      setCSRFToken(null);
      client.clear();
      router.replace("/login");
    },
  });
}
