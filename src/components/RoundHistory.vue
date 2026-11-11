<script setup lang="ts">
import { calculateScore } from '../utils/scoring'
import { useGameStore } from '../stores/game'
import PlayerAvatar from './PlayerAvatar.vue'

const store = useGameStore()
const emit = defineEmits<{ edit: [round: number, playerId: string] }>()

function label(roundNum: number, playerId: string) {
  const entry = store.rounds.find((r) => r.number === roundNum)?.entries[playerId]
  if (!entry) return '–'
  if (entry.busted) return '0 ✗'
  return calculateScore(entry).flip7 ? `${entry.score} ★` : String(entry.score)
}
</script>

<template>
  <section class="stack" aria-label="Round history">
    <p v-if="store.rounds.length === 0" class="card muted">No rounds finished yet. Scores will show up here.</p>
    <template v-else>
      <p class="muted small">Tap a score to fix it. ✗ means busted, ★ means Flip 7.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Player</th>
              <th v-for="r in store.rounds" :key="r.number" scope="col">R{{ r.number }}</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in store.players" :key="p.id">
              <th scope="row">
                <span class="who"><PlayerAvatar :avatar="p.avatar" size="xs" />{{ p.name }}</span>
              </th>
              <td v-for="r in store.rounds" :key="r.number">
                <button
                  type="button"
                  class="cell-btn"
                  :aria-label="`Edit ${p.name}, round ${r.number}`"
                  @click="emit('edit', r.number, p.id)"
                >
                  {{ label(r.number, p.id) }}
                </button>
              </td>
              <td class="grand">{{ store.totals[p.id] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
