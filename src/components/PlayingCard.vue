<script setup lang="ts">
import type { CardColor } from '../utils/cardColors'

defineProps<{
  /** Text printed on the card: the big numeral and both corner indices. */
  label: string
  /** What a screen reader announces. */
  cardName: string
  /** Face-up in the player's hand. The card flips over and the colors invert. */
  on: boolean
  color: CardColor
  kind?: 'number' | 'modifier'
  disabled?: boolean
}>()

defineEmits<{ toggle: [] }>()

const sides = ['front', 'back'] as const
</script>

<template>
  <button
    type="button"
    class="pcard"
    :class="{ on, mod: kind === 'modifier' }"
    :style="{ '--h': color[0], '--s': color[1] + '%', '--l': color[2] + '%' }"
    :aria-label="cardName"
    :aria-pressed="on"
    :disabled="disabled"
    @click="$emit('toggle')"
  >
    <span class="pcard-inner">
      <span v-for="side in sides" :key="side" class="face" :class="side" aria-hidden="true">
        <span class="corner tl">{{ label }}</span>
        <span class="big">{{ label }}</span>
        <span class="corner br">{{ label }}</span>
      </span>
    </span>
  </button>
</template>
