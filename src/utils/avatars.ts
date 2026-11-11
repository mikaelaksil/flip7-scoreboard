/** One colour per possible seat (up to 18 players). Each id maps to a pastel hue. */
export const AVATARS: string[] = Array.from({ length: 18 }, (_, i) => `color-${i}`)

export const avatarForSeat = (seat: number): string => AVATARS[seat % AVATARS.length]!

export const isAvatar = (value: unknown): value is string =>
  typeof value === 'string' && AVATARS.includes(value)

/** A stable hue (0-359) for an avatar colour; the multiplier spreads neighbouring seats apart. */
export const avatarHue = (avatar: string): number => (Math.max(AVATARS.indexOf(avatar), 0) * 47) % 360
