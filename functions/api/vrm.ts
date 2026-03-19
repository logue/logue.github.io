/* eslint-disable @typescript-eslint/no-explicit-any */
interface Env {
  VROID_CLIENT_ID: string;
  VROID_CLIENT_SECRET: string;
  VROID_AVATAR_ID: string;
  VROID_REFRESH_TOKEN: string;
}

export const onRequest: PagesFunction<Env> = async context => {
  const { env } = context;

  try {
    if (!env.VROID_REFRESH_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'VROID_REFRESH_TOKEN is not set. Visit /api/auth to authorize.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. refresh_token を使って access_token を取得
    // (VRoid Hub は client_credentials 非対応のため authorization_code フローが必要)
    const tokenRes = await fetch('https://hub.vroid.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Api-Version': '11'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: env.VROID_CLIENT_ID,
        client_secret: env.VROID_CLIENT_SECRET,
        refresh_token: env.VROID_REFRESH_TOKEN
      })
    });

    const tokenData: any = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Token refresh failed:', JSON.stringify(tokenData));
      return new Response(JSON.stringify({ error: 'Token refresh failed', detail: tokenData }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. モデルの最新URLを取得
    const modelRes = await fetch(
      `https://hub.vroid.com/api/character_models/${env.VROID_AVATAR_ID}`,
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }
    );

    // modelRes を受け取った後の処理を以下のように修正
    const modelData: any = await modelRes.json();

    // デバッグ用: 実際にどんなデータが来ているかログに出す (Wranglerのターミナルを確認)
    console.log('VRoid API Response:', JSON.stringify(modelData, null, 2));

    // 安全なアクセス
    const modelVersion = modelData.character_model?.latest_character_model_version;

    if (!modelVersion) {
      return new Response(
        JSON.stringify({
          error: 'Model version not found',
          detail:
            'The character exists, but the latest_character_model_version is missing. Check if the model is public.'
        }),
        { status: 404 }
      );
    }

    const downloadUrl = modelVersion.download_url;
    // 3. フロント(Vue)に返す
    return new Response(JSON.stringify({ url: downloadUrl }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
