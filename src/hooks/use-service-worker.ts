"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";

/**
 * Registers the hand-written service worker in /public/sw.js.
 * In development Next.js hot-reloads assets constantly, so registration is
 * skipped to avoid serving stale JS to the dev experience.
 */
export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let disposed = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (disposed) return;
        registrationRef.current = registration;

        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(installing);
              setUpdateAvailable(true);
              toast.success("A new version of VYBE is ready", { id: "sw-update" });
            }
          });
        });
      } catch {
        // Service worker is a progressive enhancement.
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register, { once: true });

    const onControllerChange = () => {
      // Only reload when the user explicitly accepted the update.
      if (sessionStorage.getItem("vybe:sw-reload") === "1") {
        sessionStorage.removeItem("vybe:sw-reload");
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const applyUpdate = () => {
    if (!waitingWorker) {
      window.location.reload();
      return;
    }
    sessionStorage.setItem("vybe:sw-reload", "1");
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  return { updateAvailable, applyUpdate };
}
