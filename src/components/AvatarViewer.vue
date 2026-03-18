<script setup lang="ts">
// AvatarViewer.vue - Client-side 3D Entity
import { onMounted, onUnmounted, ref } from 'vue';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const containerRef = ref<HTMLDivElement | null>(null);
let renderer: THREE.WebGLRenderer | null = null;
let animationId: number | null = null;

onMounted(() => {
  const container = containerRef.value;
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  // 1. Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 2;

  // 2. Renderer (透明背景)
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // 3. Lighting
  const ambientLight = new THREE.AmbientLight(0x00f3ff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // 4. Load Avatar
  const loader = new GLTFLoader();
  loader.load('/avatar.glb', gltf => {
    const model = gltf.scene;
    model.scale.set(1.5, 1.5, 1.5);
    scene.add(model);

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      model.rotation.y += 0.005;
      renderer?.render(scene, camera);
    };
    animate();
  });

  // 5. Resize Handling
  const onResize = () => {
    if (!container || !renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    if (animationId !== null) cancelAnimationFrame(animationId);
    renderer?.dispose();
  });
});
</script>

<template>
  <div ref="containerRef" class="avatar-container w-100 h-100"></div>
</template>

<style scoped>
.avatar-container {
  filter: drop-shadow(0 0 10px rgba(0, 243, 255, 0.5));
}
</style>
