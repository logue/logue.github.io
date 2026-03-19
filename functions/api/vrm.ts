/* eslint-disable @typescript-eslint/no-explicit-any */
interface Env {
  VROID_CLIENT_ID: string;
  VROID_CLIENT_SECRET: string;
  VROID_AVATAR_ID: string;
}

export const onRequest: PagesFunction<Env> = async context => {
  const { env } = context;

  try {
    // 1. トークン取得 (Client Credentials)
    const tokenRes = await fetch('https://hub.vroid.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: env.VROID_CLIENT_ID,
        client_secret: env.VROID_CLIENT_SECRET,
        scope: 'model_read'
      })
    });

    const tokenData: any = await tokenRes.json();

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
