import { onMounted, onUnmounted, type Ref } from 'vue';

import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';

import type { ThreeSceneOptions } from '@/interfaces/ThreeSceneOptions';

/**
 * Three.js シーン・カメラ・レンダラー・アニメーションループ・リサイズ対応
 * @param canvasRef 対象のcanvasタグ
 * @param pivot 回転の中心となるオブジェクト
 * @param getVrm VRMモデルを取得する関数
 * @param getMixer アニメーションミキサーを取得する関数
 * @param options シーン設定オプション
 */
export function useThreeScene(
  canvasRef: Ref<HTMLCanvasElement | null>,
  pivot: THREE.Object3D,
  getVrm: () => VRM | null,
  getMixer: () => THREE.AnimationMixer | null,
  options: ThreeSceneOptions = {}
) {
  const {
    position = { x: 0, y: 0.5, z: 9 },
    lookAt = { x: 0, y: 0.9, z: 0 },
    directionalLight = { color: 0xffffff, intensity: 1 },
    directionalLightPosition = { x: 1, y: 1, z: 1 },
    ambientLight = { color: 0xffffff, intensity: 0.4 },
    perspectiveCamera = { fov: 30, near: 0.1, far: 20 }
    // 色の設定がめんどくさい。なんでこの API は、HEX で指定できないのか？ -- IGNORE
  } = options;
  /* Three.jsのシーン、カメラ、レンダラー、アニメーションループ、リサイズ対応をセットアップするComposable関数 */
  let renderer: THREE.WebGLRenderer;
  /** フレームID */
  let frameId: number;
  /** 前回のフレーム時間 */
  let prevTime = performance.now();
  /** カメラ */
  let camera: THREE.PerspectiveCamera;
  /** キャンバスサイズ監視 */
  let resizeObserver: ResizeObserver;

  // キャッシュとしての運用なのでconstではなくletで定義している。 -- IGNORE
  // あまり好きじゃないんだけどね・・・。 -- IGNORE

  /**
   * サイズ更新（canvas が表示状態になったときも呼ばれる）ハンドラ
   * @param width キャンバスの幅
   * @param height キャンバスの高さ
   */
  const applySize = (width: number, height: number) => {
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(window.devicePixelRatio);
  };

  onMounted(() => {
    if (!canvasRef.value) return;

    const canvas = canvasRef.value;
    // 初期サイズ（非表示時は 0 になるため window サイズをフォールバックに使う）
    const initW = canvas.clientWidth || window.innerWidth;
    const initH = canvas.clientHeight || window.innerHeight;

    // カメラの設定
    camera = new THREE.PerspectiveCamera(
      perspectiveCamera.fov,
      initW / initH,
      perspectiveCamera.near,
      perspectiveCamera.far
    );
    // 位置
    camera.position.set(position.x, position.y, position.z);
    // 注視点
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(initW, initH, false);
    renderer.setPixelRatio(window.devicePixelRatio);
    // 色空間の設定。これをしないと、VRMモデルの色が暗くなってしまう。 -- IGNORE
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    /** シーンの設定 */
    const scene = new THREE.Scene();
    // シーンとは、3D空間内のオブジェクトや光源、カメラなどを管理するコンテナのようなもの。 -- IGNORE

    /** 平行光源 */
    const light = new THREE.DirectionalLight(directionalLight.color, directionalLight.intensity);
    light.position
      .set(directionalLightPosition.x, directionalLightPosition.y, directionalLightPosition.z)
      .normalize();

    // documnt.appendChildrenみたいな感じで、シーンにオブジェクトを追加していく。 -- IGNORE
    scene.add(light);
    scene.add(new THREE.AmbientLight(ambientLight.color, ambientLight.intensity));

    scene.add(pivot);

    /** アニメーションループ */
    const update = () => {
      frameId = requestAnimationFrame(update);
      /** 現在時刻 */
      const now = performance.now();
      // performance.now() は結構精度が高いぞ。 -- IGNORE

      /** 前回からの差分時間 */
      const delta = (now - prevTime) / 1000;
      prevTime = now;

      /** アニメーションの更新 */
      getMixer()?.update(delta);
      getVrm()?.update(delta);
      renderer.render(scene, camera);
    };
    update();

    // d-none 解除や、ブラウザのリサイズなどで canvas が変化した時に正しいサイズへ追従するために ResizeObserver を使用する。 -- IGNORE
    resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      applySize(width, height);
    });
    // オブサーバーを登録する
    resizeObserver.observe(canvas);

    // 昔はsetTimeoutでリサイズをポーリングしていたが、ResizeObserverが広くサポートされるようになった今では、こちらの方が効率的である。 -- IGNORE
    // 他にもScrollObserverなどがある。便利な世の中になったもんだね。 -- IGNORE
  });

  onUnmounted(() => {
    // アンマウント時はリソースをクリーンアップする。 -- IGNORE
    cancelAnimationFrame(frameId);
    resizeObserver?.disconnect();
    renderer?.dispose();
  });
}

// こういう風にVRMの更新とアニメーションミキサーの更新を外部から呼び出せるようにしておくと、シーンのセットアップとアニメーションの管理が分離されて便利である。 -- IGNORE
// ちなみに、生成 AI はこういう細かい設計の話はしてくれないことが多いので、開発者が自分で考えて実装したり、生成AIに指示する必要がある。 -- IGNORE
// まぁ、再利用しやすい形にはしておいたけど、このプロジェクトでは VRM のアニメーションは一種類しか使わない予定なので、そこまで厳密に分ける必要もなかったかもしれない。 -- IGNORE
