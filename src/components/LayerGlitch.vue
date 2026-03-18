<script setup lang="ts">
import bgsrc from '@/assets/bg.png';
</script>

<template>
  <div class="position-fixed top-0 left-0 w-100 h-100 bg-layer">
    <div
      class="glitch w-100 h-100"
      :style="`background-image: linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25)), url(${bgsrc});`"
    >
      <div class="channel r"></div>
      <div class="channel g"></div>
      <div class="channel b"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:math';

@function rand($min, $max) {
  @return math.random() * ($max - $min) + $min;
}

$animation-duration: 3s;
$glitch-duration: 20%;
$glitch-frequency: 10;
$glitch-interval: math.div($glitch-duration, $glitch-frequency);

@mixin rgb-shift($name) {
  @keyframes rgb-shift-#{$name} {
    @for $i from 0 to $glitch-frequency {
      #{$i * $glitch-interval} {
        transform: translate(#{rand(-2, 2) * 1%}, #{rand(-0.5, 0.5) * 1%});
      }
    }

    #{$glitch-duration},
    100% {
      transform: none;
    }
  }

  animation: rgb-shift-#{$name} $animation-duration steps(1, jump-end) infinite alternate both;
}

@mixin glitch($name) {
  @keyframes glitch-#{$name} {
    @for $i from 0 to $glitch-frequency {
      $left: 0%;
      $right: 100%;
      $top: rand(0, 90) * 1%;
      $bottom: $top + rand(1, 10) * 1%;

      #{$i * $glitch-interval} {
        clip-path: polygon($left $top, $right $top, $right $bottom, $left $bottom);
        transform: translate(#{rand(-8, 8) * 1%}, #{rand(-0.5, 0.5) * 1%});
      }
    }

    #{$glitch-duration},
    100% {
      clip-path: none;
      transform: none;
    }
  }

  animation: glitch-#{$name} $animation-duration linear infinite alternate both;
}

/* 背景グリッチ */
.bg-layer {
  z-index: -2;
}

.glitch {
  background-position: center;
  background-size: cover;
  position: relative;
  overflow: hidden;

  &::before,
  &::after,
  .channel {
    background: inherit;
    background-size: cover;
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  &::before {
    @include glitch(before);
    content: '';
  }

  &::after {
    @include glitch(after);
    content: '';
  }

  .channel {
    mix-blend-mode: screen;

    &::before {
      bottom: 0;
      content: '';
      display: block;
      mix-blend-mode: multiply;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
    }
  }

  .r {
    @include rgb-shift(r);

    &::before {
      background: #f00;
    }
  }

  .g {
    @include rgb-shift(g);

    &::before {
      background: #0f0;
    }
  }

  .b {
    @include rgb-shift(b);

    &::before {
      background: #00f;
    }
  }
}
</style>
