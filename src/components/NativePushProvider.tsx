"use client";

import { useEffect } from "react";

export function NativePushProvider() {
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
        });

        await PushNotifications.addListener("registrationError", (error) => {
          console.error("[Push] Registration error:", error);
        });

        await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("[Push] Notification received:", notification);
        });

        await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          console.log("[Push] Notification action performed:", action);
        });
      } catch (err) {
        console.warn("[Push] Native push initialization skipped or failed:", err);
      }
    }

    initPush();
  }, []);

  return null;
}
