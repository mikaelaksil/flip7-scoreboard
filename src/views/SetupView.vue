<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PlayerAvatar from '../components/PlayerAvatar.vue'
import PlayerSetupForm from '../components/PlayerSetupForm.vue'
import logoUrl from '../assets/logo.webp'
import { askConfirm } from '../composables/confirm'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const router = useRouter()

const last = computed(() => store.lastSetup)

/** First-timers go straight to the empty form; returning players get a short welcome first. */
const view = ref<'welcome' | 'form'>(store.lastSetup ? 'welcome' : 'form')

/** A game in progress is replaced when a new one starts, so ask before doing that. */
async function canReplaceGame(): Promise<boolean> {
  if (!store.started) return true
  return askConfirm('Start a new game? The game in progress will be replaced.', {
    confirmLabel: 'Start new game',
    danger: true,
  })
}

async function onStart(payload: { names: string[]; target: number; avatars: string[] }) {
  if (!(await canReplaceGame())) return
  store.startGame(payload.names, payload.target, payload.avatars)
  router.push({ name: 'game' })
}

/** Same players and target as last time. */
async function quickStart() {
  const l = last.value
  if (!l || !(await canReplaceGame())) return
  store.startGame(l.names, l.target, l.avatars)
  router.push({ name: 'game' })
}
</script>

<template>
  <div class="stack">
    <header class="hero">
      <div class="fan" aria-hidden="true">
        <span v-for="n in 5" :key="n" class="fan-card" :class="`fc-${n}`" />
      </div>
      <h1 class="hero-title">
        <img class="logo" :src="logoUrl" width="760" height="385" alt="Flip 7 Scoreboard" />
      </h1>
    </header>

    <Transition name="swap" mode="out-in">
    <div v-if="view === 'welcome' && last" key="welcome" class="stack">
      <p class="lede">Welcome back! Ready for another round of cards?</p>

      <div class="welcome-actions">
        <button v-if="store.started" type="button" class="btn btn-primary btn-big" @click="router.push({ name: 'game' })">
          Resume game
          <span class="btn-sub">Round {{ store.roundNumber }} · {{ store.players.length }} players</span>
        </button>

        <button type="button" class="btn btn-big" :class="{ 'btn-primary': !store.started }" @click="quickStart">
          Start a new game
          <span class="btn-sub">{{ last.names.join(', ') }} · first to {{ last.target }}</span>
        </button>

        <button type="button" class="btn btn-big" @click="view = 'form'">
          Settings
          <span class="btn-sub">Change the players or the target score</span>
        </button>
      </div>

      <div class="avatar-strip" aria-hidden="true">
        <PlayerAvatar v-for="(a, i) in last.avatars" :key="i" :avatar="a" size="sm" />
      </div>
    </div>

    <div v-else key="form" class="stack">
      <p class="lede muted">
        {{
          last
            ? 'Change who is playing or the target score, then start.'
            : 'Pick the cards each player is holding and the points add up on their own.'
        }}
      </p>
      <button v-if="last" type="button" class="btn btn-ghost back-link" @click="view = 'welcome'">← Back</button>
      <PlayerSetupForm :initial="last ?? undefined" @start="onStart" />
    </div>
    </Transition>
  </div>
</template>
