<script setup lang="ts">
import AreaFooter from './components/AreaFooter.vue';
import AreaHeader from './components/AreaHeader.vue';
import LayerElfCode from './components/LayerElfCode.vue';
import LayerGlitch from './components/LayerGlitch.vue';
import LayerScanline from './components/LayerScanline.vue';
</script>

<template>
  <LayerGlitch />
  <LayerElfCode />
  <LayerScanline />

  <div class="d-flex w-100 h-100 z-1 p-3 mx-auto flex-column">
    <AreaHeader />
    <main class="px-3 text-center">
      <RouterView />
    </main>
    <AreaFooter />
  </div>
</template>

<style lang="scss">
@import './styles/bootstrap';

.font-lubri {
  font-family: var(--font-lubri), sans-serif;
}
</style>
