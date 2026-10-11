"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "@/components/ui/sonner";

const QUERY = "(min-width: 1024px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

/** Toasts no topo (mobile) e no canto inferior direito (desktop), sem cobrir a navegação */
export function AppToaster() {
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  return <Toaster position={desktop ? "bottom-right" : "top-center"} richColors />;
}
