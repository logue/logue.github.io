import { unzipSync } from 'fflate';

export const useMotionLoader = () => {
  /**
   * ZIPファイルから特定のモーションファイルを取り出す
   * @param url zipファイルのアドレス
   * @param targetFileName 取り出したいファイルの名前
   * @returns ArrayBufferとして返す
   */
  const decompressMotion = async (url: string, targetFileName: string): Promise<ArrayBuffer> => {
    console.log(`Fetching and decompressing motion from ${url}...`);
    // Cloudflare Functions プロキシ経由で取得（ブラウザからの直接アクセスは CORS で制限）
    const res = await fetch(`/api/assets?file=${encodeURIComponent(url)}`);
    const arrayBuffer = await res.arrayBuffer();

    // ZIPを展開
    const unzipped = unzipSync(new Uint8Array(arrayBuffer));

    // Object Injection 対策: hasOwn で存在確認してからアクセス
    if (!Object.hasOwn(unzipped, targetFileName)) {
      throw new Error(`File ${targetFileName} not found in ZIP`);
    }
    // eslint-disable-next-line security/detect-object-injection
    const motionData: Uint8Array | undefined = unzipped[targetFileName];
    if (!motionData) throw new Error(`File ${targetFileName} not found in ZIP`);

    // slice() でコピーを作り SharedArrayBuffer ではない純粋な ArrayBuffer を得る
    return motionData.slice().buffer;
  };

  return { decompressMotion };
};
