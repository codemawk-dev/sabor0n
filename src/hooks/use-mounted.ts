"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * true somente após a hidratação no cliente. Usado para ler estado
 * persistido em localStorage (carrinho) sem mismatch de SSR.
 */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
