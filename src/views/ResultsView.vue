<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import RoundHistory from '../components/RoundHistory.vue'
import Scoreboard from '../components/Scoreboard.vue'
import WinnerScreen from '../components/WinnerScreen.vue'
import { askConfirm } from '../composables/confirm'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const router = useRouter()

function rematch() {
  store.rematch()
  router.push({ name: 'game' })
}

function newGame() {
  store.resetGame()
  router.push({ name: 'setup' })
}

async function undo() {
  if (await askConfirm('Undo the last round and go back to the game?', { confirmLabel: 'Undo round' })) {
    store.undoRound()
  }
}

// Undoing or correcting a round can remove the winner; go back to the game when that happens.
watch(
  () => store.isGameOver,
  (over) => {
    if (!over) router.replace({ name: 'game' })
  },
)
</script>

<template>
  <div v-if="store.winner" class="stack">
    <WinnerScreen
      :name="store.winner.name"
      :avatar="store.winner.avatar"
      :score="store.topScore"
      :rounds="store.rounds.length"
    />

    <h2>Final ranking</h2>
    <Scoreboard />

    <h2>Rounds</h2>
    <RoundHistory />

    <button type="button" class="btn btn-primary btn-block" @click="rematch">Rematch (same players)</button>
    <div class="row">
      <button type="button" class="btn grow" @click="undo">Undo last round</button>
      <button type="button" class="btn grow" @click="newGame">New game</button>
    </div>
  </div>
  <div v-else />
</template>
