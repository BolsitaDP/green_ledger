import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react'
import { useToast } from './toastContext'
import { apiDownload, apiGet, apiPatch, apiPost, apiPostForm } from '../lib/api'
import { getAuthSession, setAuthSession, subscribeToAuthSession } from '../lib/auth'
import { getBatchDetailAccess } from '../lib/batchAccess'
import { ApiError, getUserFacingErrorMessage } from '../lib/http'
import { getRoleWorkspaceConfig, getWorkerInbox } from '../lib/roleWorkspace'
import type {
  AuditTrailItemViewModel,
  AuthSession,
  BatchDocumentViewModel,
  BatchViewModel,
  UserSummaryViewModel,
} from '../types'
import {
  GreenLedgerContext,
  type ChangeStatusInput,
  type CreateBatchInput,
  type LoginInput,
  type MoveBatchInput,
  type UploadDocumentInput,
} from './GreenLedgerContext'

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
}

async function loadBatches(accessToken: string): Promise<BatchViewModel[]> {
  return await apiGet<BatchViewModel[]>('/api/batches', accessToken)
}

async function loadUsers(accessToken: string): Promise<UserSummaryViewModel[]> {
  return await apiGet<UserSummaryViewModel[]>('/api/users', accessToken)
}

async function loadAuditTrail(batchId: string, accessToken: string): Promise<AuditTrailItemViewModel[]> {
  return await apiGet<AuditTrailItemViewModel[]>(`/api/batches/${batchId}/audit`, accessToken)
}

async function loadDocuments(batchId: string, accessToken: string): Promise<BatchDocumentViewModel[]> {
  return await apiGet<BatchDocumentViewModel[]>(`/api/batches/${batchId}/documents`, accessToken)
}

function upsertBatch(batches: BatchViewModel[], updatedBatch: BatchViewModel): BatchViewModel[] {
  const existingIndex = batches.findIndex((batch) => batch.id === updatedBatch.id)

  if (existingIndex === -1) {
    return [updatedBatch, ...batches]
  }

  return batches.map((batch) => (batch.id === updatedBatch.id ? updatedBatch : batch))
}

export function GreenLedgerProvider({ children }: PropsWithChildren) {
  const { showToast } = useToast()
  const authSession = useSyncExternalStore(subscribeToAuthSession, getAuthSession, getAuthSession)
  const authIdentity = authSession ? `${authSession.userId}:${authSession.role}` : 'anonymous'
  const protectedRequestToken = authSession ? 'session-present' : undefined
  const roleWorkspace = getRoleWorkspaceConfig(authSession?.role)
  const lastAuthToast = useRef<string | null>(null)
  const lastWorkspaceToast = useRef<string | null>(null)
  const lastBatchToast = useRef<string | null>(null)

  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [batchContextError, setBatchContextError] = useState<string | null>(null)
  const [usersDirectoryRestricted, setUsersDirectoryRestricted] = useState(false)
  const [auditTrailRestricted, setAuditTrailRestricted] = useState(false)
  const [batches, setBatches] = useState<BatchViewModel[]>([])
  const [users, setUsers] = useState<UserSummaryViewModel[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [auditTrail, setAuditTrail] = useState<AuditTrailItemViewModel[]>([])
  const [documents, setDocuments] = useState<BatchDocumentViewModel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authError) {
      lastAuthToast.current = null
      return
    }

    if (lastAuthToast.current === authError) {
      return
    }

    showToast({
      tone: 'error',
      title: 'Sesion interrumpida',
      description: authError,
    })
    lastAuthToast.current = authError
  }, [authError, showToast])

  useEffect(() => {
    if (!workspaceError) {
      lastWorkspaceToast.current = null
      return
    }

    if (lastWorkspaceToast.current === workspaceError) {
      return
    }

    showToast({
      tone: 'error',
      title: 'No pudimos abrir tu espacio',
      description: workspaceError,
    })
    lastWorkspaceToast.current = workspaceError
  }, [workspaceError, showToast])

  useEffect(() => {
    if (!batchContextError) {
      lastBatchToast.current = null
      return
    }

    if (lastBatchToast.current === batchContextError) {
      return
    }

    showToast({
      tone: 'error',
      title: 'No pudimos actualizar el lote',
      description: batchContextError,
    })
    lastBatchToast.current = batchContextError
  }, [batchContextError, showToast])

  useEffect(() => {
    let cancelled = false

    if (!protectedRequestToken) {
      setBatches([])
      setUsers([])
      setAuditTrail([])
      setDocuments([])
      setSelectedBatchId('')
      setWorkspaceError(null)
      setBatchContextError(null)
      setUsersDirectoryRestricted(false)
      setAuditTrailRestricted(false)
      setIsLoading(false)
      return () => {
        cancelled = true
      }
    }

    setIsLoading(true)
    setWorkspaceError(null)
    setUsersDirectoryRestricted(false)

    void loadBatches(protectedRequestToken)
      .then(async (batchResult) => {
        if (cancelled) {
          return
        }

        setBatches(batchResult)
        setSelectedBatchId((current) => {
          const currentStillExists = batchResult.some((batch) => batch.id === current)
          return currentStillExists ? current : (batchResult[0]?.id ?? '')
        })

        try {
          const userResult = await loadUsers(protectedRequestToken)

          if (cancelled) {
            return
          }

          setUsers(userResult)
          setUsersDirectoryRestricted(false)
        } catch (error) {
          if (cancelled) {
            return
          }

          if (isUnauthorizedError(error)) {
            throw error
          }

          if (isForbiddenError(error)) {
            setUsers([])
            setUsersDirectoryRestricted(true)
          } else {
            setUsers([])
          }
        }

        setAuthError(null)
        setWorkspaceError(null)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        if (isUnauthorizedError(error)) {
          setAuthSession(null)
          setAuthError('La sesion expiro o ya no es valida. Inicia sesion otra vez.')
          setWorkspaceError(null)
          setBatchContextError(null)
          setBatches([])
          setUsers([])
          setAuditTrail([])
          setDocuments([])
          setSelectedBatchId('')
          setUsersDirectoryRestricted(false)
          setAuditTrailRestricted(false)
          setIsLoading(false)
          return
        }

        setBatches([])
        setUsers([])
        setAuditTrail([])
        setDocuments([])
        setSelectedBatchId('')
        setUsersDirectoryRestricted(false)
        setAuditTrailRestricted(false)
        setWorkspaceError(getUserFacingErrorMessage(error, 'No pudimos cargar los datos principales del entorno. Intenta actualizar nuevamente.'))
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authIdentity, protectedRequestToken])

  useEffect(() => {
    if (!protectedRequestToken || !selectedBatchId) {
      setAuditTrail([])
      setDocuments([])
      setBatchContextError(null)
      setAuditTrailRestricted(false)
      return
    }

    let cancelled = false

    setBatchContextError(null)
    setAuditTrailRestricted(false)

    if (!roleWorkspace.batchExperience.showDocuments && !roleWorkspace.batchExperience.showAudit) {
      setAuditTrail([])
      setDocuments([])
      return () => {
        cancelled = true
      }
    }

    const loadDocumentsForRole = roleWorkspace.batchExperience.showDocuments
      ? loadDocuments(selectedBatchId, protectedRequestToken)
      : Promise.resolve<BatchDocumentViewModel[]>([])

    void loadDocumentsForRole
      .then(async (items) => {
        if (cancelled) {
          return
        }

        setDocuments(items)

        if (!roleWorkspace.batchExperience.showAudit) {
          setAuditTrail([])
          setAuditTrailRestricted(false)
          setAuthError(null)
          return
        }

        try {
          const entries = await loadAuditTrail(selectedBatchId, protectedRequestToken)

          if (cancelled) {
            return
          }

          setAuditTrail(entries)
          setAuditTrailRestricted(false)
        } catch (error) {
          if (cancelled) {
            return
          }

          if (isUnauthorizedError(error)) {
            throw error
          }

          if (isForbiddenError(error)) {
            setAuditTrail([])
            setAuditTrailRestricted(true)
          } else {
            setAuditTrail([])
            setBatchContextError(getUserFacingErrorMessage(error, 'No pudimos cargar la auditoria de este lote.'))
          }
        }

        setAuthError(null)
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        if (isUnauthorizedError(error)) {
          setAuthSession(null)
          setAuthError('La sesion expiro y no se pudo renovar automaticamente. Inicia sesion otra vez.')
          setBatchContextError(null)
          setAuditTrail([])
          setDocuments([])
          setAuditTrailRestricted(false)
          return
        }

        setAuditTrail([])
        setDocuments([])
        setAuditTrailRestricted(false)
        setBatchContextError(getUserFacingErrorMessage(error, 'No pudimos cargar los documentos y el contexto del lote.'))
      })

    return () => {
      cancelled = true
    }
  }, [selectedBatchId, authIdentity, protectedRequestToken, roleWorkspace.batchExperience.showAudit, roleWorkspace.batchExperience.showDocuments])

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId)
  const selectedBatchAccess = selectedBatch
    ? getBatchDetailAccess(authSession?.role, selectedBatch, documents, auditTrail.length)
    : null
  const workerInbox = getWorkerInbox(batches, authSession?.role)

  async function refreshBatchContext(batchId: string) {
    if (!protectedRequestToken) {
      return
    }

    try {
      let nextBatchContextError: string | null = null
      const items = roleWorkspace.batchExperience.showDocuments
        ? await loadDocuments(batchId, protectedRequestToken)
        : []
      setDocuments(items)

      if (!roleWorkspace.batchExperience.showAudit) {
        setAuditTrail([])
        setAuditTrailRestricted(false)
        setBatchContextError(null)
        return
      }

      try {
        const entries = await loadAuditTrail(batchId, protectedRequestToken)
        setAuditTrail(entries)
        setAuditTrailRestricted(false)
      } catch (error) {
        if (isUnauthorizedError(error)) {
          throw error
        }

        if (isForbiddenError(error)) {
          setAuditTrail([])
          setAuditTrailRestricted(true)
        } else {
          setAuditTrail([])
          setAuditTrailRestricted(false)
          nextBatchContextError = getUserFacingErrorMessage(error, 'No pudimos actualizar la auditoria de este lote.')
        }
      }

      setBatchContextError(nextBatchContextError)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setAuthSession(null)
        setAuthError('La sesion expiro y no se pudo renovar automaticamente. Inicia sesion otra vez.')
        return
      }

      if (isForbiddenError(error)) {
        setAuditTrail([])
        setAuditTrailRestricted(true)
        return
      }

      setAuditTrail([])
      setDocuments([])
      setAuditTrailRestricted(false)
      setBatchContextError(getUserFacingErrorMessage(error, 'No pudimos actualizar el contexto documental del lote.'))
    }
  }

  async function login(input: LoginInput) {
    setIsAuthenticating(true)
    setAuthError(null)
    setWorkspaceError(null)
    setBatchContextError(null)
    setUsersDirectoryRestricted(false)
    setAuditTrailRestricted(false)

    try {
      const session = await apiPost<AuthSession>('/api/auth/login', input)
      setAuthSession(session)
    } catch (error) {
      throw error instanceof ApiError && error.status === 401
        ? new Error('Credenciales invalidas. Revisa el correo y la clave.')
        : new Error(getUserFacingErrorMessage(error, 'No pudimos iniciar la sesion en este momento. Intenta nuevamente.'))
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function logout() {
    if (authSession) {
      try {
        await apiPost<void>('/api/auth/logout', { refreshToken: authSession.refreshToken })
      } catch {
        // El cliente limpia sesion local aunque falle el logout remoto.
      }
    }

    setAuthSession(null)
    setAuthError(null)
    setWorkspaceError(null)
    setBatchContextError(null)
    setBatches([])
    setUsers([])
    setAuditTrail([])
    setDocuments([])
    setSelectedBatchId('')
    setUsersDirectoryRestricted(false)
    setAuditTrailRestricted(false)
  }

  async function createBatch(input: CreateBatchInput): Promise<BatchViewModel> {
    if (!authSession) {
      throw new Error('Necesitas iniciar sesion para crear lotes.')
    }

    const createdBatch = await apiPost<BatchViewModel>('/api/batches', input, authSession.accessToken)
    setBatches((current) => upsertBatch(current, createdBatch))
    setWorkspaceError(null)
    setSelectedBatchId(createdBatch.id)
    return createdBatch
  }

  async function moveBatch(batchId: string, input: MoveBatchInput) {
    if (!authSession) {
      throw new Error('Necesitas iniciar sesion para mover lotes.')
    }

    const updatedBatch = await apiPost<BatchViewModel>(`/api/batches/${batchId}/movements`, input, authSession.accessToken)
    setBatches((current) => upsertBatch(current, updatedBatch))
    await refreshBatchContext(batchId)
  }

  async function changeBatchStatus(batchId: string, input: ChangeStatusInput) {
    if (!authSession) {
      throw new Error('Necesitas iniciar sesion para cambiar el estado.')
    }

    const updatedBatch = await apiPatch<BatchViewModel>(`/api/batches/${batchId}/status`, input, authSession.accessToken)
    setBatches((current) => upsertBatch(current, updatedBatch))
    await refreshBatchContext(batchId)
  }

  async function uploadDocument(batchId: string, input: UploadDocumentInput) {
    if (!authSession) {
      throw new Error('Necesitas iniciar sesion para subir documentos.')
    }

    const formData = new FormData()
    formData.append('file', input.file)

    if (input.expiresAtUtc) {
      formData.append('expiresAtUtc', new Date(`${input.expiresAtUtc}T00:00:00`).toISOString())
    }

    await apiPostForm<BatchDocumentViewModel>(`/api/batches/${batchId}/documents`, formData, authSession.accessToken)
    setBatches((current) =>
      current.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              documentsCount: batch.documentsCount + 1,
            }
          : batch,
      ),
    )
    await refreshBatchContext(batchId)
  }

  async function downloadDocument(documentId: string, fileName: string) {
    if (!authSession) {
      throw new Error('Necesitas iniciar sesion para descargar documentos protegidos.')
    }

    const blob = await apiDownload(`/api/documents/${documentId}/download`, authSession.accessToken)
    const blobUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = blobUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(blobUrl)
  }

  return (
    <GreenLedgerContext.Provider
      value={{
        authSession,
        isAuthenticated: authSession !== null,
        isAuthenticating,
        authError,
        isLoading,
        workspaceError,
        batchContextError,
        usersDirectoryRestricted,
        auditTrailRestricted,
        workerInbox,
        roleWorkspace,
        batches,
        users,
        auditTrail,
        documents,
        selectedBatchId,
        selectedBatch,
        selectedBatchAccess,
        login,
        logout,
        selectBatch: setSelectedBatchId,
        createBatch,
        moveBatch,
        changeBatchStatus,
        uploadDocument,
        downloadDocument,
      }}
    >
      {children}
    </GreenLedgerContext.Provider>
  )
}
