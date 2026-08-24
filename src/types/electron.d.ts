import type { ColorFlowApi } from "@shared/preloadApi";

declare global {
  interface Window {
    colorflow: ColorFlowApi;
  }
}

export {};
