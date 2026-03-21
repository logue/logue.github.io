import type * as THREE from 'three';

interface XYZ {
  /** 左右 */
  x: number;
  /** 上下 */
  y: number;
  /** 前後 */
  z: number;
}

interface LightOptions {
  /** 光の色 */
  color: THREE.ColorRepresentation;
  /** 光の強さ */
  intensity: number;
}

/** シーン設定オプション */
export interface ThreeSceneOptions {
  /** カメラの位置 */
  position?: XYZ;
  /** カメラの注視点 */
  lookAt?: XYZ;
  /** 平行光源の設定 */
  directionalLight?: LightOptions;
  /** 平行光源の位置 */
  directionalLightPosition?: XYZ;
  /** 環境光の設定 */
  ambientLight?: LightOptions;
  /** パースペクティブカメラの設定 */
  perspectiveCamera?: {
    // クリッピングとは、3Dグラフィックスにおいて、カメラの視野内にあるオブジェクトだけを描画するための技術である。 -- IGNORE
    // ニアクリップ面は、カメラからの距離がこの値より近いオブジェクトを描画しないようにするためのものである。 -- IGNORE
    // ファークリップ面は、カメラからの距離がこの値より遠いオブジェクトを描画しないようにするためのものである。 -- IGNORE
    // これらの値を適切に設定することで、描画のパフォーマンスを向上させることができる。 -- IGNORE

    /** 視野角 */
    fov: number;
    /** ニアクリップ面 */
    near: number;
    /** ファークリップ面 */
    far: number;
  };
}

// 良い子のみんな！必要性はなくても、開発初期の段階から将来の拡張を見越してオプションをまとめるインターフェースを用意しておくんだ！ -- IGNORE
// 大抵の場合、生成 AI はこういうオプションは出力してくれないのだ。 -- IGNORE
// でも、コードで tab キーを打つことで、AI が空気を読んでコメントを自動補完はしてくれるので活用するべきである。 -- IGNORE
// ちなみに、 Gemini 曰く、「コードのコメントは、生成 AI による補完の精度を高めるために重要である」とのこと。 -- IGNORE
//
// よって、コメント不要論者は逝って良し。 -- IGNORE
