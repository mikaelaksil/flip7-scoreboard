<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { DEFAULT_TARGET, MAX_PLAYERS, MIN_PLAYERS } from '../stores/game'
import { AVATARS, avatarForSeat } from '../utils/avatars'
import PlayerAvatar from './PlayerAvatar.vue'

const props = defineProps<{
  /** Pre-fills the form for a returning player. */
  initial?: { names: string[]; avatars: string[]; target: number }
}>()

const emit = defineEmits<{
  start: [payload: { names: string[]; target: number; avatars: string[] }]
}>()

let nextId = 0
const makeSlot = (avatar: string) => ({ id: nextId++, name: '', avatar })

const slots = ref(
  props.initial && props.initial.names.length >= MIN_PLAYERS
    ? props.initial.names.map((name, i) => ({
        id: nextId++,
        name,
        avatar: props.initial!.avatars[i] ?? avatarForSeat(i),
      }))
    : Array.from({ length: MIN_PLAYERS }, (_, i) => makeSlot(avatarForSeat(i))),
)
const target = ref(props.initial?.target ?? DEFAULT_TARGET)

const trimmed = computed(() => slots.value.map((s) => s.name.trim()))

const duplicateNames = computed(() => {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const n of trimmed.value) {
    if (!n) continue
    const key = n.toLowerCase()
    if (seen.has(key)) dupes.add(key)
    seen.add(key)
  }
  return dupes
})

const errors = computed(() => {
  const list: string[] = []
  if (trimmed.value.some((n) => !n)) list.push('Every player needs a name.')
  if (duplicateNames.value.size) list.push('Player names must be unique.')
  if (!Number.isFinite(target.value) || target.value < 1) list.push('Target score must be at least 1.')
  return list
})

const valid = computed(() => slots.value.length >= MIN_PLAYERS && errors.value.length === 0)

function add() {
  if (slots.value.length >= MAX_PLAYERS) return
  const free = AVATARS.find((a) => !slots.value.some((s) => s.avatar === a)) ?? AVATARS[0]
  slots.value.push(makeSlot(free))
}

function remove(i: number) {
  if (slots.value.length <= MIN_PLAYERS) return
  slots.value.splice(i, 1)
}

/** Switch a player to the next icon color nobody else at the table has. */
function cycleAvatar(i: number) {
  const current = AVATARS.indexOf(slots.value[i]!.avatar as (typeof AVATARS)[number])
  for (let k = 1; k <= AVATARS.length; k++) {
    const candidate = AVATARS[(current + k) % AVATARS.length]!
    if (!slots.value.some((s, j) => j !== i && s.avatar === candidate)) {
      slots.value[i]!.avatar = candidate
      return
    }
  }
}

// ---- drag and drop reordering (pointer events: mouse, touch and pen) ----

const listEl = ref<{ $el: HTMLElement } | null>(null)
const dragId = ref<number | null>(null)

function reorder(from: number, to: number) {
  if (from === to) return
  const [item] = slots.value.splice(from, 1)
  slots.value.splice(to, 0, item!)
}

function startDrag(e: PointerEvent, id: number) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  dragId.value = id
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
}

function onMove(e: PointerEvent) {
  const el = listEl.value?.$el
  if (dragId.value === null || !el) return

  // Keep the list in view while dragging near the top or bottom of the screen.
  const edge = 70
  if (e.clientY < edge) window.scrollBy(0, -14)
  else if (e.clientY > window.innerHeight - edge) window.scrollBy(0, 14)

  const rows = Array.from(el.children) as HTMLElement[]
  if (!rows.length) return
  // Layout positions (offsetTop) ignore the rows' move animation, so the target does not flicker.
  const y = e.clientY - el.getBoundingClientRect().top
  const last = rows[rows.length - 1]!
  let to = rows.findIndex((r) => y >= r.offsetTop && y <= r.offsetTop + r.offsetHeight)
  if (to === -1) {
    if (y < rows[0]!.offsetTop) to = 0
    else if (y > last.offsetTop + last.offsetHeight) to = rows.length - 1
    else return // pointer is in the gap between two rows
  }
  reorder(
    slots.value.findIndex((s) => s.id === dragId.value),
    to,
  )
}

function endDrag() {
  dragId.value = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
}

/** Keyboard alternative: arrow keys on the focused handle move the player. */
async function moveBy(i: number, delta: number) {
  const j = i + delta
  if (j < 0 || j >= slots.value.length) return
  const id = slots.value[i]!.id
  reorder(i, j)
  await nextTick()
  listEl.value?.$el.querySelector<HTMLElement>(`[data-handle="${id}"]`)?.focus()
}

onBeforeUnmount(endDrag)

function submit() {
  if (!valid.value) return
  emit('start', {
    names: trimmed.value,
    target: Math.floor(target.value),
    avatars: slots.value.map((s) => s.avatar),
  })
}
</script>

<template>
  <form class="stack" novalidate @submit.prevent="submit">
    <div class="card stack">
      <div class="row-between wrap">
        <h2>Who's playing?</h2>
        <span class="muted small">{{ slots.length }} of {{ MAX_PLAYERS }}</span>
      </div>
      <p class="muted small">Tap the icon to change its color. Drag the dots to change the order; the first player starts round 1.</p>

      <TransitionGroup ref="listEl" name="shuffle" tag="div" class="slot-list" :class="{ 'is-dragging': dragId !== null }">
        <div v-for="(slot, i) in slots" :key="slot.id" class="setup-player" :class="{ dragging: dragId === slot.id }">
          <span class="seat" aria-hidden="true">{{ i + 1 }}</span>
          <button type="button" class="avatar-btn" :aria-label="`Change color for player ${i + 1}`" @click="cycleAvatar(i)">
            <PlayerAvatar :avatar="slot.avatar" />
          </button>
          <input
            v-model="slot.name"
            type="text"
            maxlength="24"
            autocomplete="off"
            :placeholder="`Player ${i + 1}`"
            :aria-label="`Name of player ${i + 1}`"
            :aria-invalid="duplicateNames.has(slot.name.trim().toLowerCase()) && !!slot.name.trim()"
          />
          <button
            type="button"
            class="drag-handle"
            :data-handle="slot.id"
            :aria-label="`Reorder player ${i + 1}. Drag, or use the up and down arrow keys.`"
            @pointerdown.prevent="startDrag($event, slot.id)"
            @keydown.up.prevent="moveBy(i, -1)"
            @keydown.down.prevent="moveBy(i, 1)"
          >
            <span class="grip" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-icon btn-danger"
            :disabled="slots.length <= MIN_PLAYERS"
            :aria-label="`Remove player ${i + 1}`"
            @click="remove(i)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>

      <button type="button" class="btn" :disabled="slots.length >= MAX_PLAYERS" @click="add">+ Add a player</button>
    </div>

    <div class="card stack">
      <label class="field">
        Target score
        <input v-model.number="target" type="number" inputmode="numeric" min="1" step="10" />
      </label>
    </div>

    <p v-for="e in errors" :key="e" class="error" role="alert">{{ e }}</p>

    <button type="submit" class="btn btn-primary btn-block" :disabled="!valid">Start game</button>
  </form>
</template>
