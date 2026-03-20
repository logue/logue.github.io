<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';

import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';
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
let currentVrm: VRM | null = null;
let camera: THREE.PerspectiveCamera;
const pivot = new THREE.Object3D();

// --- Drag rotation ---
let isDragging = false;
let prevClientX = 0;

function onPointerDown(e: PointerEvent) {
  isDragging = true;
  prevClientX = e.clientX;
}
function onPointerMove(e: PointerEvent) {
  if (!isDragging) return;
  const dx = e.clientX - prevClientX;
  prevClientX = e.clientX;
  pivot.rotation.y += dx * 0.01;
}
function onPointerUp() {
  isDragging = false;
}

onMounted(async () => {
  if (!canvasRef.value) return;

  // --- Scene Setup ---
  const scene = new THREE.Scene();
  clock = new THREE.Clock();
  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20);
  // カメラは、VRMモデルの全身が見えるように、やや高い位置から斜めに見下ろす感じで配置する。
  camera.position.set(0, 0.9, 5.0);
  // カメラの向きは、VRMモデルの中心を見つめるように設定する。
  camera.lookAt(0, 0.9, 0);

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
    currentVrm?.update(delta);
    renderer.render(scene, camera);
  };
  update();

  window.addEventListener('resize', onResize);
  canvasRef.value!.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  scene.add(pivot);

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
      pivot.add(vrm.scene);
      currentVrm = vrm;

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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
};

onUnmounted(() => {
  cancelAnimationFrame(frameId);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  renderer?.dispose();
});

// VRMロード後のメイン処理
const setupVrmAnimation = async (vrm: VRM, loader: GLTFLoader) => {
  console.log('Setting up VRM animation...');
  // 1. composable を使い、ZIP内の特定のVRMAファイルを ArrayBuffer として取得
  const vrmaBuffer = await decompressMotion(
    'VRMA_MotionPack.zip',
    'VRMA_MotionPack/vrma/VRMA_01.vrma'
  );

  // 2. ArrayBuffer を Blob URL に変換して GLTFLoader に食わせる
  // (VRMAは内部的にGLB形式なので GLTFLoader でパース可能です)
  const vrmaBlob = new Blob([vrmaBuffer], { type: 'application/octet-stream' });
  const vrmaUrl = URL.createObjectURL(vrmaBlob);

  // 3. VRMAファイルをパース
  const vrmaGltf = await loader.loadAsync(vrmaUrl);
  console.log('VRMA loaded and parsed:', vrmaGltf);

  // 4. VRMAnimation インスタンスから AnimationClip を作成
  const vrmAnimations = vrmaGltf.userData.vrmAnimations;
  if (vrmAnimations && vrmAnimations.length > 0) {
    const clip = createVRMAnimationClip(vrmAnimations[0], vrm);

    // 5. Mixerを作成して再生
    const mixer = new THREE.AnimationMixer(vrm.scene);
    const action = mixer.clipAction(clip);
    action.play();

    // メモリ解放
    URL.revokeObjectURL(vrmaUrl);

    return mixer; // updateループで使うために返す
  }
};
</script>

<template>
  <div v-if="isLoading" class="d-flex justify-content-center align-items-center flex-column h-50">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <div class="mt-3 small opacity-75">
      SYS_INITIALIZING...
      <br />
      ACCESSING_VROID_HUB...
    </div>
  </div>
  <canvas
    ref="canvasRef"
    class="position-fixed top-0 start-0 z-3"
    :class="{ 'd-none': isLoading }"
  ></canvas>
  <!-- VRMモデルを表示するためのキャンバス --IGNORE -->
  <!-- ローディング中は、Bootstrapのスピナーとテキストで状態を表示する。 --- IGNORE -->
  <!-- ローディングが完了すると、キャンバスが表示され、VRMモデルがレンダリングされる。 --- IGNORE -->
</template>
