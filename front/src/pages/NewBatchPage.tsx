import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGreenLedger } from '../app/GreenLedgerContext'
import { useToast } from '../app/toastContext'
import { StatePanel } from '../components/StatePanel'
import { getUserFacingErrorMessage } from '../lib/http'
import { canCreateBatch } from '../lib/roleWorkspace'
import { getProductTemplateById, productTemplates } from '../lib/productTemplates'

export function NewBatchPage() {
  const navigate = useNavigate()
  const { authSession, createBatch } = useGreenLedger()
  const { showToast } = useToast()
  const [selectedTemplateId, setSelectedTemplateId] = useState(productTemplates[0]?.id ?? '')
  const [batchNumber, setBatchNumber] = useState('')
  const [cultivarName, setCultivarName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedTemplate = getProductTemplateById(selectedTemplateId)

  if (!canCreateBatch(authSession?.role)) {
    return (
      <div className="page-stack">
        <StatePanel
          title="Esta tarea no corresponde a tu rol"
          description="La creacion de lotes esta reservada para administracion o el equipo de cultivo."
        />
      </div>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const createdBatch = await createBatch({
        batchNumber,
        productName: selectedTemplate?.defaultProductName ?? '',
        cultivarName,
      })

      navigate(`/batches/${createdBatch.id}`)
    } catch (error) {
      showToast({
        tone: 'error',
        title: 'No pudimos crear el lote',
        description: getUserFacingErrorMessage(error, 'No pudimos crear el lote.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <span className="section-kicker">Crear lote</span>
          <h1>Registra un nuevo lote sin pasos tecnicos innecesarios.</h1>
          <p className="section-description wide-description">
            Elige el tipo de producto, escribe el numero del lote y el cultivar. El sistema se encargara de pedir la
            evidencia necesaria despues.
          </p>
        </div>
      </section>

      <section className="content-columns">
        <form className="section-card simple-task-form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="section-heading">
            <div>
              <p className="section-kicker">Datos minimos</p>
              <h2>Lo necesario para empezar</h2>
            </div>
          </div>

          <label className="filter-group">
            Tipo de producto
            <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} disabled={isSubmitting}>
              {productTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-group">
            Numero de lote
            <input value={batchNumber} onChange={(event) => setBatchNumber(event.target.value)} placeholder="GL-2026-014" />
          </label>

          <label className="filter-group">
            Cultivar
            <input value={cultivarName} onChange={(event) => setCultivarName(event.target.value)} placeholder="Harmony One" />
          </label>

          <label className="filter-group">
            Producto
            <input value={selectedTemplate?.defaultProductName ?? ''} readOnly disabled />
          </label>

          <button type="submit" className="auth-button" disabled={isSubmitting || !batchNumber || !cultivarName}>
            {isSubmitting ? 'Creando lote...' : 'Crear lote'}
          </button>
        </form>

        <section className="section-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">El sistema pedira despues</p>
              <h2>Checklist del producto</h2>
            </div>
          </div>

          <div className="requirement-grid">
            {selectedTemplate?.requiredArtifacts.map((artifact) => (
              <article key={artifact.id} className="requirement-card requirement-missing">
                <div className="permission-header">
                  <strong>{artifact.label}</strong>
                  <span>{artifact.ownerRole}</span>
                </div>
                <p>{artifact.guidance}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
