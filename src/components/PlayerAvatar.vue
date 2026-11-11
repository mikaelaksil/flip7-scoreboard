<script setup lang="ts">
import { computed } from 'vue'
import { avatarHue } from '../utils/avatars'

const props = withDefaults(defineProps<{ avatar: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }>(), {
  size: 'md',
})

const style = computed(() => ({ '--h': avatarHue(props.avatar) }))
</script>

<template>
  <span class="avatar" :class="`avatar-${size}`" :style="style" aria-hidden="true">
    <svg viewBox="0 0 24 24" focusable="false">
      <circle cx="12" cy="9.5" r="4.3" />
      <path d="M2 24c0-5.5 4.5-8.5 10-8.5s10 3 10 8.5z" />
    </svg>
  </span>
</template>
