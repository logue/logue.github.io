<script setup lang="ts">
import { onMounted } from 'vue';

import { Icon } from '@iconify/vue';
import { Tooltip } from 'bootstrap';

const links = [
  {
    name: 'Facebook',
    url: 'https://facebook.com/logue256',
    icon: 'fa:facebook'
  },
  {
    name: 'Instagram',
    url: 'https://instagram.com/logue256',
    icon: 'fa:instagram'
  },
  { name: 'X', url: 'https://x.com/logue256', icon: 'fa:twitter' },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/logue',
    icon: 'fa:linkedin'
  },
  { name: 'GitHub', url: 'https://github.com/logue', icon: 'fa:github' },
  { name: 'Tumblr', url: 'https://blog.logue.be/', icon: 'fa:tumblr' },
  {
    name: 'LINE',
    url: 'http://line.me/ti/p/Hd8erPz_55',
    icon: 'fa6-brands:line'
  },
  { name: 'Reddit', url: 'https://reddit.com/u/logue256', icon: 'fa:reddit' },
  {
    name: 'StackOverflow',
    url: 'https://ja.stackoverflow.com/users/5461/logue',
    icon: 'fa:stack-overflow'
  },
  { name: 'GitLab', url: 'https://gitlab.com/logue', icon: 'fa:gitlab' },
  { name: 'NPM', url: 'https://www.npmjs.com/~logue', icon: 'fa6-brands:npm' },
  {
    name: 'Crate.io',
    url: 'https://crates.io/users/logue',
    icon: 'fa6-brands:rust'
  },
  {
    name: 'Docker Hub',
    url: 'https://hub.docker.com/u/logue',
    icon: 'fa6-brands:docker'
  },
  {
    name: 'SoundCloud',
    url: 'https://soundcloud.com/logue256',
    icon: 'fa:soundcloud'
  },
  {
    name: 'Bandcamp',
    url: 'https://logue256.bandcamp.com/',
    icon: 'fa:bandcamp'
  },
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/user/logue256',
    icon: 'fa:spotify'
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/c/logue256',
    icon: 'fa:youtube'
  },
  { name: 'Twitch', url: 'https://twitch.tv/logue256', icon: 'fa:twitch' },
  {
    name: 'Steam',
    url: 'https://steamcommunity.com/id/logue256',
    icon: 'fa:steam'
  },
  {
    name: 'Xbox',
    url: 'https://account.xbox.com/ja-jp/Profile?Gamertag=Logue256',
    icon: 'fa6-brands:xbox'
  }
] satisfies { name: string; url: string; icon: string }[];

onMounted(() => {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(el => new Tooltip(el));
});
</script>

<template>
  <!-- eslint-disable vuejs-accessibility/anchor-has-content -->
  <nav aria-label="External Links" class="mt-5 container">
    <ul class="list-inline mb-0">
      <li v-for="(link, index) in links" :key="index" class="list-inline-item mx-2">
        <a
          :href="link.url"
          class="cyber-icon-link"
          :title="link.name"
          data-bs-toggle="tooltip"
          data-bs-placement="top"
          :data-bs-title="link.name"
        >
          <Icon :icon="link.icon" />
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.cyber-icon-link {
  font-size: 1.5rem;
  color: var(--bs-gray-100);
  opacity: 0.6;
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.cyber-icon-link:hover {
  opacity: 1;
  color: var(--hud-cyan);
  transform: translateY(-3px);
  filter: drop-shadow(0 0 8px var(--hud-cyan));
}

/* LinkedIn だけ赤を差す遊び心 */
.cyber-icon-link[title='LinkedIn']:hover {
  color: var(--arasaka-red);
  filter: drop-shadow(0 0 8px var(--arasaka-red));
}
</style>
