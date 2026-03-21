import { type Ref } from 'vue';

import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader, type GLTFParser, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
// だから、なんでTypescriptの型定義がこういうところまでカバーしてないんだろうか。 -- IGNORE

import { useMotionLoader } from './useMotionLoader';

/**
 * VRM URLフェッチ・GLTFロード・VRMA アニメーションセットアップ
 * @param api APIエンドポイント（例: '/api/vrm'）からVRMモデルのURLを取得するための文字列
 * @param pivot VRMモデルを追加するためのThree.jsオブジェクト
 * @param isLoading ロード中かどうかを示すRef<boolean>
 * @returns VRMモデル、アニメーションミキサー、ロード関数を返すオブジェクト
 *  - vrm: ロードされたVRMモデル（初期値はnull）
 *  - mixer: VRMアニメーション用のAnimationMixer（初期値はnull）
 *  - load: VRMモデルをロードしてシーンに追加する非同期関数
 */
export function useVrmLoader(
  api: string,
  pivot: THREE.Object3D,
  isLoading: Ref<boolean>
): {
  vrm: { value: VRM | null };
  mixer: { value: THREE.AnimationMixer | null };
  load: () => Promise<void>;
} {
  const vrm: { value: VRM | null } = { value: null };
  const mixer: { value: THREE.AnimationMixer | null } = { value: null };

  // nullはあまり好きじゃないんだけど、VRMモデルはロード前は存在しないので、こうするしかない。 -- IGNORE
  // undefinedにするのもありだけど、Vueのリアクティブシステムとの相性を考えると、nullの方が扱いやすいと思う。 -- IGNORE

  const { decompressMotion } = useMotionLoader();

  /**
   * VRM にアニメーションをセットアップする関数
   * @param loadedVrm ロードされたVRMモデル
   * @param loader GLTFLoaderインスタンス
   * @returns アニメーションミキサー
   */
  async function setupAnimation(loadedVrm: VRM, loader: GLTFLoader) {
    console.log('Setting up VRM animation...');
    // VRMA モーションパックのロードとアニメーションミキサーのセットアップ
    // まず、VRMAの入ったZiopファイルを解凍してVRMAファイルを取り出す。 -- IGNORE
    const vrmaBuffer = await decompressMotion(
      'VRMA_MotionPack.zip',
      'VRMA_MotionPack/vrma/VRMA_01.vrma'
    );

    // VRMAファイルをBlobに変換してURLを作成し、GLTFLoaderでロードする。 -- IGNORE
    const vrmaBlob = new Blob([vrmaBuffer], { type: 'application/octet-stream' });
    const vrmaUrl = URL.createObjectURL(vrmaBlob);

    const vrmaGltf = await loader.loadAsync(vrmaUrl);
    console.log('VRMA loaded and parsed:', vrmaGltf);

    const vrmAnimations = vrmaGltf.userData.vrmAnimations;
    if (vrmAnimations && vrmAnimations.length > 0) {
      const clip = createVRMAnimationClip(vrmAnimations[0], loadedVrm);
      const animMixer = new THREE.AnimationMixer(loadedVrm.scene);
      animMixer.clipAction(clip).play();
      URL.revokeObjectURL(vrmaUrl);
      return animMixer;
    }
  }

  /**
   * VRMモデルをロードしてシーンに追加する関数
   * @returns
   */
  async function load() {
    let url: string;
    try {
      const res = await fetch(api);
      if (!res.ok) {
        const body = await res.text();
        console.error('Failed to fetch VRM URL:', res.status, body);
        isLoading.value = false;
        return;
      }
      const data: { url: string } = await res.json();
      url = data.url;
      console.log('VRM_URL_RECEIVED:', url);
    } catch (e) {
      console.error('fetch /api/vrm threw an exception:', e);
      isLoading.value = false;
      return;
    }

    // GLTFLoaderを使用してVRMモデルをロードする。 -- IGNORE
    const loader = new GLTFLoader();
    loader.register((parser: GLTFParser) => new VRMLoaderPlugin(parser));
    loader.register((parser: GLTFParser) => new VRMAnimationLoaderPlugin(parser));

    loader.load(
      url,
      (gltf: GLTF) => {
        // ロードが完了されたらコールバックが呼ばれるので、VRMモデルをシーンに追加してアニメーションをセットアップする。 -- IGNORE
        const loadedVrm: VRM = gltf.userData.vrm;
        // 知ってた？ VRM モデルは glTF のサブセットで、中身は JSON なんだぜ。 -- IGNORE
        // もっとも、画像などのバイナリデータ BSON ではなくどちらかというと DDS に近いが。 -- IGNORE
        if (!loadedVrm) {
          console.error('VRM not found in gltf.userData.vrm');
          return;
        }
        pivot.add(loadedVrm.scene);
        vrm.value = loadedVrm;

        // それにしても、この API はなんで async/await に対応してないんだろうか。 -- IGNORE

        setupAnimation(loadedVrm, loader)
          .then(m => {
            mixer.value = m ?? null;
          })
          .catch(console.error);

        isLoading.value = false;
        console.log('ELF_LOADED');
      },
      (progress: ProgressEvent) =>
        // ま、進捗APIはあるだけマシだと思うことにしよう。 -- IGNORE
        // 問題は、セキュリティの都合上、それをUIに反映させる仕組みがないことなんだよな。 -- IGNORE
        console.log(`Loading VRM: ${Math.round((progress.loaded / progress.total) * 100)}%`),
      (error: unknown) => console.error('GLTFLoader error:', error)
    );
  }

  return { vrm, mixer, load };
}

// 私は正直者なので、アニメーションファイルの秘密をすべて喋ってやろう。
// アニメーションの Zip ファイルは、https://vroid.booth.pm/items/5512385 からダウンロードした Zip ファイルをそのまま使用しているが、
// ライセンスの禁止事項に「本モーション、またはその改変作品を許可なく取り出せる状態で二次配布すること。」と明言されているので
// 直接ファイルをプロジェクトに含めるのではなく、 CloudFlare R2 で構築したアセットサーバーにアップロードして Worker を用いてそこからフェッチする形にしている。 -- IGNORE
// なお、Worker はブラウザのコンソールログに通信情報などが出ないので、上記ライセンスに抵触することなくファイルを呼び出せる。 -- IGNORE
// 仕組みとしては VRM モデルを Vroid Hub から取得する処理を、自前のアセットサーバーで行っているということ一緒。 -- IGNORE
// くわしくは、functions/assets/index.ts を見てほしい。 -- IGNORE
// 使い方？このソースコードを AI に読ませれば教えてくれるっしょ。「何を意図しているのか？」ってプロンプトに打ち込むぐらいのことはできるよな？ -- IGNORE
//
// ちなみに、生成 AI はこういうライセンスの話はしてくれないことが多いので、開発者が自分で考えて実装する必要がある。 -- IGNORE
// ライセンスは守ろうね。 -- IGNORE
