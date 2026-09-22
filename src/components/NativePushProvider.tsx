"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/features/auth/session";
import { api } from "@/lib/http";
import { toast } from "sonner";

export function NativePushProvider() {
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

        await PushNotifications.register();

        await PushNotifications.addListener("registration", (token) => {
          console.log("[Push] FCM Device Token:", token.value);
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
          console.log("[Push] Notification received:", notification);
          if (notification.title) {
            toast(notification.title, {
              description: notification.body,
            });
          }
        });

        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          console.log("[Push] Notification action performed:", action);
        });
      } catch (err) {
        console.warn("[Push] Native push initialization skipped or failed:", err);
      }
    }

    initPush();
  }, [user]);

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
