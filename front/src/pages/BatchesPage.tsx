import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGreenLedger } from '../app/GreenLedgerContext'
import { StatePanel } from '../components/StatePanel'
import { getRoleLabel, normalizeRole } from '../lib/batchAccess'

const PAGE_SIZE = 6

export function BatchesPage() {
  const { batches, selectedBatchId, selectBatch, isLoading, workspaceError, authSession, roleWorkspace } = useGreenLedger()
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const roleLabel = getRoleLabel(normalizeRole(authSession?.role))
  const { batchExperience } = roleWorkspace

  const stageOptions = ['all', ...new Set(batches.map((batch) => batch.currentStage))]
  const statusOptions = ['all', ...new Set(batches.map((batch) => batch.status))]

  const filteredBatches = batches.filter((batch) => {
    const matchesQuery =
      deferredQuery.length === 0 ||
      batch.batchNumber.toLowerCase().includes(deferredQuery) ||
      batch.productName.toLowerCase().includes(deferredQuery) ||
      batch.cultivarName.toLowerCase().includes(deferredQuery)
    const matchesStage = stageFilter === 'all' || batch.currentStage === stageFilter
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter

    return matchesQuery && matchesStage && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedBatches = filteredBatches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const filteredDocumentCount = filteredBatches.reduce((count, batch) => count + batch.documentsCount, 0)

  return (
    <div className="page-stack">
      {isLoading && batches.length === 0 ? (
        <StatePanel
          tone="loading"
          title="Cargando lotes"
          description="Estamos recuperando el inventario regulado para tu sesion actual."
        />
      ) : null}

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Registro de lotes</p>
            <h1>Lotes que puedes revisar</h1>
          </div>
          <p className="section-description">
            Esta vista esta preparada para {roleLabel}. Filtra rapido y abre solo los lotes que necesitas trabajar.
          </p>
        </div>

        <div className="results-strip">
          <span>{roleWorkspace.homeTitle}</span>
          <span>{filteredBatches.length} lotes visibles</span>
          {batchExperience.showDocumentsColumn ? <span>{filteredDocumentCount} documentos en el conjunto filtrado</span> : null}
          <span>
            Pagina {currentPage} de {totalPages}
          </span>
        </div>

        <div className="filter-bar">
          <label className="filter-group search-group">
            Buscar lote
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Batch, producto o cultivar"
            />
          </label>

          <label className="filter-group">
            Etapa
            <select
              value={stageFilter}
              onChange={(event) => {
                setStageFilter(event.target.value)
                setPage(1)
              }}
            >
              {stageOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Todas' : option}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-group">
            Estado
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(1)
              }}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Todos' : option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="secondary-button filter-reset"
            onClick={() => {
              setQuery('')
              setStageFilter('all')
              setStatusFilter('all')
              setPage(1)
            }}
          >
            Quitar filtros
          </button>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Lote</th>
                <th>Producto</th>
                {batchExperience.showCultivarColumn ? <th>Cultivar</th> : null}
                <th>Etapa</th>
                <th>Estado</th>
                {batchExperience.showDocumentsColumn ? <th>Docs</th> : null}
                <th>Abrir</th>
              </tr>
            </thead>
            <tbody>
              {pagedBatches.map((batch) => (
                <tr
                  key={batch.id}
                  className={batch.id === selectedBatchId ? 'selected-row' : undefined}
                  onClick={() => selectBatch(batch.id)}
                >
                  <td>{batch.batchNumber}</td>
                  <td>{batch.productName}</td>
                  {batchExperience.showCultivarColumn ? <td>{batch.cultivarName}</td> : null}
                  <td>{batch.currentStage}</td>
                  <td>
                    <span className={`status-pill status-${batch.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {batch.status}
                    </span>
                  </td>
                  {batchExperience.showDocumentsColumn ? <td>{batch.documentsCount}</td> : null}
                  <td>
                    <Link className="text-link" to={`/batches/${batch.id}`}>
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && !workspaceError && batches.length === 0 ? (
          <p className="empty-state">No hay lotes visibles para tu rol en este momento.</p>
        ) : null}

        {batches.length > 0 && filteredBatches.length === 0 ? (
          <p className="empty-state">No encontramos lotes con esos filtros. Prueba una busqueda mas simple.</p>
        ) : null}

        <div className="pagination-bar">
          <button
            type="button"
            className="secondary-button pagination-button"
            onClick={() => setPage((current) => Math.max(1, Math.min(current, totalPages) - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <button
            type="button"
            className="secondary-button pagination-button"
            onClick={() => setPage((current) => Math.min(totalPages, Math.min(current, totalPages) + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
      </section>
    </div>
  )
}
