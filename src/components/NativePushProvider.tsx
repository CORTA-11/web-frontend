"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/session";
import { api } from "@/lib/http";
import { toast } from "sonner";

function getTargetRoute(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (typeof data.route === "string" && data.route.startsWith("/") && !data.route.startsWith("//")) return data.route;
  if (typeof data.team_id === "string" && typeof data.org_id === "string") {
    if (data.type === "file") {
      return `/orgs/${data.org_id}/teams/${data.team_id}/files`;
    }
    if (data.type === "doc" || data.type === "document") {
      return typeof data.doc_id === "string"
        ? `/orgs/${data.org_id}/teams/${data.team_id}/docs/${data.doc_id}`
        : `/orgs/${data.org_id}/teams/${data.team_id}/docs`;
    }
    if (data.type === "board" || data.type === "task") {
      return `/orgs/${data.org_id}/teams/${data.team_id}/board`;
    }
    return `/orgs/${data.org_id}/teams/${data.team_id}/chat`;
  }
  if (typeof data.org_id === "string") {
    return `/orgs/${data.org_id}`;
  }
  return null;
}

export function NativePushProvider() {
  const router = useRouter();
  const { user } = useSession();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function initPush() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) {
          return;
        }

        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Ensure high-priority notification channel exists on Android
        try {
          await PushNotifications.createChannel({
            id: "default",
            name: "General",
            description: "Notifications for messages and updates",
            importance: 5,
            visibility: 1,
            vibration: true,
          });
        } catch (chErr) {
          console.warn("[Push] Error creating notification channel:", chErr);
        }

        const permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === "prompt") {
          const requestResult = await PushNotifications.requestPermissions();
          if (requestResult.receive !== "granted") {
            console.warn("[Push] Permission not granted:", requestResult.receive);
            return;
          }
        } else if (permStatus.receive !== "granted") {
          console.warn("[Push] Notification permission status:", permStatus.receive);
          return;
        }

        await PushNotifications.addListener("registration", (token) => {
          try {
            localStorage.setItem("corta_fcm_token", token.value);
          } catch {
            // ignore storage failure
          }
          if (user && registeredTokenRef.current !== token.value) {
            registeredTokenRef.current = token.value;
            api("/v1/devices", {
              method: "POST",
              json: { token: token.value, platform: "android" },
            }).catch((err) => console.warn("[Push] Failed to register device token:", err));
          }
        });

        await PushNotifications.addListener("registrationError", (error) => {
          console.error("[Push] Registration error:", error);
        });

        await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          const route = getTargetRoute(notification.data);
          if (notification.title) {
            toast(notification.title, {
              description: notification.body,
              action: route
                ? {
                    label: "Open",
                    onClick: () => {
                      router.push(route);
                    },
                  }
                : undefined,
              duration: 6000,
            });
          }
        });

        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const route = getTargetRoute(action.notification?.data);
          if (route) {
            router.push(route);
          }
        });
        await PushNotifications.register();
      } catch (err) {
        console.warn("[Push] Native push initialization skipped or failed:", err);
      }
    }

    initPush();
  }, [user, router]);

  // When user logs in or changes, register any existing token with the backend
  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    try {
      const savedToken = localStorage.getItem("corta_fcm_token");
      if (savedToken && registeredTokenRef.current !== savedToken) {
        registeredTokenRef.current = savedToken;
        api("/v1/devices", {
          method: "POST",
          json: { token: savedToken, platform: "android" },
        }).catch((err) => console.warn("[Push] Failed to register saved device token:", err));
      }
    } catch {
      // ignore storage failure
    }
  }, [user]);

  return null;
}
