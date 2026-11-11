<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { answerConfirm, confirmState } from '../composables/confirm'

const cancelBtn = ref<HTMLButtonElement | null>(null)

watch(
  () => confirmState.open,
  async (open) => {
    if (open) {
      await nextTick()
      cancelBtn.value?.focus()
    }
  },
)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && confirmState.open) answerConfirm(false)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="dialog">
  <div v-if="confirmState.open" class="backdrop dialog-backdrop" @click.self="answerConfirm(false)">
    <div class="dialog" role="alertdialog" aria-modal="true" aria-describedby="confirm-message">
      <p id="confirm-message">{{ confirmState.message }}</p>
      <div class="dialog-actions">
        <button ref="cancelBtn" type="button" class="btn" @click="answerConfirm(false)">Cancel</button>
        <button
          type="button"
          class="btn"
          :class="confirmState.danger ? 'btn-danger-solid' : 'btn-primary'"
          @click="answerConfirm(true)"
        >
          {{ confirmState.confirmLabel }}
        </button>
      </div>
    </div>
  </div>
  </Transition>
</template>
