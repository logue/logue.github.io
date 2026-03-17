import type { APIRoute } from "astro";
import { getSecret } from "astro:env/server";

export const GET: APIRoute = async () => {
  // 1. VRoid Hubから一時的なトークンを取得
  const CLIENT_ID =
    getSecret("VROID_CLIENT_ID") || import.meta.env.VROID_CLIENT_ID;
  const CLIENT_SECRET =
    getSecret("VROID_CLIENT_SECRET") || import.meta.env.VROID_CLIENT_SECRET;
  const CLIENT_REDIRECT_URI =
    getSecret("VROID_CLIENT_REDIRECT_URI") ||
    import.meta.env.VROID_CLIENT_REDIRECT_URI;

  if (!CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: "Secret not found" }), {
      status: 500,
    });
  }

  const params = new URLSearchParams();
  params.append("X-Api-Version", "11");
  params.append("response_type", "code");
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);
  params.append("redirect_uri", CLIENT_REDIRECT_URI);
  params.append("scope", "model_read"); // 必要最小限に絞る
  params.append("grant_type", "client_credentials");

  try {
    const res = await fetch("https://hub.vroid.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json", // これも念のため追加
      },
      body: params,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("VRoid Hub Error:", data);
      return new Response(JSON.stringify(data), { status: res.status });
    }

    // 成功すればここで access_token が取れるはず
    return new Response(JSON.stringify(data));
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
    });
  }
};
