import { reactive } from 'vue'

interface ConfirmState {
  open: boolean
  message: string
  confirmLabel: string
  danger: boolean
  resolve?: (answer: boolean) => void
}

export const confirmState = reactive<ConfirmState>({
  open: false,
  message: '',
  confirmLabel: 'Confirm',
  danger: false,
})

/**
 * In-page replacement for window.confirm(), which some embedded viewers
 * block. Resolves true when the player confirms, false otherwise.
 */
export function askConfirm(
  message: string,
  options: { confirmLabel?: string; danger?: boolean } = {},
): Promise<boolean> {
  confirmState.resolve?.(false)
  return new Promise<boolean>((resolve) => {
    Object.assign(confirmState, {
      open: true,
      message,
      confirmLabel: options.confirmLabel ?? 'Confirm',
      danger: options.danger ?? false,
      resolve,
    })
  })
}

export function answerConfirm(answer: boolean) {
  const resolve = confirmState.resolve
  confirmState.open = false
  confirmState.resolve = undefined
  resolve?.(answer)
}
