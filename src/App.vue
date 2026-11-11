<script setup lang="ts">
import ConfirmDialog from './components/ConfirmDialog.vue'
import { pageTransition } from './router'

function toTop() {
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <main class="app">
    <RouterView v-slot="{ Component, route }">
      <Transition :name="pageTransition" mode="out-in" @after-leave="toTop">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </main>
  <ConfirmDialog />
</template>
