import { envConfig } from '../config/env'

export const apiBaseUrl = envConfig.apiBaseUrl

type ApiErrorPayload = {
  title?: string
  detail?: string
  message?: string
  traceId?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  title?: string
  detail?: string
  traceId?: string

  constructor(status: number, message: string, metadata: ApiErrorPayload = {}) {
    super(message)
    this.status = status
    this.title = metadata.title
    this.detail = metadata.detail
    this.traceId = metadata.traceId
  }
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === 'object' && value !== null
}

function getValidationMessage(errors?: Record<string, string[]>): string | null {
  if (!errors) {
    return null
  }

  const firstMessage = Object.values(errors)
    .flatMap((items) => items)
    .find((item) => typeof item === 'string' && item.trim().length > 0)

  return firstMessage?.trim() ?? null
}

function sanitizeServerText(value: string): string | null {
  const trimmed = value.trim()

  if (!trimmed || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return null
  }

  return trimmed
}

function translateKnownServerMessage(message: string, status: number): string | null {
  const trimmed = message.trim()

  if (!trimmed) {
    return null
  }

  const exactTranslations = new Map<string, string>([
    ['Invalid credentials.', 'Las credenciales no son correctas. Revisa el correo y la clave.'],
    ['Refresh token is required.', 'La sesion ya no se puede renovar porque falta el refresh token.'],
    ['Refresh token is invalid.', 'La sesion ya no es valida y debes iniciar sesion nuevamente.'],
    ['Refresh token is expired or revoked.', 'La sesion vencio o fue cerrada. Inicia sesion nuevamente.'],
    ['Refresh token user is invalid.', 'La sesion ya no pertenece a un usuario valido. Inicia sesion nuevamente.'],
    ['A batch with the same number already exists.', 'Ya existe un lote con ese numero. Usa uno diferente.'],
    ['Batch was not found.', 'No encontramos el lote que intentabas usar.'],
    ['Document was not found.', 'No encontramos el documento solicitado.'],
    ['Actor user was not found or is inactive.', 'Tu usuario ya no esta activo para realizar esta accion.'],
    ['Create batch request is incomplete.', 'Faltan datos obligatorios para crear el lote.'],
    ['Register movement request is incomplete.', 'Faltan datos obligatorios para registrar el movimiento.'],
    ['Change status request is incomplete.', 'Faltan datos obligatorios para cambiar el estado del lote.'],
    ['A file name is required.', 'Debes seleccionar un archivo valido antes de continuar.'],
    ['Unsupported document content type.', 'El tipo de archivo no esta permitido. Usa PDF, PNG o JPG.'],
    ['The uploaded file exceeds the maximum allowed size.', 'El archivo es demasiado grande. Carga una version mas liviana.'],
    ['Document file was not found.', 'El archivo del documento ya no esta disponible en almacenamiento.'],
    ['Batch is already in the requested stage.', 'El lote ya se encuentra en esa etapa. No hace falta moverlo otra vez.'],
    ['The created batch could not be reloaded.', 'El lote se creo, pero no pudimos recargar su informacion. Intenta abrirlo nuevamente.'],
    ['The updated batch could not be reloaded.', 'La accion se guardo, pero no pudimos recargar el lote. Intenta actualizar la vista.'],
    ['Authenticated user id claim is missing.', 'La sesion actual esta incompleta. Cierra sesion e inicia nuevamente.'],
    ['JWT configuration is missing.', 'El servidor no tiene configurada la autenticacion correctamente.'],
    ['Invalid storage path.', 'El servidor no pudo guardar el archivo en una ruta valida.'],
  ])

  const exactMatch = exactTranslations.get(trimmed)

  if (exactMatch) {
    return exactMatch
  }

  if (trimmed.startsWith("Value '") && trimmed.includes("' is not valid for BatchStage")) {
    return 'La etapa seleccionada no es valida para este movimiento.'
  }

  if (trimmed.startsWith("Value '") && trimmed.includes("' is not valid for BatchLifecycleStatus")) {
    return 'El estado seleccionado no es valido para este lote.'
  }

  if (status >= 500) {
    return getFallbackMessage(status)
  }

  return null
}

function getFallbackMessage(status: number): string {
  switch (status) {
    case 400:
      return 'La informacion enviada no es valida. Revisa los datos y vuelve a intentarlo.'
    case 401:
      return 'Tu sesion ya no es valida. Inicia sesion nuevamente.'
    case 403:
      return 'Tu rol no tiene permiso para hacer esta accion.'
    case 404:
      return 'No encontramos el recurso que intentabas abrir.'
    case 409:
      return 'La accion no se pudo completar porque el registro entro en conflicto con su estado actual.'
    case 413:
      return 'El archivo o contenido enviado es demasiado grande para procesarlo.'
    case 415:
      return 'El tipo de archivo o formato enviado no esta permitido.'
    case 500:
      return 'El servidor no pudo completar la accion. Intenta nuevamente o contacta al equipo de soporte.'
    default:
      return 'No pudimos completar la accion en este momento.'
  }
}

export function createApiError(status: number, payload?: unknown): ApiError {
  if (typeof payload === 'string') {
    const sanitized = sanitizeServerText(payload)
    const translated = sanitized ? translateKnownServerMessage(sanitized, status) : null
    return new ApiError(status, translated ?? sanitized ?? getFallbackMessage(status))
  }

  if (isApiErrorPayload(payload)) {
    const validationMessage = getValidationMessage(payload.errors)
    const translatedDetail = payload.detail ? translateKnownServerMessage(payload.detail, status) : null
    const translatedMessage = payload.message ? translateKnownServerMessage(payload.message, status) : null
    const translatedTitle = payload.title ? translateKnownServerMessage(payload.title, status) : null
    const message =
      validationMessage ??
      translatedDetail ??
      translatedMessage ??
      translatedTitle ??
      payload.detail?.trim() ??
      payload.message?.trim() ??
      payload.title?.trim() ??
      getFallbackMessage(status)

    return new ApiError(status, message, payload)
  }

  return new ApiError(status, getFallbackMessage(status))
}

export function getUserFacingErrorMessage(error: unknown, fallbackMessage = 'No pudimos completar la accion.'): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}
