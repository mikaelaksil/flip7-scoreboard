<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  FLIP7_SIZE,
  MODIFIERS,
  NUMBER_CARDS,
  calculateScore,
  type Hand,
  type Modifier,
} from '../utils/scoring'
import { modifierColor, numberColor } from '../utils/cardColors'
import PlayerAvatar from './PlayerAvatar.vue'
import PlayingCard from './PlayingCard.vue'

const props = defineProps<{
  playerName: string
  avatar: string
  contextLabel: string
  clearLabel: string
  initial?: Hand
}>()

const emit = defineEmits<{
  save: [hand: Hand]
  clear: []
  close: []
}>()

const numbers = ref<number[]>([...(props.initial?.numbers ?? [])])
const modifiers = ref<Modifier[]>([...(props.initial?.modifiers ?? [])])
const busted = ref(props.initial?.busted ?? false)

const hand = computed<Hand>(() => ({
  numbers: numbers.value,
  modifiers: modifiers.value,
  busted: busted.value,
}))
const result = computed(() => calculateScore(hand.value))
const full = computed(() => numbers.value.length >= FLIP7_SIZE)

function toggleNumber(n: number) {
  if (busted.value) return
  const i = numbers.value.indexOf(n)
  if (i >= 0) numbers.value.splice(i, 1)
  else if (!full.value) numbers.value.push(n)
}

function toggleModifier(m: Modifier) {
  if (busted.value) return
  const i = modifiers.value.indexOf(m)
  if (i >= 0) modifiers.value.splice(i, 1)
  else modifiers.value.push(m)
}

const modLabel = (m: Modifier) => (m === 'x2' ? '×2' : m)
const modAria = (m: Modifier) => (m === 'x2' ? 'Times two' : `Plus ${m.slice(1)}`)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" :aria-label="`Cards for ${playerName}`">
      <header class="sheet-head">
        <div class="sheet-who">
          <PlayerAvatar :avatar="avatar" />
          <div>
            <h2>{{ playerName }}</h2>
            <p class="muted small">{{ contextLabel }}</p>
          </div>
        </div>
        <button class="btn btn-ghost btn-icon" type="button" aria-label="Close without saving" @click="emit('close')">
          ✕
        </button>
      </header>

      <div class="preview" aria-live="polite">
        <PlayerAvatar :avatar="avatar" size="lg" />
        <div class="bubble">
          <div class="score-big" :class="{ bump: result.flip7 }">{{ result.total }}</div>
          <div class="score-detail">
            <span v-if="result.flip7" class="badge badge-flip">★ Flip 7! +15</span>
            <span v-if="busted" class="badge badge-bust">Busted</span>
            <span class="muted small">{{ result.breakdown }}</span>
          </div>
        </div>
      </div>

      <h3>Number cards <span class="muted">({{ numbers.length }} of {{ FLIP7_SIZE }})</span></h3>
      <div class="card-grid">
        <PlayingCard
          v-for="n in NUMBER_CARDS"
          :key="n"
          :label="String(n)"
          :card-name="`Number ${n}`"
          :color="numberColor(n)"
          :on="numbers.includes(n)"
          :disabled="busted || (full && !numbers.includes(n))"
          @toggle="toggleNumber(n)"
        />
      </div>
      <p class="hint">Tap a card to flip it into the hand. A duplicate number is a bust.</p>

      <h3>Bonus cards</h3>
      <div class="card-grid mods">
        <PlayingCard
          v-for="m in MODIFIERS"
          :key="m"
          kind="modifier"
          :label="modLabel(m)"
          :card-name="modAria(m)"
          :color="modifierColor(m)"
          :on="modifiers.includes(m)"
          :disabled="busted"
          @toggle="toggleModifier(m)"
        />
      </div>

      <button
        type="button"
        class="btn bust-toggle"
        :class="{ on: busted }"
        :aria-pressed="busted"
        @click="busted = !busted"
      >
        {{ busted ? '✓ Busted for 0 points (tap to undo)' : 'Mark as busted (drew a duplicate)' }}
      </button>

      <div class="sheet-actions">
        <button type="button" class="btn" @click="emit('clear')">{{ clearLabel }}</button>
        <button type="button" class="btn btn-primary" @click="emit('save', hand)">Save {{ result.total }} pts</button>
      </div>
    </section>
  </div>
</template>
