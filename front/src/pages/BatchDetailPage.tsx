import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useGreenLedger } from '../app/GreenLedgerContext'
import { useToast } from '../app/toastContext'
import { BatchOperationsPanel } from '../components/BatchOperationsPanel'
import { StatePanel } from '../components/StatePanel'
import { getUserFacingErrorMessage } from '../lib/http'

export function BatchDetailPage() {
  const { batchId } = useParams()
  const { showToast } = useToast()
  const {
    batches,
    selectedBatch,
    selectedBatchAccess,
    auditTrail,
    documents,
    selectBatch,
    moveBatch,
    changeBatchStatus,
    uploadDocument,
    downloadDocument,
    isLoading,
    roleWorkspace,
  } = useGreenLedger()

  useEffect(() => {
    if (batchId) {
      selectBatch(batchId)
    }
  }, [batchId, selectBatch])

  const batchExists = batchId ? batches.some((batch) => batch.id === batchId) : Boolean(selectedBatch)
  const { batchExperience } = roleWorkspace
  const visibleRequirements =
    selectedBatchAccess && batchExperience.showRequirements
      ? batchExperience.requirementScope === 'owned'
        ? selectedBatchAccess.requirements.filter((requirement) => requirement.ownerRole === selectedBatchAccess.roleLabel)
        : selectedBatchAccess.requirements
      : []

  if (isLoading && !selectedBatch) {
    return (
      <div className="page-stack">
        <StatePanel
          tone="loading"
          title="Cargando detalle del lote"
          description="Estamos recuperando el contexto operativo del lote."
        />
      </div>
    )
  }

  if (!batchExists) {
    return (
      <div className="page-stack">
        <section className="section-card">
          <p className="empty-state">El lote no esta disponible dentro del alcance visible para tu rol actual.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Detalle del lote</p>
            <h1>{selectedBatch ? `${selectedBatch.batchNumber} - ${selectedBatch.productName}` : 'Detalle del lote'}</h1>
          </div>
          <p className="section-description">Aqui ves solo lo necesario para trabajar este lote desde tu rol.</p>
        </div>

        {selectedBatch && selectedBatchAccess ? (
          <div className="batch-detail-shell">
            <div className="batch-detail-overview">
              <article className="detail-panel">
                <span className="detail-label">Identidad</span>
                <strong>{selectedBatch.batchNumber}</strong>
                <p>Producto: {selectedBatch.productName}</p>
                {batchExperience.showCultivarColumn ? <p>Cultivar: {selectedBatch.cultivarName}</p> : null}
                <p>Etapa: {selectedBatch.currentStage}</p>
                <p>Estado: {selectedBatch.status}</p>
              </article>

              <article className="detail-panel">
                <span className="detail-label">Siguiente paso</span>
                <strong>{selectedBatchAccess.nextActionLabel}</strong>
                <p>{selectedBatchAccess.operationalSummary}</p>
                <p>Ultimo movimiento: {new Date(selectedBatch.lastMovementAtUtc).toLocaleString('es-CO')}</p>
              </article>

              {batchExperience.showGovernancePanel ? (
                <article className="detail-panel">
                  <span className="detail-label">Control</span>
                  <strong>{selectedBatchAccess.roleLabel}</strong>
                  <p>Visibilidad: {selectedBatchAccess.visibilityLabel}</p>
                  <p>Responsable de etapa: {selectedBatchAccess.stageOwnerLabel}</p>
                  <p>Lectura operativa: {selectedBatchAccess.operationalStatusLabel}</p>
                </article>
              ) : null}
            </div>

            {batchExperience.showTemplatePanel ? (
              <div className="workflow-grid">
                <article className="section-subcard">
                  <span className="detail-label">Plantilla operativa</span>
                  <strong>{selectedBatchAccess.productTemplateLabel}</strong>
                  <p>{selectedBatchAccess.productTemplateDescription}</p>
                </article>
                <article className="section-subcard">
                  <span className="detail-label">Tu trabajo ahora</span>
                  <strong>{selectedBatchAccess.roleLabel}</strong>
                  <p>Estas tareas se calculan para tu rol y para el estado actual del lote.</p>
                </article>
              </div>
            ) : null}

            <div className="worker-task-grid">
              {selectedBatchAccess.workerTasks.map((task) => (
                <article key={task.id} className={`task-card ${task.blocked ? 'task-card-blocked' : 'task-card-active'}`}>
                  <span className="detail-label">Tarea del rol</span>
                  <strong>{task.title}</strong>
                  <p>{task.summary}</p>
                  <p>{task.actionLabel}</p>
                </article>
              ))}
            </div>

            {batchExperience.showRequirements ? (
              <section className="section-subcard">
                <span className="detail-label">Checklist</span>
                <strong>Requisitos que debes seguir</strong>
                {visibleRequirements.length > 0 ? (
                  <div className="requirement-grid compact-grid">
                    {visibleRequirements.map((requirement) => (
                      <article
                        key={requirement.id}
                        className={`requirement-card ${
                          requirement.status === 'complete' ? 'requirement-complete' : 'requirement-missing'
                        }`}
                      >
                        <div className="permission-header">
                          <strong>{requirement.label}</strong>
                          <span>{requirement.status === 'complete' ? 'Completo' : 'Pendiente'}</span>
                        </div>
                        <p>Responsable: {requirement.ownerRole}</p>
                        <p>{requirement.guidance}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">Por ahora este lote no tiene requisitos visibles asignados directamente a tu rol.</p>
                )}
              </section>
            ) : null}

            {batchExperience.showSuggestedActions ? (
              <div className="suggested-actions-grid">
                {selectedBatchAccess.suggestedActions.map((suggestion) => (
                  <article key={suggestion.id} className={`suggested-action-card suggested-action-${suggestion.tone}`}>
                    <span className="detail-label">Accion sugerida</span>
                    <strong>{suggestion.title}</strong>
                    <p>{suggestion.summary}</p>
                    <p>{suggestion.whyNow}</p>
                    <p>{suggestion.outcome}</p>
                  </article>
                ))}
              </div>
            ) : null}

            {batchExperience.showPermissions ? (
              <div className="permission-grid">
                {selectedBatchAccess.actions.map((action) => (
                  <article
                    key={action.id}
                    className={`permission-card ${action.allowed ? 'permission-allowed' : 'permission-blocked'}`}
                  >
                    <div className="permission-header">
                      <strong>{action.title}</strong>
                      <span>{action.allowed ? 'Habilitado' : 'Restringido'}</span>
                    </div>
                    <p>{action.description}</p>
                    <p>{action.reason}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <BatchOperationsPanel
        selectedBatch={selectedBatch}
        access={selectedBatchAccess}
        onMoveBatch={moveBatch}
        onChangeStatus={changeBatchStatus}
        onUploadDocument={uploadDocument}
      />

      {(batchExperience.showAudit || batchExperience.showDocuments) && selectedBatch ? (
        <section className="content-columns">
          {batchExperience.showAudit ? (
            <article className="section-card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Auditoria</p>
                  <h2>Decisiones registradas</h2>
                </div>
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
                    </article>
                  ))
                ) : (
                  <p className="empty-state">No hay eventos de auditoria visibles para este lote.</p>
                )}
              </div>
            </article>
          ) : null}

          {batchExperience.showDocuments ? (
            <article className="section-card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Documentos</p>
                  <h2>Evidencia protegida</h2>
                </div>
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
                      <p>Vence: {document.expiresAtUtc ? new Date(document.expiresAtUtc).toLocaleDateString('es-CO') : 'Sin fecha'}</p>
                      <button
                        type="button"
                        className="download-link"
                        onClick={() => {
                          void downloadDocument(document.id, document.fileName)
                            .then(() => {
                              showToast({
                                tone: 'success',
                                title: 'Documento descargado',
                                description: `${document.fileName} ya esta listo en tu equipo.`,
                              })
                            })
                            .catch((error: unknown) => {
                              showToast({
                                tone: 'error',
                                title: 'No pudimos descargar el documento',
                                description: getUserFacingErrorMessage(error, 'No pudimos descargar el documento.'),
                              })
                            })
                        }}
                      >
                        Descargar archivo
                      </button>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">Este lote aun no tiene evidencia documental registrada.</p>
                )}
              </div>
            </article>
          ) : null}
        </section>
      ) : null}

      {batchExperience.showEducation && selectedBatch ? (
        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Que significa este lote</p>
              <h2>Objeto de trabajo del proceso</h2>
            </div>
          </div>
          <div className="spotlight-grid">
            <article className="summary-panel">
              <span className="detail-label">Que es un lote</span>
              <strong>{selectedBatch.batchNumber}</strong>
              <p>
                Un lote es una unidad concreta de produccion que agrupa producto, cultivar, etapa, documentos y
                decisiones de control bajo una misma identidad.
              </p>
              <p>
                Todo lo importante del proceso queda colgado de ese lote: quien lo movio, que evidencia tiene y en que
                estado regulatorio se encuentra.
              </p>
            </article>
            <article className="summary-panel">
              <span className="detail-label">Que hace cada accion</span>
              <strong>Sobre el lote actual</strong>
              <p>Crear lote: abre una nueva unidad de trabajo con identidad propia.</p>
              <p>Mover etapa: cambia en que parte del proceso operativo esta el lote.</p>
              <p>Cambiar estado: decide si el lote sigue, se retiene o queda listo para liberar.</p>
              <p>Subir documento: agrega evidencia que respalda decisiones y trazabilidad.</p>
            </article>
          </div>
        </section>
      ) : null}
    </div>
  )
}
