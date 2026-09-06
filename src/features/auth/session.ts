"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authApi, type RegisterInput } from "@/features/auth/api";
import { isLive } from "@/lib/env";
import { qk } from "@/lib/query-keys";
import { setCSRFToken } from "@/lib/token";
import type { OrgRole, User } from "@/lib/types";
import { notifyError } from "@/lib/query";
import { ApiError } from "@/lib/http";
import { keysApi, isUserKeyUnlocked, seedOrUnlockUserKeys } from "@/features/files/keystore";

/** Where a signed-in account belongs: operators to the console, everyone else to their org. */
export const homeFor = (user: User) =>
  user.platform_role === "SUPER_ADMIN" ? "/admin" : "/orgs";

const safeNext = (value: string | null, fallback: string) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : fallback;

const keysAreLive = () => isLive("files") && isLive("auth");

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
  const search = useSearchParams();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: async (user, { password }) => {
      client.setQueryData<User>(qk.session, user);
      router.replace(safeNext(search.get("next"), homeFor(user)));
      // Best-effort: a failed unlock surfaces again as the session gate on the
      // destination page rather than blocking navigation here.
      if (keysAreLive()) seedOrUnlockUserKeys(password).catch(() => {});
    },
  });
}

export function useRegister() {
  const client = useQueryClient();
  const router = useRouter();
  const search = useSearchParams();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: async (user, input) => {
      client.setQueryData<User>(qk.session, user);
      router.replace(safeNext(search.get("next"), homeFor(user)));
      if (keysAreLive()) seedOrUnlockUserKeys(input.password).catch(() => {});
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

/**
 * Unlock state for the E2EE keys: the server either has a sealed private key
 * (needs the password) or none yet (also needs the password, to create one).
 * Only ends up locked when the tab was restored without login, since login and
 * register unlock with the password just typed.
 */
export function useUserKeyLock() {
  const { user } = useSession();
  const applicable = keysAreLive();
  const { data, isPending } = useQuery({
    queryKey: [...qk.userKeys, user?.public_id],
    queryFn: async () => {
      try {
        await keysApi.getUserKeys();
        return "sealed" as const;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return "absent" as const;
        throw error;
      }
    },
    enabled: !!user && applicable,
    retry: false,
    staleTime: Infinity,
  });

  return {
    applicable,
    isPending,
    locked: applicable && !!user && data !== undefined && !isUserKeyUnlocked(),
  };
}

export function useUnlockUserKeys() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => seedOrUnlockUserKeys(password),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.userKeys }),
    onError: notifyError,
  });
}

export function useUserOrgs() {
  const { user } = useSession();
  return useQuery({
    queryKey: [...qk.userOrgs, user?.id],
    queryFn: () => authApi.organizations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user,
  });
}

export function useCreateOrganization() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => authApi.createOrganization(name),
    onSuccess: (org) => {
      client.setQueryData<User>(qk.session, (user) =>
        user ? { ...user, org_id: org.id, org_role: "ORG_ADMIN" } : user
      );
      client.invalidateQueries({ queryKey: qk.userOrgs });
      toast.success(`${org.name} created`);
    },
    onError: notifyError,
  });
}

export function useSwitchOrg() {
  const client = useQueryClient();
  return (orgId: string, role: OrgRole) => {
    client.setQueryData<User>(qk.session, (prev) => {
      if (!prev) return prev;
      return { ...prev, org_id: orgId, org_role: role };
    });
  };
}
