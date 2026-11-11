<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '../stores/game'
import { calculateScore, type Entry } from '../utils/scoring'
import PlayerAvatar from './PlayerAvatar.vue'

const props = defineProps<{
  player: Player
  entry?: Entry
  total: number
  isStarter: boolean
}>()

defineEmits<{ open: [] }>()

const flip7 = computed(() => (props.entry ? calculateScore(props.entry).flip7 : false))

const summary = computed(() => {
  const e = props.entry
  if (!e) return 'Tap to enter cards'
  if (e.busted) return 'Drew a duplicate'
  const nums = e.numbers.length ? e.numbers.join(', ') : 'no numbers'
  const mods = e.modifiers.map((m) => (m === 'x2' ? '×2' : m)).join(' ')
  return mods ? `${nums} · ${mods}` : nums
})
</script>

<template>
  <button
    type="button"
    class="player-row"
    :class="{ done: entry && !entry.busted, bust: entry?.busted }"
    :aria-label="`${player.name}: ${entry ? (entry.busted ? 'busted' : entry.score + ' points') : 'not entered'}. Open card picker`"
    @click="$emit('open')"
  >
    <PlayerAvatar :avatar="player.avatar" />
    <div class="pr-main">
      <div class="player-name">
        {{ player.name }}
        <span v-if="isStarter" class="badge">Starts</span>
      </div>
      <div class="player-sub">{{ summary }} · total {{ total }}</div>
    </div>
    <div class="player-status">
      <span v-if="!entry" class="status-empty">Not entered</span>
      <span v-else-if="entry.busted" class="badge badge-bust">Busted</span>
      <template v-else>
        <div class="pts">+{{ entry.score }}</div>
        <span v-if="flip7" class="badge badge-flip">★ Flip 7!</span>
      </template>
    </div>
  </button>
</template>
