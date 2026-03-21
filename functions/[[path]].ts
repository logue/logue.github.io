/**
 * logue.dev & SPA Router
 * 1. Cloudflare Pages にファイルが存在しない場合、GitHub Pages (logue.github.io) へプロキシを試みます。
 * 2. GitHub にも存在しない場合、SPA のルーティング維持のため index.html を返します。
 */

export const onRequest: PagesFunction = async context => {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. まずは Cloudflare Pages 上の静的ファイルをチェック
  const response = await next();

  // ファイルが見つかった（200 OK や 304 等）場合は、そのまま返す
  if (response.status !== 404) {
    return response;
  }

  // --- ここから 404 時のレスポンス制御 ---

  // API リクエスト (/api/*) はプロキシや SPA フォールバックの対象外とする
  if (path.startsWith('/api/')) {
    return response;
  }

  // 2. GitHub Pages (logue.github.io) へのプロキシ試行
  // 個別のリストは持たず、すべての 404 リクエストを一度 GitHub へ投げてみる
  const githubOrigin = 'https://logue.github.io';
  const proxyUrl = `${githubOrigin}${path}${url.search}`;

  try {
    const proxyResponse = await fetch(proxyUrl, {
      headers: {
        Accept: request.headers.get('Accept') || '*/*',
        'User-Agent': request.headers.get('User-Agent') || 'Cloudflare-Pages-Proxy'
      }
    });

    // GitHub 側でファイルが見つかった場合はそのレスポンスを返す
    // 200 OK だけでなく、動画や音声の Partial Content (206) も許容
    if (proxyResponse.ok || proxyResponse.status === 206) {
      return proxyResponse;
    }
  } catch (e) {
    console.error('Proxy fetch failed:', e);
  }

  // 3. SPA フォールバック
  // Cloudflare にもなく、GitHub にもない場合は、本体（logue.dev）の SPA ルーティングとして index.html を返す
  const indexRes = await fetch(`${url.origin}/index.html`);
  if (indexRes.ok) {
    // 検索エンジン等が 404 ではなく 200 として index.html を受け取れるようにする
    return new Response(indexRes.body, {
      headers: indexRes.headers
    });
  }

  // 万が一 index.html も取得できなかった場合は元の 404 を返す
  return response;
};
