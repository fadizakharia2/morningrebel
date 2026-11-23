/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  /**
   * Morning Rebel environment variables (Oxygen bindings / local .env).
   * PUBLIC_* values are intentionally exposed to the browser. Everything
   * else stays on the server. See .env.example.
   */
  interface Env {
    MEDIUM_ROAST_HANDLE?: string;
    DARK_ROAST_HANDLE?: string;
    DUO_PRODUCT_HANDLE?: string;
    MR_DEV_FIXTURES?: string;
    PUBLIC_SITE_URL?: string;
    PUBLIC_GA4_MEASUREMENT_ID?: string;
    PUBLIC_GOOGLE_ADS_ID?: string;
    PUBLIC_GOOGLE_ADS_ADD_TO_CART_LABEL?: string;
    PUBLIC_META_PIXEL_ID?: string;
    PUBLIC_TIKTOK_PIXEL_ID?: string;
    PUBLIC_PRIVACY_BANNER?: string;
  }
}
