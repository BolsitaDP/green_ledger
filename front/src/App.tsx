import { useEffect, useState } from 'react'
import './App.css'
import { apiGet } from './lib/api'
import {
  architectureLayers,
  demoAuditTrailByBatchId,
  demoBatches,
  demoUsers,
  implementationPhases,
  roleCards,
} from './mockData'
import type { AuditTrailItemViewModel, BatchViewModel, UserSummaryViewModel } from './types'

async function loadBatches(): Promise<{ data: BatchViewModel[]; source: 'api' | 'mock' }> {
  try {
    const data = await apiGet<BatchViewModel[]>('/api/batches')
    return { data, source: 'api' }
  } catch {
    return { data: demoBatches, source: 'mock' }
  }
}

async function loadUsers(): Promise<UserSummaryViewModel[]> {
  try {
    return await apiGet<UserSummaryViewModel[]>('/api/users')
  } catch {
    return demoUsers
  }
}

async function loadAuditTrail(batchId: string): Promise<AuditTrailItemViewModel[]> {
  try {
    return await apiGet<AuditTrailItemViewModel[]>(`/api/batches/${batchId}/audit`)
  } catch {
    return demoAuditTrailByBatchId[batchId] ?? []
  }
}

function App() {
  const [batches, setBatches] = useState<BatchViewModel[]>(demoBatches)
  const [users, setUsers] = useState<UserSummaryViewModel[]>(demoUsers)
  const [selectedBatchId, setSelectedBatchId] = useState<string>(demoBatches[0]?.id ?? '')
  const [auditTrail, setAuditTrail] = useState<AuditTrailItemViewModel[]>(demoAuditTrailByBatchId[demoBatches[0]?.id ?? ''] ?? [])
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void Promise.all([loadBatches(), loadUsers()]).then(([batchResult, userResult]) => {
      if (cancelled) {
        return
      }

      setBatches(batchResult.data)
      setUsers(userResult)
      setDataSource(batchResult.source)
      setSelectedBatchId(batchResult.data[0]?.id ?? '')
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedBatchId) {
      setAuditTrail([])
      return
    }

    let cancelled = false

    void loadAuditTrail(selectedBatchId).then((entries) => {
      if (!cancelled) {
        setAuditTrail(entries)
      }
    })

    return () => {
      cancelled = true
    }
  }, [selectedBatchId])

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) ?? batches[0]

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">GreenLedger</span>
          <h1>Regulatory Compliance & Traceability Platform</h1>
          <p className="hero-text">
            Este mini demo muestra la idea central del producto: un lote medico, sus
            movimientos, sus documentos y la base de auditoria que despues volveremos real en el backend.
          </p>
          <div className="hero-pills">
            <span>React frontend</span>
            <span>ASP.NET Core backend</span>
            <span>PostgreSQL + Redis</span>
          </div>
        </div>

        <div className="hero-panel">
          <p className="panel-label">Estado del demo</p>
          <div className="status-card">
            <strong>{isLoading ? 'Cargando datos...' : dataSource === 'api' ? 'Conectado a API' : 'Modo demo local'}</strong>
            <span>
              {dataSource === 'api'
                ? 'El front esta leyendo la API del backend.'
                : 'Como el backend aun no corre en tu maquina, el front usa datos simulados.'}
            </span>
          </div>
          <div className="metric-grid">
            <article>
              <strong>{batches.length}</strong>
              <span>Lotes visibles</span>
            </article>
            <article>
              <strong>{users.length}</strong>
              <span>Usuarios demo</span>
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
              Piensa en esto como la historia completa de un producto: nace en cultivo,
              pasa por laboratorio y termina en distribucion.
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
              Esta tabla es el corazon del producto. Luego aqui agregaremos filtros, paginacion y auditoria real.
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
              Cada rol vera y hara cosas diferentes. Eso evita errores y ayuda al cumplimiento.
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
              La empresa opera dentro de la app. Cada persona tiene un rol y por eso no todos hacen lo mismo.
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
              Esto es lo importante del producto: puedes reconstruir quien hizo que sobre el lote {selectedBatch?.batchNumber ?? 'seleccionado'}.
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
                    <strong>{entry.actorEmail}</strong> actuó como <strong>{entry.actorRole}</strong>.
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
