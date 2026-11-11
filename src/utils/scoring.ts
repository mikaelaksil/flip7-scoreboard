export const NUMBER_CARDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
export const MODIFIERS = ['+2', '+4', '+6', '+8', '+10', 'x2'] as const
export type Modifier = (typeof MODIFIERS)[number]

export const FLIP7_SIZE = 7
export const FLIP7_BONUS = 15

export interface Hand {
  numbers: number[]
  modifiers: Modifier[]
  busted: boolean
}

export interface Entry extends Hand {
  score: number
}

export interface ScoreResult {
  total: number
  numbersSum: number
  doubled: boolean
  additive: number
  flip7: boolean
  busted: boolean
  breakdown: string
}

/**
 * Flip 7 round score:
 *   (sum of number cards x2 if the x2 modifier is held) + (+N modifiers) + (15 if 7 different numbers)
 * A bust scores 0. Duplicate inputs are ignored (the deck has one of each modifier,
 * and a duplicate number is a bust, which is entered explicitly).
 */
export function calculateScore(hand: Hand): ScoreResult {
  if (hand.busted) {
    return {
      total: 0,
      numbersSum: 0,
      doubled: false,
      additive: 0,
      flip7: false,
      busted: true,
      breakdown: 'Busted = 0',
    }
  }

  const numbers = [...new Set(hand.numbers)]
  const modifiers = [...new Set(hand.modifiers)]

  const numbersSum = numbers.reduce((sum, n) => sum + n, 0)
  const doubled = modifiers.includes('x2')
  const additive = modifiers
    .filter((m) => m !== 'x2')
    .reduce((sum, m) => sum + Number(m.slice(1)), 0)
  const flip7 = numbers.length === FLIP7_SIZE

  const total = numbersSum * (doubled ? 2 : 1) + additive + (flip7 ? FLIP7_BONUS : 0)

  const parts: string[] = []
  if (numbers.length > 0) parts.push(`Numbers ${numbersSum}`)
  if (doubled) parts.push('×2')
  if (additive > 0) parts.push(`+${additive}`)
  if (flip7) parts.push(`Flip 7 +${FLIP7_BONUS}`)

  return {
    total,
    numbersSum,
    doubled,
    additive,
    flip7,
    busted: false,
    breakdown: parts.length ? `${parts.join(' · ')} = ${total}` : 'No cards = 0',
  }
}

/** Normalise a hand (sorted, de-duplicated) and attach its computed score. */
export function makeEntry(hand: Hand): Entry {
  const clean: Hand = {
    numbers: [...new Set(hand.numbers)].sort((a, b) => a - b),
    modifiers: [...new Set(hand.modifiers)],
    busted: hand.busted,
  }
  return { ...clean, score: calculateScore(clean).total }
}

export const emptyHand = (): Hand => ({ numbers: [], modifiers: [], busted: false })
