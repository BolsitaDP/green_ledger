import type { AuthSession } from '../types'
import { apiBaseUrl } from './http'

const authStorageKey = 'greenledger.auth.session'
const refreshLeewayInMs = 30_000

type AuthSessionListener = () => void

let currentSession = readStoredSession()
let refreshPromise: Promise<AuthSession | null> | null = null

const listeners = new Set<AuthSessionListener>()

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSession = window.localStorage.getItem(authStorageKey)
  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as AuthSession
  } catch {
    window.localStorage.removeItem(authStorageKey)
    return null
  }
}

function persistSession(session: AuthSession | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (session) {
    window.localStorage.setItem(authStorageKey, JSON.stringify(session))
    return
  }

  window.localStorage.removeItem(authStorageKey)
}

function emitSessionChanged() {
  for (const listener of listeners) {
    listener()
  }
}

function isRefreshNeeded(session: AuthSession): boolean {
  const expiresAt = new Date(session.accessTokenExpiresAtUtc).getTime()

  if (Number.isNaN(expiresAt)) {
    return true
  }

  return expiresAt <= Date.now() + refreshLeewayInMs
}

async function executeRefresh(refreshToken: string): Promise<AuthSession | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      setAuthSession(null)
      return null
    }

    const refreshedSession = (await response.json()) as AuthSession
    setAuthSession(refreshedSession)
    return refreshedSession
  } catch {
    return null
  }
}

export function getAuthSession(): AuthSession | null {
  return currentSession
}

export function setAuthSession(session: AuthSession | null) {
  currentSession = session
  persistSession(session)
  emitSessionChanged()
}

export function subscribeToAuthSession(listener: AuthSessionListener): () => void {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export async function refreshAuthSession(): Promise<AuthSession | null> {
  const session = currentSession

  if (!session?.refreshToken) {
    setAuthSession(null)
    return null
  }

  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = executeRefresh(session.refreshToken).finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export async function ensureValidAccessToken(): Promise<string | undefined> {
  const session = currentSession

  if (!session) {
    return undefined
  }

  if (!isRefreshNeeded(session)) {
    return session.accessToken
  }

  const refreshedSession = await refreshAuthSession()
  return refreshedSession?.accessToken ?? session.accessToken
}
