<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';

import * as THREE from 'three';

import { useDragRotation } from '@/composables/useDragRotation';
import { useThreeScene } from '@/composables/useThreeScene';
import { useVrmLoader } from '@/composables/useVrmLoader';

const props = withDefaults(defineProps<{ api?: string }>(), {
  api: '/api/vrm'
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(true);
const pivot = new THREE.Object3D();

const { vrm, mixer, load } = useVrmLoader(props.api, pivot, isLoading);

useThreeScene(
  canvasRef,
  pivot,
  () => vrm.value,
  () => mixer.value
);
useDragRotation(canvasRef, pivot);

onMounted(() => {
  load();
});
</script>

<template>
  <div v-if="isLoading" class="d-flex justify-content-center align-items-center flex-column h-50">
    <div class="spinner-border" aria-hidden="true">
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
