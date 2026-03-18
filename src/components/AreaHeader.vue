<template>
  <header class="mb-auto">
    <div class="container">
      <h3 class="float-md-start mb-0 font-lubri">.ELF_LOADED</h3>
      <nav class="nav nav-masthead justify-content-center float-md-end">
        <a class="nav-link py-1 px-0 active" aria-current="page" href="#">HOME</a>
        <a class="nav-link py-1 px-0 ms-3" href="https://github.com/logue">GITHUB</a>
        <a class="nav-link py-1 px-0 ms-3" href="https://x.com/logue256">X_LOG</a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.nav-link {
  color: var(--hud-cyan);
  opacity: 0.5;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
  opacity: 1;
  color: var(--arasaka-red);
  text-shadow: 0 0 8px var(--arasaka-red);
}
</style>
