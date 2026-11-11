import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { avatarForSeat, isAvatar } from '../utils/avatars'
import { makeEntry, type Entry, type Hand } from '../utils/scoring'

export interface Player {
  id: string
  name: string
  avatar: string
}

export interface Round {
  number: number
  /** Who started this round. */
  starterId: string
  entries: Record<string, Entry>
}

/** The players and target of the most recent game, kept so a returning player can start again quickly. */
export interface LastSetup {
  names: string[]
  avatars: string[]
  target: number
}

interface Persisted {
  lastSetup?: LastSetup | null
  started: boolean
  players: Player[]
  rounds: Round[]
  draft: Record<string, Entry>
  startIndex?: number
  /** Saved by older versions that had a dealer. */
  startDealerIndex?: number
  targetScore: number
}

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 18
export const DEFAULT_TARGET = 200

const STORAGE_KEY = 'flip7-scorekeeper:v1'

function loadSaved(): Persisted | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Persisted) : null
  } catch {
    return null
  }
}

function persist(data: Persisted) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* storage unavailable or full: the game keeps working in memory */
  }
}

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const useGameStore = defineStore('game', () => {
  const saved = loadSaved()

  const started = ref(saved?.started ?? false)
  // Games saved with an older avatar style get a colour by seat.
  const players = ref<Player[]>(
    (saved?.players ?? []).map((p, i) => ({ ...p, avatar: isAvatar(p.avatar) ? p.avatar : avatarForSeat(i) })),
  )
  const rounds = ref<Round[]>(saved?.rounds ?? [])
  /** Entries for the round currently being played (not yet ended). */
  const draft = ref<Record<string, Entry>>(saved?.draft ?? {})
  /** Seat that starts round 1; the starting seat moves one place each round. */
  const startIndex = ref(saved?.startIndex ?? saved?.startDealerIndex ?? 0)
  const targetScore = ref(saved?.targetScore ?? DEFAULT_TARGET)
  /** Survives resetGame(): it is what makes someone a returning player. */
  const lastSetup = ref<LastSetup | null>(
    saved?.lastSetup
      ? {
          ...saved.lastSetup,
          avatars: saved.lastSetup.names.map((_, i) => {
            const a = saved.lastSetup?.avatars?.[i]
            return isAvatar(a) ? a : avatarForSeat(i)
          }),
        }
      : null,
  )

  // ---- getters -----------------------------------------------------------

  const roundNumber = computed(() => rounds.value.length + 1)

  /** The player who goes first this round. There is no dealer: everyone draws from the same stack. */
  const starter = computed(() =>
    players.value.length ? players.value[(startIndex.value + rounds.value.length) % players.value.length] : undefined,
  )

  const totals = computed<Record<string, number>>(() => {
    const t: Record<string, number> = {}
    for (const p of players.value) t[p.id] = 0
    for (const r of rounds.value) {
      for (const [id, e] of Object.entries(r.entries)) {
        if (id in t) t[id] += e.score
      }
    }
    return t
  })

  /** Players sorted by total, highest first (seating order breaks ties). */
  const ranking = computed(() => [...players.value].sort((a, b) => totals.value[b.id]! - totals.value[a.id]!))

  const topScore = computed(() => (ranking.value[0] ? totals.value[ranking.value[0].id]! : 0))
  const leaders = computed(() => ranking.value.filter((p) => totals.value[p.id] === topScore.value))
  const leader = computed(() => (rounds.value.length > 0 ? ranking.value[0] : undefined))

  const reachedTarget = computed(() => rounds.value.length > 0 && topScore.value >= targetScore.value)
  const tieBreakNeeded = computed(() => reachedTarget.value && leaders.value.length > 1)
  const isGameOver = computed(() => reachedTarget.value && leaders.value.length === 1)
  const winner = computed(() => (isGameOver.value ? leaders.value[0] : undefined))

  const allEntered = computed(() => players.value.length > 0 && players.value.every((p) => !!draft.value[p.id]))
  const missingPlayers = computed(() => players.value.filter((p) => !draft.value[p.id]))

  // ---- actions -----------------------------------------------------------

  function startGame(names: string[], target: number, avatars: string[] = []) {
    players.value = names.map((n, i) => ({
      id: uid(),
      name: n.trim(),
      avatar: avatars[i] ?? avatarForSeat(i),
    }))
    rounds.value = []
    draft.value = {}
    targetScore.value = target
    startIndex.value = 0
    started.value = true
    lastSetup.value = {
      names: players.value.map((p) => p.name),
      avatars: players.value.map((p) => p.avatar),
      target,
    }
  }

  function saveDraft(playerId: string, hand: Hand) {
    draft.value[playerId] = makeEntry(hand)
  }

  function clearDraft(playerId: string) {
    delete draft.value[playerId]
  }

  /** Give every player without an entry a 0-point entry. */
  function fillMissingWithZero() {
    for (const p of missingPlayers.value) {
      draft.value[p.id] = makeEntry({ numbers: [], modifiers: [], busted: false })
    }
  }

  function endRound(): boolean {
    if (!allEntered.value || !starter.value) return false
    rounds.value.push({
      number: roundNumber.value,
      starterId: starter.value.id,
      entries: { ...draft.value },
    })
    draft.value = {}
    return true
  }

  /** Remove the last round and load its entries back as the current draft. */
  function undoRound(): boolean {
    const last = rounds.value.pop()
    if (!last) return false
    draft.value = { ...last.entries }
    return true
  }

  function editRound(roundNum: number, playerId: string, hand: Hand) {
    const round = rounds.value.find((r) => r.number === roundNum)
    if (round) round.entries[playerId] = makeEntry(hand)
  }

  function resetGame() {
    started.value = false
    players.value = []
    rounds.value = []
    draft.value = {}
    startIndex.value = 0
  }

  /** Same players and target, scores cleared; dealing continues around the table. */
  function rematch() {
    if (players.value.length) {
      startIndex.value = (startIndex.value + rounds.value.length) % players.value.length
    }
    rounds.value = []
    draft.value = {}
  }

  // ---- persistence -------------------------------------------------------

  watch(
    [started, players, rounds, draft, startIndex, targetScore, lastSetup],
    () =>
      persist({
        lastSetup: lastSetup.value,
        started: started.value,
        players: players.value,
        rounds: rounds.value,
        draft: draft.value,
        startIndex: startIndex.value,
        targetScore: targetScore.value,
      }),
    { deep: true },
  )

  return {
    lastSetup,
    started,
    players,
    rounds,
    draft,
    startIndex,
    targetScore,
    roundNumber,
    starter,
    totals,
    ranking,
    topScore,
    leaders,
    leader,
    reachedTarget,
    tieBreakNeeded,
    isGameOver,
    winner,
    allEntered,
    missingPlayers,
    startGame,
    saveDraft,
    clearDraft,
    fillMissingWithZero,
    endRound,
    undoRound,
    editRound,
    resetGame,
    rematch,
  }
})
