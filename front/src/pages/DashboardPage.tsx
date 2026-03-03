import { Link } from 'react-router-dom'
import { useGreenLedger } from '../app/GreenLedgerContext'
import { StatePanel } from '../components/StatePanel'
import { canCreateBatch } from '../lib/roleWorkspace'

export function DashboardPage() {
  const { batches, selectedBatch, authSession, isLoading, workspaceError, workerInbox, roleWorkspace } = useGreenLedger()
  const topTasks = workerInbox.slice(0, 4)
  const canCreate = canCreateBatch(authSession?.role)
  const { batchExperience } = roleWorkspace

  return (
    <div className="page-stack">
      {isLoading && batches.length === 0 ? (
        <StatePanel
          tone="loading"
          title="Cargando tus tareas"
          description="Estamos preparando la vista principal con lo que necesitas hacer hoy."
        />
      ) : null}

      {workspaceError ? (
        <StatePanel
          tone="error"
          title="No pudimos abrir tu entorno de trabajo"
          description={workspaceError}
        />
      ) : null}

      <section className="hero-card">
        <div>
          <span className="section-kicker">Mi trabajo</span>
          <h1>{roleWorkspace.homeTitle}</h1>
          <p className="section-description wide-description">{roleWorkspace.homeDescription}</p>
        </div>

        <div className="hero-actions">
          <Link className="auth-button" to={roleWorkspace.primaryActionTo}>
            {roleWorkspace.primaryActionLabel}
          </Link>
          <div className="hero-pills">
            <span>{workerInbox.length} tareas pendientes</span>
            <span>{selectedBatch?.batchNumber ?? 'Sin lote abierto'}</span>
          </div>
        </div>
      </section>

      {topTasks.length > 0 ? (
        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Lo que te toca hoy</p>
              <h2>Tareas pendientes</h2>
            </div>
          </div>

          <div className="task-list-grid">
            {topTasks.map((task) => (
              <article key={task.id} className={`task-list-card task-list-card-${task.priority}`}>
                <span className="detail-label">Prioridad {task.priority === 'high' ? 'alta' : 'media'}</span>
                <strong>{task.title}</strong>
                <p>{task.summary}</p>
                <Link className="text-link" to={task.to}>
                  {task.actionLabel}
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {topTasks.length === 0 && canCreate ? (
        <StatePanel
          title="No tienes tareas pendientes"
          description="Puedes crear un nuevo lote cuando empiece una nueva corrida de producto."
        />
      ) : null}

      {topTasks.length === 0 && !canCreate ? (
        <StatePanel
          title="No tienes tareas pendientes"
          description="Cuando un lote necesite una accion de tu rol, lo veras aqui primero."
        />
      ) : null}

      {selectedBatch ? (
        <section className="content-columns">
          <article className="section-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Lote en foco</p>
                <h2>{selectedBatch.batchNumber}</h2>
              </div>
            </div>
            <div className="spotlight-grid">
              <article className="summary-panel">
                <span className="detail-label">Producto</span>
                <strong>{selectedBatch.productName}</strong>
                {batchExperience.showCultivarColumn ? <p>Cultivar: {selectedBatch.cultivarName}</p> : null}
                <p>Etapa: {selectedBatch.currentStage}</p>
                <p>Estado: {selectedBatch.status}</p>
              </article>
              <article className="summary-panel">
                <span className="detail-label">Siguiente paso</span>
                <strong>{new Date(selectedBatch.lastMovementAtUtc).toLocaleString('es-CO')}</strong>
                <p>Si este es el lote que estas trabajando, abre el detalle para seguir.</p>
                <Link className="text-link" to={`/batches/${selectedBatch.id}`}>
                  Abrir detalle del lote
                </Link>
              </article>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  )
}
