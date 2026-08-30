import type { SerenityApi } from "@shared/preloadApi";

declare global {
  interface Window {
    serenity: SerenityApi;
  }
}

export {};
