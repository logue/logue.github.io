/// <reference types="vite/client" />
/// <reference types="@cloudflare/workers-types" />

interface ImportMetaEnv {
  /** Vroid hubのクライアントID (必須) */
  VROID_CLIENT_ID: string;
  /** Vroid hubのクライアントシークレット (必須) */
  VROID_CLIENT_SECRET: string;
  /** VRoid Hubのリフレッシュトークン (必須) */
  VROID_REFRESH_TOKEN: string;
  /** VRoid HubのアバターID (必須) - URLの /models/{id} の部分 */
  VROID_AVATAR_ID: string;
  /** アセットサーバーのホストURL (必須)  */
  ASSET_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface PagesFunction<T> {
  (context: { env: T; request: Request }): Promise<Response>;
}
