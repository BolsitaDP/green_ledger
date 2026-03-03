import { useGreenLedger } from '../app/GreenLedgerContext'
import { StatePanel } from '../components/StatePanel'

export function ControlCenterPage() {
  const { users, batches, isLoading, workspaceError, usersDirectoryRestricted } = useGreenLedger()
  const activeUsers = users.filter((user) => user.isActive).length
  const roleCoverage = Object.entries(
    users.reduce<Record<string, number>>((summary, user) => {
      summary[user.role] = (summary[user.role] ?? 0) + 1
      return summary
    }, {}),
  )
  const stageCoverage = Object.entries(
    batches.reduce<Record<string, number>>((summary, batch) => {
      summary[batch.currentStage] = (summary[batch.currentStage] ?? 0) + 1
      return summary
    }, {}),
  )

  if (usersDirectoryRestricted) {
    return (
      <div className="page-stack">
        <StatePanel
          title="Este modulo no corresponde a tu rol"
          description="Tu sesion puede operar sobre lotes, pero no tiene permiso para consultar el directorio del equipo."
        />
      </div>
    )
  }

  return (
    <div className="page-stack">
      {isLoading && users.length === 0 && batches.length === 0 ? (
        <StatePanel
          tone="loading"
          title="Cargando equipo y cobertura"
          description="Estamos consolidando usuarios visibles, roles y distribucion operativa."
        />
      ) : null}

      {!isLoading && !workspaceError && !usersDirectoryRestricted && users.length === 0 ? (
        <StatePanel
          title="Todavia no hay usuarios visibles"
          description="Cuando existan usuarios dentro del alcance actual, apareceran en este modulo."
        />
      ) : null}

      <section className="hero-card">
        <div>
          <span className="section-kicker">Equipo y acceso</span>
          <h1>Supervision operativa sobre usuarios, roles y cobertura.</h1>
          <p className="section-description wide-description">
            Revisa quienes estan visibles en el entorno, como se distribuye la operacion por rol y donde se concentra
            la carga de seguimiento.
          </p>
        </div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <span>Usuarios visibles</span>
          <strong>{usersDirectoryRestricted ? '-' : users.length}</strong>
        </article>
        <article className="stat-card">
          <span>Usuarios activos</span>
          <strong>{usersDirectoryRestricted ? '-' : activeUsers}</strong>
        </article>
        <article className="stat-card">
          <span>Roles con cobertura</span>
          <strong>{usersDirectoryRestricted ? '-' : roleCoverage.length}</strong>
        </article>
        <article className="stat-card">
          <span>Lotes en alcance</span>
          <strong>{batches.length}</strong>
        </article>
      </section>

      <section className="content-columns">
        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Cobertura por rol</p>
              <h1>Distribucion de acceso</h1>
            </div>
          </div>
          {usersDirectoryRestricted ? (
            <p className="empty-state">Tu rol no puede consultar la distribucion completa de usuarios.</p>
          ) : (
            <div className="coverage-grid">
              {roleCoverage.map(([role, total]) => (
                <article key={role} className="status-card">
                  <span>{role}</span>
                  <strong>{total}</strong>
                  <p>{total === 1 ? 'usuario visible' : 'usuarios visibles'}</p>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Cobertura por etapa</p>
              <h2>Carga operativa</h2>
            </div>
          </div>
          <div className="coverage-grid">
            {stageCoverage.map(([stage, total]) => (
              <article key={stage} className="status-card">
                <span>{stage}</span>
                <strong>{total}</strong>
                <p>{total === 1 ? 'lote en seguimiento' : 'lotes en seguimiento'}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Usuarios visibles</p>
            <h2>Participantes del entorno</h2>
          </div>
        </div>
        {usersDirectoryRestricted ? (
          <p className="empty-state">Este modulo requiere permiso `UserRead`.</p>
        ) : (
          <div className="users-list">
            {users.map((user) => (
              <article key={user.id} className="user-card">
                <strong>{user.fullName}</strong>
                <span>{user.role}</span>
                <p>{user.email}</p>
                <span className={`status-pill ${user.isActive ? 'status-active' : 'status-archived'}`}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
