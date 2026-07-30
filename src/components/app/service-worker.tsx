"use client";

import { useEffect } from "react";

/**
 * Registra o service worker do PWA ([public/sw.js](../../../public/sw.js)).
 *
 * Só em produção: em desenvolvimento um SW ativo confunde o hot reload do
 * Turbopack. Falha de registro é ignorada de propósito — o app funciona
 * perfeitamente sem PWA, então isso nunca deve virar erro visível.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
