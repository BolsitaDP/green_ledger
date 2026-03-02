export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5105'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type ApiRequestOptions = {
  token?: string
  body?: BodyInit | null
  contentType?: string
}

async function apiRequest<T>(method: string, path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers()

  if (options.contentType) {
    headers.set('Content-Type', options.contentType)
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: options.body ?? null,
  })

  if (!response.ok) {
    throw new ApiError(response.status, `Request failed with status ${response.status}`)
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

export async function apiDownload(path: string, token?: string): Promise<Blob> {
  const headers = new Headers()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new ApiError(response.status, `Request failed with status ${response.status}`)
  }

  return await response.blob()
}
