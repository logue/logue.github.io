/* eslint-disable @typescript-eslint/no-explicit-any */
interface Env {
  VROID_CLIENT_ID: string;
  VROID_CLIENT_SECRET: string;
}

/**
 * GET /api/auth/callback
 * VRoid Hub から認可コードを受け取り、アクセストークンとリフレッシュトークンに交換する。
 * 取得した refresh_token を .dev.vars および Cloudflare Pages の環境変数
 * VROID_REFRESH_TOKEN に設定してください。
 */
export const onRequestGet: PagesFunction<Env> = async context => {
  const { env, request } = context;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`<p>Authorization failed: ${error}</p>`, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (!code) {
    return new Response('<p>Missing authorization code.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // cookie から code_verifier と state を取得して検証
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const getCookie = (name: string) =>
    cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1];

  const savedState = getCookie('vroid_state');
  const codeVerifier = getCookie('vroid_cv');

  const returnedState = url.searchParams.get('state');
  if (!savedState || savedState !== returnedState) {
    return new Response('<p>State mismatch. Possible CSRF attack or session expired.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  if (!codeVerifier) {
    return new Response('<p>Missing code_verifier cookie. Please restart the auth flow.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // redirect_uri は認可リクエスト時と同じ値 (origin から動的生成) を使う
  const redirectUri = `${new URL(request.url).origin}/api/auth/callback`;

  const tokenRes = await fetch('https://hub.vroid.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Api-Version': '11'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.VROID_CLIENT_ID,
      client_secret: env.VROID_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  });

  const tokenData: any = await tokenRes.json();

  if (!tokenData.refresh_token) {
    return new Response(
      `<pre style="color:red">Token exchange failed:\n${JSON.stringify(tokenData, null, 2)}</pre>`,
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>VRoid Auth Setup</title></head>
<body style="font-family:monospace;padding:2rem;max-width:800px">
  <h2>認証成功</h2>
  <p>以下の <code>refresh_token</code> を <code>.dev.vars</code> と
  Cloudflare Pages の環境変数 <strong>VROID_REFRESH_TOKEN</strong> に設定してください。</p>
  <h3>refresh_token</h3>
  <textarea rows="3" style="width:100%;font-size:0.85em">${tokenData.refresh_token}</textarea>
  <h3>設定方法</h3>
  <ol>
    <li><code>.dev.vars</code> の <code>VROID_REFRESH_TOKEN=</code> に上記のトークンを貼り付ける</li>
    <li>Cloudflare Pages ダッシュボード → Settings → Environment Variables に <code>VROID_REFRESH_TOKEN</code> を追加する</li>
  </ol>
  <details><summary>フルレスポンス</summary><pre>${JSON.stringify(tokenData, null, 2)}</pre></details>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
