interface Env {
  VROID_CLIENT_ID: string;
}

/** crypto.subtle で SHA-256 を計算して Base64URL エンコードする */
async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/** ランダムな URL-safe 文字列を生成する (length: 文字数) */
function randomUrlSafe(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
}

/**
 * GET /api/auth
 * VRoid Hub の OAuth 認可ページへリダイレクトする。
 * 初回セットアップ時に一度だけアクセスし、VROID_REFRESH_TOKEN を取得するために使用する。
 * PKCE (S256) + state を使って CSRF 対策を行う。
 */
export const onRequestGet: PagesFunction<Env> = async context => {
  const { env, request } = context;

  // redirect_uri はリクエストの origin から動的に生成する
  // (環境変数の port とサーバーの実際の port がズレると invalid_grant になるため)
  const redirectUri = `${new URL(request.url).origin}/api/auth/callback`;

  // PKCE: code_verifier (43〜128文字) を生成して cookie に保存
  const codeVerifier = randomUrlSafe(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);

  // state: CSRF 対策の乱数
  const state = randomUrlSafe(32);

  const params = new URLSearchParams({
    client_id: env.VROID_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'default',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  // cookie に code_verifier と state を保存 (HttpOnly, SameSite=Lax)
  // Set-Cookie は複数の場合 headers.append() で個別に送る必要がある
  const cookieOpts = 'Path=/; HttpOnly; SameSite=Lax; Max-Age=600';
  const headers = new Headers({
    Location: `https://hub.vroid.com/oauth/authorize?${params.toString()}`
  });
  headers.append('X-Api-Version', '11'); // VRoid Hub API v11 を指定 (PKCE 対応のため必須)
  headers.append('Set-Cookie', `vroid_cv=${codeVerifier}; ${cookieOpts}`);
  headers.append('Set-Cookie', `vroid_state=${state}; ${cookieOpts}`);

  return new Response(null, { status: 302, headers });
};
