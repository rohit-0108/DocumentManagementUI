/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_PROXY_TARGET: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_MAX_FILE_SIZE_MB: string;
  readonly VITE_ALLOWED_EXTENSIONS: string;
  readonly VITE_POLL_INTERVAL_MS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}