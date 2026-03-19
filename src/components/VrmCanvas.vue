<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';

import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader, type GLTFParser, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(true);

const props = withDefaults(defineProps<{ api?: string }>(), {
  api: '/api/vrm'
});
let renderer: THREE.WebGLRenderer;
let frameId: number;

onMounted(async () => {
  if (!canvasRef.value) return;

  // --- Scene Setup ---
  const scene = new THREE.Scene();
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

  // 1. Cloudflare Functions から URL を取得
  const res = await fetch(props.api);
  if (!res.ok) {
    const body = await res.text();
    console.error('Failed to fetch VRM URL:', res.status, body);
    isLoading.value = false;
    return;
  }
  const { url } = await res.json();
  console.log('VRM_URL_RECEIVED:', url);

  // 2. VRM ロード
  const loader = new GLTFLoader();
  loader.register((parser: GLTFParser) => new VRMLoaderPlugin(parser));

  loader.load(
    url,
    (gltf: GLTF) => {
      const vrm: VRM = gltf.userData.vrm;
      scene.add(vrm.scene);
      vrm.scene.rotation.y = Math.PI; // 正面を向かせる

      // 起立ポーズで固定（必要ならここで腕の角度などを微調整）

      isLoading.value = false;
      console.log('ELF_LOADED');
    },
    (progress: any) =>
      console.log(`Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`),
    (error: any) => console.error(error)
  );

  // --- Animation Loop ---
  const update = () => {
    frameId = requestAnimationFrame(update);
    // ここで後に「音楽同期グリッチ」のロジックを追加
    renderer.render(scene, camera);
  };
  update();

  // リサイズ対応
  window.addEventListener('resize', onResize);
});

const onResize = () => {
  // renderer と camera のアスペクト比を更新
};

onUnmounted(() => {
  cancelAnimationFrame(frameId);
  window.removeEventListener('resize', onResize);
  renderer?.dispose();
});
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
