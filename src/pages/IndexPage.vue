<script setup lang="ts">
import SocialLinks from '@/components/SocialLinks.vue';

const accomplishments = [
  { id: 'OSS', label: 'VUE-CODEMIRROR6', detail: '1.8M+ DL/YR' },
  { id: 'L10N', label: 'FIRESTORM_OFFICIAL', detail: 'JP_STAFF' },
  { id: 'ARCH', label: 'OUTCOME_DRIVEN', detail: 'TOP_DOWN' }
] satisfies { id: string; label: string; detail: string }[];
</script>

<template>
  <h1 class="display-1 mb-4 glitch-text font-lubri">LOGUE.DEV</h1>
  <p class="lead mb-5 opacity-75 tracking-tighter">
    EXPERIENCE-DRIVEN INVERSION:
    <br />
    REVERSE-ENGINEERING THE STACK TO MANIFEST THE IDEAL UX.
  </p>

  <div class="row g-4 text-start mt-5 border-top border-bottom border-secondary py-4">
    <div v-for="item in accomplishments" :key="item.id" class="col-md-4">
      <div class="p-2 border-start border-info border-2">
        <small class="d-block opacity-50 font-lubri">[{{ item.id }}]</small>
        <div class="fw-bold">{{ item.label }}</div>
        <div class="small opacity-75">{{ item.detail }}</div>
      </div>
    </div>
  </div>
  <SocialLinks />
</template>

<style scoped>
.glitch-text:hover {
  animation: glitch-anim 0.3s infinite;
  color: var(--arasaka-red);
  text-shadow:
    2px 0 var(--hud-cyan),
    -2px 0 var(--arasaka-red);
}

@keyframes glitch-anim {
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
  100% {
    transform: translate(0);
  }
}
</style>
