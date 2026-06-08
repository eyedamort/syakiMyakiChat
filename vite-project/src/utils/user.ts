const USER_KEY = 'vibe_userName'

export function getUserName(): string | null {
  return localStorage.getItem(USER_KEY)
}

export function setUserName(name: string): void {
  localStorage.setItem(USER_KEY, name.trim())
}
