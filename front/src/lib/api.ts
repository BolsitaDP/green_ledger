import { ensureValidAccessToken, refreshAuthSession } from './auth'
import { apiBaseUrl, createApiError } from './http'

type ApiRequestOptions = {
  token?: string
  body?: BodyInit | null
  contentType?: string
}

async function buildHeaders(options: ApiRequestOptions): Promise<Headers> {
  const headers = new Headers()

  if (options.contentType) {
    headers.set('Content-Type', options.contentType)
  }

  if (options.token) {
    const accessToken = await ensureValidAccessToken()

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }
  }

  return headers
}

async function executeRequest(method: string, path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const headers = await buildHeaders(options)

  return fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: options.body ?? null,
  })
}

async function readErrorPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return await response.json()
  }

  const text = await response.text()
  return text.trim().length > 0 ? text : undefined
}

async function apiRequest<T>(method: string, path: string, options: ApiRequestOptions = {}): Promise<T> {
  let response = await executeRequest(method, path, options)

  if (response.status === 401 && options.token) {
    const refreshedSession = await refreshAuthSession()

    if (refreshedSession?.accessToken) {
      response = await executeRequest(method, path, options)
    }
  }

  if (!response.ok) {
    throw createApiError(response.status, await readErrorPayload(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>('GET', path, { token })
}

export async function apiPost<TResponse>(path: string, payload: unknown, token?: string): Promise<TResponse> {
  return apiRequest<TResponse>('POST', path, {
    token,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

export async function apiPatch<TResponse>(path: string, payload: unknown, token?: string): Promise<TResponse> {
  return apiRequest<TResponse>('PATCH', path, {
    token,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

export async function apiPostForm<TResponse>(path: string, formData: FormData, token?: string): Promise<TResponse> {
  return apiRequest<TResponse>('POST', path, {
    token,
    body: formData,
  })
}

export async function apiDownload(path: string, token?: string): Promise<Blob> {
  let response = await executeRequest('GET', path, { token })

  if (response.status === 401 && token) {
    const refreshedSession = await refreshAuthSession()

    if (refreshedSession?.accessToken) {
      response = await executeRequest('GET', path, { token })
    }
  }

  if (!response.ok) {
    throw createApiError(response.status, await readErrorPayload(response))
  }

  return await response.blob()
}

export { apiBaseUrl }
