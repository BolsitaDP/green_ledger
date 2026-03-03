import { Link, NavLink, Outlet } from 'react-router-dom'
import { useGreenLedger } from '../app/GreenLedgerContext'
import { getRoleLabel, normalizeRole } from '../lib/batchAccess'

export function AppShell() {
  const {
    authSession,
    logout,
    selectedBatch,
    workerInbox,
    roleWorkspace,
    isLoading,
    workspaceError,
    batchContextError,
  } = useGreenLedger()
  const roleLabel = getRoleLabel(normalizeRole(authSession?.role))
  const sidebarTasks = workerInbox.slice(0, 3)

  return (
    <div className="shell-layout">
      <aside className="shell-sidebar">
        <div className="brand-block">
          <span className="brand-kicker">GreenLedger</span>
          <strong>{roleWorkspace.homeTitle}</strong>
          <p>{roleWorkspace.homeDescription}</p>
        </div>

        <nav className="shell-nav">
          {roleWorkspace.navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-quick-action">
          <span className="detail-label">Acceso rapido</span>
          <strong>{roleWorkspace.primaryActionLabel}</strong>
          <p>Usa esta opcion para empezar tu tarea principal sin dar vueltas por el sistema.</p>
          <Link className="auth-button" to={roleWorkspace.primaryActionTo}>
            {roleWorkspace.primaryActionLabel}
          </Link>
        </div>

        <div className="sidebar-task-list">
          <span className="detail-label">Pendientes</span>
          <strong>{sidebarTasks.length > 0 ? 'Lo primero de hoy' : 'Sin tareas urgentes'}</strong>
          {sidebarTasks.length > 0 ? (
            sidebarTasks.map((task) => (
              <Link key={task.id} to={task.to} className={`sidebar-task-link sidebar-task-link-${task.priority}`}>
                <strong>{task.title}</strong>
                <span>{task.summary}</span>
              </Link>
            ))
          ) : (
            <p className="empty-state">Cuando un lote necesite una accion de tu rol, lo veras aqui.</p>
          )}
        </div>

        <div className="sidebar-status">
          <article>
            <span>Rol actual</span>
            <strong>{roleLabel}</strong>
          </article>
          <article>
            <span>Tareas pendientes</span>
            <strong>{workerInbox.length}</strong>
          </article>
          <article>
            <span>Lote en foco</span>
            <strong>{selectedBatch?.batchNumber ?? 'Sin seleccion'}</strong>
          </article>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div>
            <span className="topbar-label">Sesion activa</span>
            <strong>{authSession?.email}</strong>
          </div>

          <div className="topbar-actions">
            <div className="topbar-pill">
              <span>Rol</span>
              <strong>{roleLabel}</strong>
            </div>
            <button type="button" className="auth-button secondary-button" onClick={() => void logout()}>
              Cerrar sesion
            </button>
          </div>
        </header>

        <div className="shell-alert-stack">
          {isLoading ? <p className="info-banner">Actualizando datos del entorno...</p> : null}
          {workspaceError ? <p className="error-banner">{workspaceError}</p> : null}
          {batchContextError ? <p className="error-banner">{batchContextError}</p> : null}
        </div>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
