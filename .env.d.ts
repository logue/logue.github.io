///
/// <reference types="vite/client" />
///

interface ImportMetaEnv {
  readonly VROID_AVATAR_ID: string;
  readonly VROID_CLIENT_ID: string;
  readonly VROID_CLIENT_SECRET: string;
  readonly VROID_CLIENT_REDIRECT_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
