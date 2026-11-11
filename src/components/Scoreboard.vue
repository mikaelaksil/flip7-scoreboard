<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'
import PlayerAvatar from './PlayerAvatar.vue'

const store = useGameStore()

const rows = computed(() =>
  store.ranking.map((p) => {
    const total = store.totals[p.id] ?? 0
    // Competition ranking: tied players share a rank.
    const rank = store.ranking.filter((o) => (store.totals[o.id] ?? 0) > total).length + 1
    return {
      player: p,
      total,
      rank,
      pct: Math.min(100, Math.round((total / store.targetScore) * 100)),
      lead: store.rounds.length > 0 && total === store.topScore,
    }
  }),
)
</script>

<template>
  <section class="card" aria-label="Scoreboard">
    <ol class="score-list">
      <li v-for="r in rows" :key="r.player.id" class="score-row" :class="{ lead: r.lead }">
        <span class="rank" :aria-label="`Rank ${r.rank}`">{{ r.rank }}</span>
        <PlayerAvatar :avatar="r.player.avatar" />
        <span class="player-name">{{ r.player.name }}</span>
        <span class="total">{{ r.total }}</span>
        <div
          class="meter"
          role="progressbar"
          :aria-valuenow="r.total"
          :aria-valuemin="0"
          :aria-valuemax="store.targetScore"
          :aria-label="`${r.player.name} progress`"
        >
          <span :style="{ width: r.pct + '%' }" />
        </div>
      </li>
    </ol>
  </section>
</template>
