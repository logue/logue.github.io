import { onMounted, onUnmounted, type Ref } from 'vue';

import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';

/**
 * Three.js シーン・カメラ・レンダラー・アニメーションループ・リサイズ対応
 * @param canvasRef 対象のcanvasタグ
 * @param pivot 回転の中心となるオブジェクト
 * @param getVrm VRMモデルを取得する関数
 * @param getMixer アニメーションミキサーを取得する関数
 */
export function useThreeScene(
  canvasRef: Ref<HTMLCanvasElement | null>,
  pivot: THREE.Object3D,
  getVrm: () => VRM | null,
  getMixer: () => THREE.AnimationMixer | null
) {
  /* Three.jsのシーン、カメラ、レンダラー、アニメーションループ、リサイズ対応をセットアップするComposable関数 */
  let renderer: THREE.WebGLRenderer;
  /** フレームID */
  let frameId: number;
  /** 前回のフレーム時間 */
  let prevTime = performance.now();
  /** カメラ */
  let camera: THREE.PerspectiveCamera;

  /** ウィンドウリサイズ時 */
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
  };

  onMounted(() => {
    if (!canvasRef.value) return;

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20);
    camera.position.set(0, 0.9, 5);
    camera.lookAt(0, 0.9, 0);

    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    scene.add(pivot);

    const update = () => {
      frameId = requestAnimationFrame(update);
      const now = performance.now();
      const delta = (now - prevTime) / 1000;
      prevTime = now;
      getMixer()?.update(delta);
      getVrm()?.update(delta);
      renderer.render(scene, camera);
    };
    update();

    window.addEventListener('resize', onResize);
  });

  onUnmounted(() => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    renderer?.dispose();
  });
}
