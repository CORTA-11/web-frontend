"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, type RegisterInput } from "@/features/auth/api";
import { qk } from "@/lib/query-keys";
import { setAccessToken } from "@/lib/token";
import type { AuthResponse, User } from "@/lib/types";

/** Where a signed-in account belongs: operators to the console, everyone else to their org. */
export const homeFor = (user: User) =>
  user.platform_role === "SUPER_ADMIN" ? "/admin" : `/orgs/${user.org_id}`;

/**
 * The session is a query, not a store: the access token stays in memory and the
 * user object lives in the cache, so every consumer gets it without prop drilling.
 */
export function useSession() {
  const { data, isPending } = useQuery({
    queryKey: qk.session,
    queryFn: async () => {
      const { access_token, user } = await authApi.refresh();
      setAccessToken(access_token);
      return user;
    },
    retry: false,
    staleTime: Infinity,
  });

  return { user: data ?? null, isPending };
}

function useSessionSetter() {
  const client = useQueryClient();
  return ({ access_token, user }: AuthResponse) => {
    setAccessToken(access_token);
    client.setQueryData<User>(qk.session, user);
    return user;
  };
}

export function useLogin() {
  const setSession = useSessionSetter();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (response) => router.replace(homeFor(setSession(response))),
  });
}

export function useRegister() {
  const setSession = useSessionSetter();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (response) => router.replace(homeFor(setSession(response))),
  });
}

export function useLogout() {
  const client = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      setAccessToken(null);
      client.clear();
      router.replace("/login");
    },
  });
}
