import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import type { BatchDetailAccessViewModel } from '../lib/batchAccess'
import { getUserFacingErrorMessage } from '../lib/http'
import type { BatchViewModel } from '../types'
import { useToast } from '../app/toastContext'

type MoveBatchInput = {
  toStage: string
  notes: string
}

type ChangeStatusInput = {
  status: string
  reason: string
}

type UploadDocumentInput = {
  file: File
  expiresAtUtc?: string
}

type Props = {
  selectedBatch?: BatchViewModel
  access: BatchDetailAccessViewModel | null
  onMoveBatch: (batchId: string, input: MoveBatchInput) => Promise<void>
  onChangeStatus: (batchId: string, input: ChangeStatusInput) => Promise<void>
  onUploadDocument: (batchId: string, input: UploadDocumentInput) => Promise<void>
}

const statusOptions = ['Draft', 'Active', 'On Hold', 'Ready For Release', 'Archived']

function findAction(access: BatchDetailAccessViewModel | null, actionId: string) {
  return access?.actions.find((action) => action.id === actionId) ?? null
}

function getMovementOptions(currentStage?: string) {
  const allStages = ['Cultivation', 'Laboratory', 'Distribution', 'Released']

  if (!currentStage) {
    return allStages
  }

  return allStages.filter((stage) => stage !== currentStage)
}

export function BatchOperationsPanel({
  selectedBatch,
  access,
  onMoveBatch,
  onChangeStatus,
  onUploadDocument,
}: Props) {
  const { showToast } = useToast()
  const moveAction = findAction(access, 'move-stage')
  const statusAction = findAction(access, 'change-status')
  const uploadAction = findAction(access, 'upload-document')
  const movementOptions = getMovementOptions(selectedBatch?.currentStage)

  const [moveForm, setMoveForm] = useState<MoveBatchInput>({
    toStage: movementOptions[0] ?? 'Laboratory',
    notes: '',
  })
  const [statusForm, setStatusForm] = useState<ChangeStatusInput>({
    status: selectedBatch?.status ?? 'Active',
    reason: '',
  })
  const [uploadExpiresAt, setUploadExpiresAt] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setMoveForm({
      toStage: getMovementOptions(selectedBatch?.currentStage)[0] ?? 'Laboratory',
      notes: '',
    })
    setStatusForm({
      status: selectedBatch?.status ?? 'Active',
      reason: '',
    })
    setUploadExpiresAt('')
    setUploadFile(null)
  }, [selectedBatch?.id, selectedBatch?.currentStage, selectedBatch?.status])

  function handleUploadFileChange(event: ChangeEvent<HTMLInputElement>) {
    setUploadFile(event.target.files?.[0] ?? null)
  }

  async function handleMoveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedBatch) {
      showToast({
        tone: 'error',
        title: 'Selecciona un lote',
        description: 'Abre un lote antes de registrar un movimiento.',
      })
      return
    }

    setIsMoving(true)

    try {
      await onMoveBatch(selectedBatch.id, moveForm)
      setMoveForm((current) => ({ ...current, notes: '' }))
      showToast({
        tone: 'success',
        title: 'Movimiento registrado',
        description: `El lote ${selectedBatch.batchNumber} ya quedo actualizado.`,
      })
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'No pudimos mover el lote',
        description: getUserFacingErrorMessage(error, 'No pudimos registrar el movimiento del lote.'),
      })
    } finally {
      setIsMoving(false)
    }
  }

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedBatch) {
      showToast({
        tone: 'error',
        title: 'Selecciona un lote',
        description: 'Abre un lote antes de cambiar su estado.',
      })
      return
    }

    setIsChangingStatus(true)

    try {
      await onChangeStatus(selectedBatch.id, statusForm)
      setStatusForm((current) => ({ ...current, reason: '' }))
      showToast({
        tone: 'success',
        title: 'Estado actualizado',
        description: `El lote ${selectedBatch.batchNumber} ya tiene el nuevo estado registrado.`,
      })
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'No pudimos cambiar el estado',
        description: getUserFacingErrorMessage(error, 'No pudimos actualizar el estado del lote.'),
      })
    } finally {
      setIsChangingStatus(false)
    }
  }

  async function handleUploadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedBatch) {
      showToast({
        tone: 'error',
        title: 'Selecciona un lote',
        description: 'Abre un lote antes de cargar un documento.',
      })
      return
    }

    if (!uploadFile) {
      showToast({
        tone: 'error',
        title: 'Falta el archivo',
        description: 'Selecciona un archivo antes de continuar.',
      })
      return
    }

    setIsUploading(true)

    try {
      await onUploadDocument(selectedBatch.id, {
        file: uploadFile,
        expiresAtUtc: uploadExpiresAt || undefined,
      })
      setUploadFile(null)
      setUploadExpiresAt('')
      showToast({
        tone: 'success',
        title: 'Documento cargado',
        description: `La evidencia del lote ${selectedBatch.batchNumber} ya fue registrada.`,
      })
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'No pudimos cargar el documento',
        description: getUserFacingErrorMessage(error, 'No pudimos registrar el documento.'),
      })
    } finally {
      setIsUploading(false)
    }
  }

  const visibleOperations = [moveAction?.allowed, statusAction?.allowed, uploadAction?.allowed].some(Boolean)

  return (
    <section className="section-card wide-card">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Tus acciones</p>
          <h2>Solo lo que puedes hacer aqui</h2>
        </div>
        <p className="section-description">El sistema oculta acciones que no corresponden a tu rol o al estado actual del lote.</p>
      </div>

      <div className="operations-grid">
        {moveAction?.allowed ? (
          <form className="operation-card" onSubmit={handleMoveSubmit}>
            <div className="operation-heading">
              <strong>Mover etapa</strong>
              <span>Disponible</span>
            </div>
            <p>{moveAction.reason ?? 'Necesitas seleccionar un lote.'}</p>
            <label>
              Siguiente etapa
              <select
                value={moveForm.toStage}
                onChange={(event) => setMoveForm((current) => ({ ...current, toStage: event.target.value }))}
                disabled={isMoving || !selectedBatch}
              >
                {movementOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nota operativa
              <textarea
                value={moveForm.notes}
                onChange={(event) => setMoveForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Transferencia a laboratorio luego del cierre de cultivo."
                disabled={isMoving || !selectedBatch}
              />
            </label>
            <button type="submit" className="auth-button" disabled={isMoving || !selectedBatch}>
              {isMoving ? 'Guardando...' : 'Registrar movimiento'}
            </button>
          </form>
        ) : null}

        {statusAction?.allowed ? (
          <form className="operation-card" onSubmit={handleStatusSubmit}>
            <div className="operation-heading">
              <strong>Cambiar estado</strong>
              <span>Disponible</span>
            </div>
            <p>{statusAction.reason ?? 'Necesitas seleccionar un lote.'}</p>
            <label>
              Estado
              <select
                value={statusForm.status}
                onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}
                disabled={isChangingStatus || !selectedBatch}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Motivo
              <textarea
                value={statusForm.reason}
                onChange={(event) => setStatusForm((current) => ({ ...current, reason: event.target.value }))}
                placeholder="Revision de calidad completada y paquete de liberacion aprobado."
                disabled={isChangingStatus || !selectedBatch}
              />
            </label>
            <button type="submit" className="auth-button" disabled={isChangingStatus || !selectedBatch}>
              {isChangingStatus ? 'Actualizando...' : 'Cambiar estado'}
            </button>
          </form>
        ) : null}

        {uploadAction?.allowed ? (
          <form className="operation-card" onSubmit={handleUploadSubmit}>
            <div className="operation-heading">
              <strong>Subir documento</strong>
              <span>Disponible</span>
            </div>
            <p>{uploadAction.reason ?? 'Necesitas seleccionar un lote.'}</p>
            <label>
              Archivo
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg"
                onChange={handleUploadFileChange}
                disabled={isUploading || !selectedBatch}
              />
            </label>
            <label>
              Fecha de vencimiento
              <input
                type="date"
                value={uploadExpiresAt}
                onChange={(event) => setUploadExpiresAt(event.target.value)}
                disabled={isUploading || !selectedBatch}
              />
            </label>
            <button type="submit" className="auth-button" disabled={isUploading || !selectedBatch}>
              {isUploading ? 'Subiendo...' : 'Cargar documento'}
            </button>
          </form>
        ) : null}
      </div>

      {!visibleOperations ? <p className="empty-state">No tienes acciones editables sobre este lote en este momento.</p> : null}
    </section>
  )
}
