import { useEffect, useState, type FormEvent } from 'react'
import './App.css'
import { ApiError, apiDownload, apiGet, apiPost } from './lib/api'
import {
  architectureLayers,
  demoAuditTrailByBatchId,
  demoBatches,
  demoDocumentsByBatchId,
  demoUsers,
  implementationPhases,
  roleCards,
} from './mockData'
import type {
  AuditTrailItemViewModel,
  AuthSession,
  BatchDocumentViewModel,
  BatchViewModel,
  UserSummaryViewModel,
} from './types'

const authStorageKey = 'greenledger.auth.session'

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

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

async function loadBatches(accessToken?: string): Promise<{ data: BatchViewModel[]; source: 'api' | 'mock' }> {
  if (!accessToken) {
    return { data: demoBatches, source: 'mock' }
  }

  try {
    const data = await apiGet<BatchViewModel[]>('/api/batches', accessToken)
    return { data, source: 'api' }
  } catch (error) {
    if (isUnauthorizedError(error)) {
      throw error
    }

    return { data: demoBatches, source: 'mock' }
  }
}

async function loadUsers(accessToken?: string): Promise<UserSummaryViewModel[]> {
  if (!accessToken) {
    return demoUsers
  }

  try {
    return await apiGet<UserSummaryViewModel[]>('/api/users', accessToken)
  } catch {
    return demoUsers
  }
}

async function loadAuditTrail(batchId: string, accessToken?: string): Promise<AuditTrailItemViewModel[]> {
  if (!accessToken) {
    return demoAuditTrailByBatchId[batchId] ?? []
  }

  try {
    return await apiGet<AuditTrailItemViewModel[]>(`/api/batches/${batchId}/audit`, accessToken)
  } catch {
    return demoAuditTrailByBatchId[batchId] ?? []
  }
}

async function loadDocuments(batchId: string, accessToken?: string): Promise<BatchDocumentViewModel[]> {
  if (!accessToken) {
    return demoDocumentsByBatchId[batchId] ?? []
  }

  try {
    return await apiGet<BatchDocumentViewModel[]>(`/api/batches/${batchId}/documents`, accessToken)
  } catch {
    return demoDocumentsByBatchId[batchId] ?? []
  }
}

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => readStoredSession())
  const [loginEmail, setLoginEmail] = useState('camila.cultivation@greenledger.com')
  const [loginPassword, setLoginPassword] = useState('GreenLedger123!')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [batches, setBatches] = useState<BatchViewModel[]>(demoBatches)
  const [users, setUsers] = useState<UserSummaryViewModel[]>(demoUsers)
  const [selectedBatchId, setSelectedBatchId] = useState<string>(demoBatches[0]?.id ?? '')
  const [auditTrail, setAuditTrail] = useState<AuditTrailItemViewModel[]>(
    demoAuditTrailByBatchId[demoBatches[0]?.id ?? ''] ?? [],
  )
  const [documents, setDocuments] = useState<BatchDocumentViewModel[]>(
    demoDocumentsByBatchId[demoBatches[0]?.id ?? ''] ?? [],
  )
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    persistSession(authSession)
  }, [authSession])

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)

    void Promise.all([loadBatches(authSession?.accessToken), loadUsers(authSession?.accessToken)])
      .then(([batchResult, userResult]) => {
        if (cancelled) {
          return
        }

        setBatches(batchResult.data)
        setUsers(userResult)
        setDataSource(batchResult.source)
        setSelectedBatchId(batchResult.data[0]?.id ?? '')
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return
        }

        if (isUnauthorizedError(error)) {
          setAuthSession(null)
          setAuthError('La sesion expiro o ya no es valida. Inicia sesion otra vez.')
        }

        setBatches(demoBatches)
        setUsers(demoUsers)
        setDataSource('mock')
        setSelectedBatchId(demoBatches[0]?.id ?? '')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authSession?.accessToken])

  useEffect(() => {
    if (!selectedBatchId) {
      setAuditTrail([])
      setDocuments([])
      return
    }

    let cancelled = false

    void loadAuditTrail(selectedBatchId, authSession?.accessToken).then((entries) => {
      if (!cancelled) {
        setAuditTrail(entries)
      }
    })

    void loadDocuments(selectedBatchId, authSession?.accessToken).then((items) => {
      if (!cancelled) {
        setDocuments(items)
      }
    })

    return () => {
      cancelled = true
    }
  }, [selectedBatchId, authSession?.accessToken])

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) ?? batches[0]
  const isAuthenticated = authSession !== null

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAuthenticating(true)
    setAuthError(null)

    try {
      const session = await apiPost<AuthSession>('/api/auth/login', {
        email: loginEmail,
        password: loginPassword,
      })

      setAuthSession(session)
      setDownloadError(null)
    } catch (error) {
      setAuthError(
        error instanceof ApiError && error.status === 401
          ? 'Credenciales invalidas. Revisa el correo y la clave.'
          : 'No pude iniciar sesion contra la API. Verifica que el backend este corriendo.',
      )
    } finally {
      setIsAuthenticating(false)
    }
  }

  async function handleLogout() {
    if (authSession) {
      try {
        await apiPost<void>('/api/auth/logout', { refreshToken: authSession.refreshToken })
      } catch {
      }
    }

    setAuthSession(null)
    setAuthError(null)
    setDownloadError(null)
  }

  async function handleDownloadDocument(documentId: string, fileName: string) {
    if (!authSession) {
      setDownloadError('Necesitas iniciar sesion para descargar documentos protegidos.')
      return
    }

    try {
      setDownloadError(null)
      const blob = await apiDownload(`/api/documents/${documentId}/download`, authSession.accessToken)
      const blobUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = blobUrl
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(blobUrl)
    } catch {
      setDownloadError('No pude descargar el archivo. Revisa la sesion o que la API siga corriendo.')
    }
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">GreenLedger</span>
          <h1>Regulatory Compliance & Traceability Platform</h1>
          <p className="hero-text">
            Este mini demo ya muestra el ciclo principal del producto: una sesion real, lotes protegidos por
            permisos, documentos regulados y una traza que despues seguiremos endureciendo.
          </p>
          <div className="hero-pills">
            <span>React frontend</span>
            <span>ASP.NET Core backend</span>
            <span>PostgreSQL + Redis</span>
          </div>
        </div>

        <div className="hero-panel">
          <p className="panel-label">Sesion y estado</p>
          {isAuthenticated ? (
            <div className="auth-card">
              <strong>{authSession.email}</strong>
              <span>Rol activo: {authSession.role}</span>
              <span>Token vence: {new Date(authSession.accessTokenExpiresAtUtc).toLocaleString('es-CO')}</span>
              <button type="button" className="auth-button secondary-button" onClick={handleLogout}>
                Cerrar sesion
              </button>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleLoginSubmit}>
              <label>
                Correo demo
                <input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
              </label>
              <label>
                Clave demo
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
              </label>
              <button type="submit" className="auth-button" disabled={isAuthenticating}>
                {isAuthenticating ? 'Entrando...' : 'Iniciar sesion'}
              </button>
              <p className="helper-text">
                Usa por ejemplo `camila.cultivation@greenledger.com` con `GreenLedger123!`.
              </p>
            </form>
          )}
          {authError ? <p className="error-banner">{authError}</p> : null}
          <div className="status-card">
            <strong>
              {isLoading ? 'Cargando datos...' : dataSource === 'api' ? 'Conectado a API protegida' : 'Modo demo local'}
            </strong>
            <span>
              {dataSource === 'api'
                ? 'El front esta leyendo la API del backend con JWT en las requests.'
                : 'Si no hay sesion valida o la API no responde, el front usa datos simulados.'}
            </span>
          </div>
          <div className="metric-grid">
            <article>
              <strong>{batches.length}</strong>
              <span>Lotes visibles</span>
            </article>
            <article>
              <strong>{users.length}</strong>
              <span>Usuarios visibles</span>
            </article>
            <article>
              <strong>{auditTrail.length}</strong>
              <span>Eventos auditables</span>
            </article>
          </div>
        </div>
      </header>

      <main className="content-grid">
        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Concepto funcional</p>
              <h2>Flujo del lote</h2>
            </div>
            <p className="section-description">
              Piensa en esto como la historia completa de un producto: nace en cultivo, pasa por laboratorio y termina
              en distribucion.
            </p>
          </div>

          <div className="timeline">
            <div>
              <strong>1. Cultivo</strong>
              <span>Se crea el lote y se registra su origen.</span>
            </div>
            <div>
              <strong>2. Laboratorio</strong>
              <span>Se adjuntan certificados y resultados de calidad.</span>
            </div>
            <div>
              <strong>3. Distribucion</strong>
              <span>Se registra la liberacion regulatoria y salida.</span>
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Arquitectura para dummies</p>
              <h2>Que hace cada capa</h2>
            </div>
            <p className="section-description">
              Separar capas evita mezclar todo y te permite crecer el proyecto sin caos.
            </p>
          </div>

          <div className="layer-grid">
            {architectureLayers.map((layer) => (
              <article key={layer.name} className="layer-card">
                <p>{layer.name}</p>
                <strong>{layer.job}</strong>
                <span>{layer.plainExplanation}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section-card wide-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Trazabilidad</p>
              <h2>Lotes monitoreados</h2>
            </div>
            <p className="section-description">
              Esta tabla ya depende de autenticacion. Si no inicias sesion, veras el modo mock local.
            </p>
          </div>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Producto</th>
                  <th>Cultivar</th>
                  <th>Etapa</th>
                  <th>Estado</th>
                  <th>Docs</th>
                  <th>Ultimo movimiento</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className={batch.id === selectedBatchId ? 'selected-row' : undefined}
                    onClick={() => setSelectedBatchId(batch.id)}
                  >
                    <td>{batch.batchNumber}</td>
                    <td>{batch.productName}</td>
                    <td>{batch.cultivarName}</td>
                    <td>{batch.currentStage}</td>
                    <td>
                      <span className={`status-pill status-${batch.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td>{batch.documentsCount}</td>
                    <td>{new Date(batch.lastMovementAtUtc).toLocaleDateString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Seguridad y negocio</p>
              <h2>Roles del sistema</h2>
            </div>
            <p className="section-description">
              Cada rol ve y hace cosas diferentes. Ya puedes probarlo entrando con usuarios distintos.
            </p>
          </div>

          <div className="role-grid">
            {roleCards.map((role) => (
              <article key={role.name} className="role-card">
                <p>{role.name}</p>
                <strong>{role.mainPower}</strong>
                <span>{role.simpleExplanation}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Actores reales</p>
              <h2>Usuarios que usan el sistema</h2>
            </div>
            <p className="section-description">
              El backend decide quienes se pueden listar. Regulador y compliance ven mas que cultivo.
            </p>
          </div>

          <div className="users-list">
            {users.map((user) => (
              <article key={user.id} className="user-card">
                <strong>{user.fullName}</strong>
                <span>{user.role}</span>
                <p>{user.email}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-card wide-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Audit trail</p>
              <h2>Historial del lote seleccionado</h2>
            </div>
            <p className="section-description">
              Esto es lo importante del producto: puedes reconstruir quien hizo que sobre el lote{' '}
              {selectedBatch?.batchNumber ?? 'seleccionado'}.
            </p>
          </div>

          <div className="audit-shell">
            {auditTrail.length > 0 ? (
              auditTrail.map((entry) => (
                <article key={entry.id} className="audit-card">
                  <div className="audit-header">
                    <strong>{entry.action.replaceAll('_', ' ')}</strong>
                    <span>{new Date(entry.occurredAtUtc).toLocaleString('es-CO')}</span>
                  </div>
                  <p>
                    <strong>{entry.actorEmail}</strong> actuo como <strong>{entry.actorRole}</strong>.
                  </p>
                  {entry.reason ? <p>{entry.reason}</p> : null}
                  <div className="audit-json-grid">
                    <div>
                      <span>Antes</span>
                      <code>{entry.oldValuesJson ?? 'Sin valor previo'}</code>
                    </div>
                    <div>
                      <span>Despues</span>
                      <code>{entry.newValuesJson ?? 'Sin valor nuevo'}</code>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">Selecciona un lote para revisar su traza auditable.</p>
            )}
          </div>
        </section>

        <section className="section-card wide-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Documentos regulatorios</p>
              <h2>Evidencia del lote seleccionado</h2>
            </div>
            <p className="section-description">
              Cada archivo guarda integridad, versionado y fecha de vencimiento. La descarga ahora manda JWT.
            </p>
          </div>

          <div className="documents-grid">
            {documents.length > 0 ? (
              documents.map((document) => (
                <article key={document.id} className="document-card">
                  <div className="audit-header">
                    <strong>{document.fileName}</strong>
                    <span>v{document.version}</span>
                  </div>
                  <p>{document.contentType}</p>
                  <p>
                    SHA256: <code>{document.sha256Hash}</code>
                  </p>
                  <p>
                    Vence:{' '}
                    {document.expiresAtUtc
                      ? new Date(document.expiresAtUtc).toLocaleDateString('es-CO')
                      : 'Sin vencimiento'}
                  </p>
                  <button
                    type="button"
                    className="download-link"
                    onClick={() => handleDownloadDocument(document.id, document.fileName)}
                  >
                    Descargar
                  </button>
                </article>
              ))
            ) : (
              <p className="empty-state">Este lote aun no tiene documentos registrados.</p>
            )}
          </div>
          {downloadError ? <p className="error-banner">{downloadError}</p> : null}
        </section>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Plan realista</p>
              <h2>Roadmap 30-60-90</h2>
            </div>
            <p className="section-description">
              No vamos a intentar construir un monstruo el primer dia. Primero base sana, luego complejidad.
            </p>
          </div>

          <div className="roadmap-list">
            {implementationPhases.map((phase) => (
              <article key={phase.title}>
                <p>{phase.title}</p>
                <strong>{phase.goal}</strong>
                <span>{phase.explanation}</span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
