import { ref } from 'vue'
import { createMemoryHistory, createRouter, createWebHashHistory } from 'vue-router'
import { useGameStore } from '../stores/game'
import GameView from '../views/GameView.vue'
import ResultsView from '../views/ResultsView.vue'
import SetupView from '../views/SetupView.vue'

/** The embedded build keeps routes in memory; the normal build uses hash URLs so any static host works. */
export const EMBEDDED = import.meta.env.MODE === 'embedded'

const router = createRouter({
  history: EMBEDDED ? createMemoryHistory() : createWebHashHistory(),
  routes: [
    { path: '/', name: 'setup', component: SetupView },
    { path: '/game', name: 'game', component: GameView },
    { path: '/results', name: 'results', component: ResultsView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

/** Which page transition to play: forward, back, or the celebratory one into the results. */
export const pageTransition = ref('page-forward')
const depth: Record<string, number> = { setup: 0, game: 1, results: 2 }

router.beforeEach((to, from) => {
  const store = useGameStore()
  if ((to.name === 'game' || to.name === 'results') && !store.started) return { name: 'setup' }
  if (to.name === 'results' && !store.isGameOver) return { name: 'game' }

  const a = depth[String(from.name)] ?? 0
  const b = depth[String(to.name)] ?? 0
  pageTransition.value = to.name === 'results' ? 'page-win' : b >= a ? 'page-forward' : 'page-back'
})

export default router
