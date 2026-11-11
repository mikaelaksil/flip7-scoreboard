<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import CardPicker from '../components/CardPicker.vue'
import PlayerRow from '../components/PlayerRow.vue'
import RoundHeader from '../components/RoundHeader.vue'
import RoundHistory from '../components/RoundHistory.vue'
import Scoreboard from '../components/Scoreboard.vue'
import { askConfirm } from '../composables/confirm'
import { useGameStore } from '../stores/game'
import { emptyHand, type Hand } from '../utils/scoring'

const store = useGameStore()
const router = useRouter()

type Tab = 'round' | 'scores' | 'history'
const tab = ref<Tab>('round')
const tabs: { id: Tab; label: string }[] = [
  { id: 'round', label: 'Round' },
  { id: 'scores', label: 'Scores' },
  { id: 'history', label: 'History' },
]

/** What the card picker is editing: the live round, or a finished round being corrected. */
type Target = { kind: 'draft'; playerId: string } | { kind: 'round'; round: number; playerId: string }
const target = ref<Target | null>(null)

const targetPlayer = computed(() => store.players.find((p) => p.id === target.value?.playerId))

const initialHand = computed<Hand | undefined>(() => {
  const t = target.value
  if (!t) return undefined
  if (t.kind === 'draft') return store.draft[t.playerId]
  return store.rounds.find((r) => r.number === t.round)?.entries[t.playerId]
})

const contextLabel = computed(() =>
  target.value?.kind === 'round' ? `Correcting round ${target.value.round}` : `Round ${store.roundNumber}`,
)

function onSave(hand: Hand) {
  const t = target.value
  if (!t) return
  if (t.kind === 'draft') store.saveDraft(t.playerId, hand)
  else store.editRound(t.round, t.playerId, hand)
  target.value = null
}

function onClear() {
  const t = target.value
  if (!t) return
  if (t.kind === 'draft') store.clearDraft(t.playerId)
  else store.editRound(t.round, t.playerId, emptyHand())
  target.value = null
}

function endRound() {
  if (store.endRound()) {
    tab.value = 'round'
    window.scrollTo({ top: 0 })
  }
}

async function fillZeros() {
  const names = store.missingPlayers.map((p) => p.name).join(', ')
  if (await askConfirm(`Score 0 points for: ${names}?`, { confirmLabel: 'Score 0' })) store.fillMissingWithZero()
}

async function undo() {
  const hasDraft = Object.keys(store.draft).length > 0
  const msg = hasDraft
    ? `Undo round ${store.rounds.length}? Entries already made for the current round will be replaced.`
    : `Undo round ${store.rounds.length}? Its entries come back so you can correct them.`
  if ((await askConfirm(msg, { confirmLabel: 'Undo round' })) && store.undoRound()) tab.value = 'round'
}

async function quit() {
  if (await askConfirm('Quit this game? Scores will be lost.', { confirmLabel: 'Quit game', danger: true })) {
    store.resetGame()
    router.push({ name: 'setup' })
  }
}

// Any change that produces a winner (ending a round or correcting a past one) goes to the results.
watch(
  () => store.isGameOver,
  (over) => {
    if (over) router.push({ name: 'results' })
  },
  { immediate: true },
)
</script>

<template>
  <div class="stack">
    <RoundHeader />

    <p v-if="store.tieBreakNeeded" class="banner" role="status">
      Tied at the top with {{ store.topScore }}. Play another round to break the tie.
    </p>

    <div class="tabs" role="tablist" aria-label="Game sections">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        role="tab"
        class="tab"
        :aria-selected="tab === t.id"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <Transition name="swap" mode="out-in">
    <section v-if="tab === 'round'" key="round" class="stack" role="tabpanel" aria-label="Round entry">
      <PlayerRow
        v-for="p in store.players"
        :key="p.id"
        :player="p"
        :entry="store.draft[p.id]"
        :total="store.totals[p.id] ?? 0"
        :is-starter="store.starter?.id === p.id"
        @open="target = { kind: 'draft', playerId: p.id }"
      />

      <button
        v-if="!store.allEntered && Object.keys(store.draft).length > 0"
        type="button"
        class="btn btn-block"
        @click="fillZeros"
      >
        Score 0 for the {{ store.missingPlayers.length }} remaining
      </button>

      <button type="button" class="btn btn-primary btn-block" :disabled="!store.allEntered" @click="endRound">
        {{ store.allEntered ? `End round ${store.roundNumber}` : `Enter all ${store.players.length} players to end the round` }}
      </button>

      <div class="row">
        <button type="button" class="btn grow" :disabled="store.rounds.length === 0" @click="undo">Undo last round</button>
        <button type="button" class="btn btn-danger" @click="quit">Quit game</button>
      </div>
    </section>

    <Scoreboard v-else-if="tab === 'scores'" key="scores" role="tabpanel" />

    <RoundHistory
      v-else
      key="history"
      role="tabpanel"
      @edit="(round, playerId) => (target = { kind: 'round', round, playerId })"
    />
    </Transition>

    <Transition name="sheet">
    <CardPicker
      v-if="target && targetPlayer"
      :key="`${target.kind}-${target.playerId}-${target.kind === 'round' ? target.round : 'draft'}`"
      :player-name="targetPlayer.name"
      :avatar="targetPlayer.avatar"
      :context-label="contextLabel"
      :clear-label="target.kind === 'draft' ? 'Clear entry' : 'Set to 0'"
      :initial="initialHand"
      @save="onSave"
      @clear="onClear"
      @close="target = null"
    />
    </Transition>
  </div>
</template>
