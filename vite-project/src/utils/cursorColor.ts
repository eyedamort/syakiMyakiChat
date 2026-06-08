const CURSOR_COLORS = [
  '#ff6b00',
  '#ff8c2a',
  '#ffb040',
  '#ff453a',
  '#64d2ff',
  '#30d158',
  '#bf5af2',
  '#ff375f',
]

export function colorForClient(clientId: string): string {
  let hash = 0
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}
