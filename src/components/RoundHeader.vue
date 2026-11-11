<script setup lang="ts">
import { computed } from 'vue'
import logoUrl from '../assets/logo.webp'
import { useGameStore } from '../stores/game'
import PlayerAvatar from './PlayerAvatar.vue'

const store = useGameStore()

const pct = computed(() => Math.min(100, Math.round((store.topScore / store.targetScore) * 100)))
</script>

<template>
  <header class="sign round-header">
    <div class="sign-top">
      <div class="sign-title">
        <span class="num">Round {{ store.roundNumber }}</span>
        <span class="goal">first to {{ store.targetScore }}</span>
      </div>
      <img class="logo-mini" :src="logoUrl" width="760" height="385" alt="Flip 7 Scoreboard" />
    </div>

    <ul class="tags">
      <li v-if="store.starter" class="tag">
        <span class="tag-label">Starts</span>
        <PlayerAvatar :avatar="store.starter.avatar" size="xs" />
        <b>{{ store.starter.name }}</b>
      </li>
      <li v-if="store.leader" class="tag tag-lead">
        <span class="tag-label">Leader</span>
        <PlayerAvatar :avatar="store.leader.avatar" size="xs" />
        <b>{{ store.leader.name }}</b>
      </li>
    </ul>

    <div
      class="meter"
      role="progressbar"
      :aria-valuenow="store.topScore"
      :aria-valuemin="0"
      :aria-valuemax="store.targetScore"
      aria-label="Leader's progress toward the target score"
    >
      <span :style="{ width: pct + '%' }" />
    </div>
    <p class="meter-label">{{ store.topScore }} of {{ store.targetScore }} points</p>
  </header>
</template>
