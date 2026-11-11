import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from './game'
import { emptyHand } from '../utils/scoring'

const hand = (numbers: number[], modifiers: any[] = [], busted = false) => ({ numbers, modifiers, busted })

function setup(target = 200) {
  setActivePinia(createPinia())
  const store = useGameStore()
  store.startGame(['Ann', 'Ben', 'Cy'], target)
  return store
}

/** Enter a hand for every player (by seat order) and end the round. */
function playRound(store: ReturnType<typeof useGameStore>, hands: ReturnType<typeof hand>[]) {
  store.players.forEach((p, i) => store.saveDraft(p.id, hands[i] ?? emptyHand()))
  return store.endRound()
}

describe('game store', () => {
  let store: ReturnType<typeof setup>
  beforeEach(() => {
    store = setup()
  })

  it('starts round 1 with the first seat', () => {
    expect(store.started).toBe(true)
    expect(store.roundNumber).toBe(1)
    expect(store.starter?.name).toBe('Ann')
  })

  it('will not end a round until every player has an entry', () => {
    store.saveDraft(store.players[0]!.id, hand([5]))
    expect(store.allEntered).toBe(false)
    expect(store.endRound()).toBe(false)
    expect(store.rounds).toHaveLength(0)
  })

  it('adds scores to totals, increments the round and moves the starting player on', () => {
    playRound(store, [hand([12, 8, 5], ['x2', '+4']), hand([3]), hand([9], [], true)])
    const [a, b, c] = store.players
    expect(store.totals[a!.id]).toBe(54)
    expect(store.totals[b!.id]).toBe(3)
    expect(store.totals[c!.id]).toBe(0)
    expect(store.roundNumber).toBe(2)
    expect(store.starter?.name).toBe('Ben')
    expect(store.draft).toEqual({})
  })

  it('wraps the starting player around the table', () => {
    for (let i = 0; i < 3; i++) playRound(store, [])
    expect(store.starter?.name).toBe('Ann')
  })

  it('fills missing entries with zero', () => {
    store.saveDraft(store.players[0]!.id, hand([4]))
    store.fillMissingWithZero()
    expect(store.allEntered).toBe(true)
    expect(store.draft[store.players[1]!.id]!.score).toBe(0)
  })

  it('declares a winner once someone reaches the target alone', () => {
    const s = setup(50)
    playRound(s, [hand([12, 11, 10]), hand([5]), hand([])]) // Ann 33
    expect(s.isGameOver).toBe(false)
    playRound(s, [hand([12, 11]), hand([2]), hand([])]) // Ann 56
    expect(s.isGameOver).toBe(true)
    expect(s.winner?.name).toBe('Ann')
  })

  it('keeps playing when the top score is tied at or above the target', () => {
    const s = setup(50)
    playRound(s, [hand([12, 11, 10, 9, 8]), hand([12, 11, 10, 9, 8]), hand([])]) // 50 vs 50
    expect(s.reachedTarget).toBe(true)
    expect(s.tieBreakNeeded).toBe(true)
    expect(s.isGameOver).toBe(false)
    playRound(s, [hand([1]), hand([2]), hand([])])
    expect(s.isGameOver).toBe(true)
    expect(s.winner?.name).toBe('Ben')
  })

  it('does not end the game while nobody has reached the target', () => {
    const s = setup(100)
    playRound(s, [hand([12, 11, 10]), hand([]), hand([])])
    expect(s.reachedTarget).toBe(false)
  })

  it('undoes the last round and restores its entries as the draft', () => {
    playRound(store, [hand([7]), hand([2]), hand([])])
    expect(store.undoRound()).toBe(true)
    expect(store.rounds).toHaveLength(0)
    expect(store.roundNumber).toBe(1)
    expect(store.draft[store.players[0]!.id]!.score).toBe(7)
    expect(store.undoRound()).toBe(false)
  })

  it('edits a past round and recalculates totals', () => {
    playRound(store, [hand([7]), hand([2]), hand([])])
    store.editRound(1, store.players[0]!.id, hand([7], ['+10']))
    expect(store.totals[store.players[0]!.id]).toBe(17)
  })

  it('rematch keeps players, clears scores and keeps rotating the starting player', () => {
    playRound(store, [])
    playRound(store, [])
    store.rematch()
    expect(store.players).toHaveLength(3)
    expect(store.rounds).toHaveLength(0)
    expect(store.starter?.name).toBe('Cy')
  })

  it('resetGame returns to the setup state', () => {
    store.resetGame()
    expect(store.started).toBe(false)
    expect(store.players).toHaveLength(0)
  })

  it('remembers the last setup, even after the game is reset', () => {
    expect(store.lastSetup?.names).toEqual(['Ann', 'Ben', 'Cy'])
    expect(store.lastSetup?.target).toBe(200)
    expect(store.lastSetup?.avatars).toHaveLength(3)
    store.resetGame()
    expect(store.lastSetup?.names).toEqual(['Ann', 'Ben', 'Cy'])
  })

  it('has no last setup before the first game', () => {
    setActivePinia(createPinia())
    expect(useGameStore().lastSetup).toBeNull()
  })
})

describe('saved games from before the user icons', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('swaps old emoji avatars for a colour per seat', () => {
    const saved = {
      started: true,
      players: [
        { id: 'a', name: 'Ann', avatar: '🐱' },
        { id: 'b', name: 'Ben', avatar: '🐶' },
        { id: 'c', name: 'Cy' },
      ],
      rounds: [],
      draft: {},
      startIndex: 0,
      targetScore: 200,
      lastSetup: { names: ['Ann', 'Ben', 'Cy'], avatars: ['🐱', '🐶', '🐰'], target: 200 },
    }
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(saved), setItem: () => {} })
    setActivePinia(createPinia())
    const s = useGameStore()
    expect(s.players.map((p) => p.avatar)).toEqual(['color-0', 'color-1', 'color-2'])
    expect(s.lastSetup?.avatars).toEqual(['color-0', 'color-1', 'color-2'])
  })
})
