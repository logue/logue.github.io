<template>
  <div class="scanline-overlay position-fixed overflow-hidden top-0 left-0 z-2 w-100 h-100"></div>
  <!-- 走査線オーバーレイ --IGNORE -->
  <!-- 背景に走査線のような効果を重ねることで、古いディスプレイの雰囲気を再現している。 --IGNORE -->
  <!-- 走査線はCSSの線形グラデーションを使って作成されており、半透明の黒い線が一定の間隔で繰り返される。 --IGNORE -->
  <!-- pointer-events: none; を指定することで、走査線レイヤーがクリックなどのユーザーインタラクションを妨げないようにしている。 --IGNORE -->
</template>

<style scoped>
.scanline-overlay {
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%);
  background-size: 100% 4px;
  pointer-events: none;
}
</style>
