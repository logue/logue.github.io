import { type Ref } from 'vue';

import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader, type GLTFParser, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

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

  const { decompressMotion } = useMotionLoader();

  async function setupAnimation(loadedVrm: VRM, loader: GLTFLoader) {
    console.log('Setting up VRM animation...');
    const vrmaBuffer = await decompressMotion(
      'VRMA_MotionPack.zip',
      'VRMA_MotionPack/vrma/VRMA_01.vrma'
    );

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

    const loader = new GLTFLoader();
    loader.register((parser: GLTFParser) => new VRMLoaderPlugin(parser));
    loader.register((parser: GLTFParser) => new VRMAnimationLoaderPlugin(parser));

    loader.load(
      url,
      (gltf: GLTF) => {
        const loadedVrm: VRM = gltf.userData.vrm;
        if (!loadedVrm) {
          console.error('VRM not found in gltf.userData.vrm');
          return;
        }
        pivot.add(loadedVrm.scene);
        vrm.value = loadedVrm;

        setupAnimation(loadedVrm, loader)
          .then(m => {
            mixer.value = m ?? null;
          })
          .catch(console.error);

        isLoading.value = false;
        console.log('ELF_LOADED');
      },
      (progress: ProgressEvent) =>
        console.log(`Loading VRM: ${Math.round((progress.loaded / progress.total) * 100)}%`),
      (error: unknown) => console.error('GLTFLoader error:', error)
    );
  }

  return { vrm, mixer, load };
}
