import { describe, expect, it } from 'vitest'
import { calculateScore, emptyHand, makeEntry } from './scoring'

const hand = (numbers: number[], modifiers: any[] = [], busted = false) => ({
  numbers,
  modifiers,
  busted,
})

describe('calculateScore', () => {
  it('scores an empty hand as 0', () => {
    const r = calculateScore(emptyHand())
    expect(r.total).toBe(0)
    expect(r.breakdown).toBe('No cards = 0')
  })

  it('sums number cards', () => {
    expect(calculateScore(hand([12, 8, 5])).total).toBe(25)
  })

  it('applies x2 to numbers, then adds +N modifiers', () => {
    // (12 + 8 + 5) * 2 + 4 = 54
    const r = calculateScore(hand([12, 8, 5], ['x2', '+4']))
    expect(r.total).toBe(54)
    expect(r.doubled).toBe(true)
    expect(r.additive).toBe(4)
  })

  it('stacks several additive modifiers', () => {
    expect(calculateScore(hand([10], ['+2', '+4', '+10'])).total).toBe(26)
  })

  it('scores modifiers even without number cards', () => {
    expect(calculateScore(hand([], ['+6'])).total).toBe(6)
  })

  it('awards +15 for exactly 7 different numbers', () => {
    const r = calculateScore(hand([1, 2, 3, 4, 5, 6, 7]))
    expect(r.flip7).toBe(true)
    expect(r.total).toBe(28 + 15)
  })

  it('counts 0 as one of the 7 numbers', () => {
    const r = calculateScore(hand([0, 1, 2, 3, 4, 5, 6]))
    expect(r.flip7).toBe(true)
    expect(r.total).toBe(21 + 15)
  })

  it('does not award the bonus for 6 numbers', () => {
    const r = calculateScore(hand([0, 1, 2, 3, 4, 5]))
    expect(r.flip7).toBe(false)
    expect(r.total).toBe(15)
  })

  it('does not double the Flip 7 bonus', () => {
    // 21 * 2 + 15 = 57
    expect(calculateScore(hand([0, 1, 2, 3, 4, 5, 6], ['x2'])).total).toBe(57)
    // 21 * 2 + 10 + 15 = 67
    expect(calculateScore(hand([0, 1, 2, 3, 4, 5, 6], ['x2', '+10'])).total).toBe(67)
  })

  it('scores 0 when busted, regardless of cards', () => {
    const r = calculateScore(hand([12, 11, 10], ['x2', '+10'], true))
    expect(r.total).toBe(0)
    expect(r.busted).toBe(true)
    expect(r.flip7).toBe(false)
  })

  it('ignores duplicate inputs', () => {
    expect(calculateScore(hand([5, 5, 3], ['+2', '+2'])).total).toBe(5 + 3 + 2)
  })
})

describe('makeEntry', () => {
  it('sorts numbers and attaches the score', () => {
    const e = makeEntry(hand([8, 12, 5], ['x2', '+4']))
    expect(e.numbers).toEqual([5, 8, 12])
    expect(e.score).toBe(54)
  })
})
