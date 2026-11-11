/** [hue, saturation %, lightness %] */
export type CardColor = [number, number, number]

/**
 * Every number has its own color, so a hand reads at a glance. Lightness is tuned
 * per color so white text on the solid face stays readable (yellows and greens are darker).
 */
export const NUMBER_COLORS: CardColor[] = [
  [215, 12, 40], // 0
  [350, 70, 48], // 1
  [18, 80, 46], // 2
  [38, 85, 38], // 3
  [68, 65, 32], // 4
  [120, 50, 34], // 5
  [160, 60, 30], // 6
  [185, 70, 33], // 7
  [208, 75, 44], // 8
  [232, 60, 54], // 9
  [262, 55, 54], // 10
  [290, 50, 48], // 11
  [325, 62, 48], // 12
]

export const numberColor = (n: number): CardColor => NUMBER_COLORS[n] ?? NUMBER_COLORS[0]!

/** Bonus cards: gold for the +N cards, a dark warm tone for x2. */
export const modifierColor = (m: string): CardColor => (m === 'x2' ? [28, 18, 26] : [40, 88, 36])
