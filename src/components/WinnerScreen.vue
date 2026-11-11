<script setup lang="ts">
import PlayerAvatar from './PlayerAvatar.vue'

defineProps<{ name: string; avatar: string; score: number; rounds: number }>()

// Fixed confetti layout: pieces fall once or twice, then rest out of sight.
const pieces = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37 + 8) % 100,
  delay: (i % 7) * 0.18,
  duration: 2.2 + (i % 5) * 0.35,
  tone: i % 4,
  turn: i % 2 === 0 ? 1 : -1,
}))
</script>

<template>
  <section class="card winner" aria-live="polite">
    <div class="confetti" aria-hidden="true">
      <span
        v-for="(p, i) in pieces"
        :key="i"
        class="piece"
        :class="`tone-${p.tone}`"
        :style="{ left: p.left + '%', animationDelay: p.delay + 's', animationDuration: p.duration + 's', '--turn': p.turn }"
      />
    </div>
    <div class="winner-avatar">
      <svg class="crown" viewBox="0 0 48 32" aria-hidden="true">
        <path d="M4 28 2 8l12 10L24 4l10 14L46 8l-2 20z" />
      </svg>
      <PlayerAvatar :avatar="avatar" size="xl" />
    </div>
    <p class="muted">We have a winner</p>
    <p class="name">{{ name }}</p>
    <p class="muted">{{ score }} points after {{ rounds }} {{ rounds === 1 ? 'round' : 'rounds' }}</p>
  </section>
</template>
