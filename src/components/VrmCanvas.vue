<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';

import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader, type GLTFParser, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

import { useMotionLoader } from '@/composables/useMotionLoader';

const { decompressMotion } = useMotionLoader();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(true);

const props = withDefaults(defineProps<{ api?: string }>(), {
  api: '/api/vrm'
});
let renderer: THREE.WebGLRenderer;
let frameId: number;
let mixer: THREE.AnimationMixer | null = null;
let clock: THREE.Clock;

onMounted(async () => {
  if (!canvasRef.value) return;

  // --- Scene Setup ---
  const scene = new THREE.Scene();
  clock = new THREE.Clock();
  const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20);
  camera.position.set(0, 1.4, 3.5);

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // --- Lighting (#212529 の影を活かす) ---
  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  // --- Animation Loop (VRMロードより先に開始) ---
  const update = () => {
    frameId = requestAnimationFrame(update);
    const delta = clock.getDelta();
    mixer?.update(delta);
    renderer.render(scene, camera);
  };
  update();

  window.addEventListener('resize', onResize);

  // 1. Cloudflare Functions から URL を取得
  let url: string;
  try {
    const res = await fetch(props.api);
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

  // 2. VRM ロード
  const loader = new GLTFLoader();
  loader.register((parser: GLTFParser) => new VRMLoaderPlugin(parser));
  loader.register((parser: GLTFParser) => new VRMAnimationLoaderPlugin(parser));

  loader.load(
    url,
    (gltf: GLTF) => {
      const vrm: VRM = gltf.userData.vrm;
      if (!vrm) {
        console.error('VRM not found in gltf.userData.vrm');
        return;
      }
      scene.add(vrm.scene);

      setupVrmAnimation(vrm, loader)
        .then(m => {
          mixer = m ?? null;
        })
        .catch(console.error);
      isLoading.value = false;
      console.log('ELF_LOADED');
    },
    (progress: any) =>
      console.log(`Loading VRM: ${Math.round((progress.loaded / progress.total) * 100)}%`),
    (error: any) => console.error('GLTFLoader error:', error)
  );
});

const onResize = () => {
  // renderer と camera のアスペクト比を更新
};

onUnmounted(() => {
  cancelAnimationFrame(frameId);
  window.removeEventListener('resize', onResize);
  renderer?.dispose();
});

// VRMロード後のメイン処理
const setupVrmAnimation = async (vrm: VRM, loader: GLTFLoader) => {
  try {
    // 1. composable を使い、ZIP内の特定のVRMAファイルを ArrayBuffer として取得
    const vrmaBuffer = await decompressMotion('VRMA_MotionPack.zip', 'vrma/VRMA_01.vrma');

    // 2. ArrayBuffer を Blob URL に変換して GLTFLoader に食わせる
    // (VRMAは内部的にGLB形式なので GLTFLoader でパース可能です)
    const vrmaBlob = new Blob([vrmaBuffer], { type: 'application/octet-stream' });
    const vrmaUrl = URL.createObjectURL(vrmaBlob);

    // 3. VRMAファイルをパース
    const vrmaGltf = await loader.loadAsync(vrmaUrl);

    // 4. VRMAnimation インスタンスから AnimationClip を作成
    const vrmAnimations = vrmaGltf.userData.vrmAnimations;
    if (vrmAnimations && vrmAnimations.length > 0) {
      const clip = vrmAnimations[0].createAnimationClip(vrm);

      // 5. Mixerを作成して再生
      const mixer = new THREE.AnimationMixer(vrm.scene);
      const action = mixer.clipAction(clip);
      action.play();

      // メモリ解放
      URL.revokeObjectURL(vrmaUrl);

      return mixer; // updateループで使うために返す
    }
  } catch (error) {
    console.error('Failed to load VRMA:', error);
  }
};
</script>

<template>
  <div class="vrm-stage position-relative w-100 h-100">
    <canvas ref="canvasRef" class="position-fixed top-0 left-0 w-100 h-100 vrm-canvas"></canvas>
    <div
      v-if="isLoading"
      class="loading-overlay d-flex flex-column align-items-center justify-content-center position-fixed top-0 start-0 w-100 h-100"
    >
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="mt-3 text-monospace small opacity-75">
        SYS_INITIALIZING...
        <br />
        ACCESSING_VROID_HUB...
      </div>
    </div>
  </div>
</template>

<style scoped>
.vrm-canvas {
  z-index: -1; /* 背景として配置 */
  /* pointer-events: none; */ /* 後でインタラクションを追加するかも */
}
</style>
