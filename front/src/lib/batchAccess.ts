import type { BatchDocumentViewModel, BatchViewModel } from '../types'
import { inferProductTemplate, isRequirementSatisfied } from './productTemplates'

export type CanonicalRole =
  | 'Admin'
  | 'ComplianceOfficer'
  | 'QualityManager'
  | 'CultivationOperator'
  | 'LabAnalyst'
  | 'DistributionOperator'
  | 'Regulator'
  | 'Guest'

export type BatchActionAccessViewModel = {
  id: string
  title: string
  description: string
  allowed: boolean
  reason: string
}

export type BatchSuggestedActionViewModel = {
  id: string
  title: string
  summary: string
  whyNow: string
  outcome: string
  tone: 'primary' | 'secondary' | 'blocked'
}

export type BatchRequirementViewModel = {
  id: string
  label: string
  ownerRole: string
  guidance: string
  status: 'complete' | 'missing'
}

export type BatchWorkerTaskViewModel = {
  id: string
  title: string
  summary: string
  actionLabel: string
  priority: 'high' | 'medium'
  blocked: boolean
}

export type BatchDetailAccessViewModel = {
  roleLabel: string
  visibilityLabel: string
  stageOwnerLabel: string
  nextActionLabel: string
  operationalStatusLabel: string
  operationalSummary: string
  actions: BatchActionAccessViewModel[]
  suggestedActions: BatchSuggestedActionViewModel[]
  productTemplateLabel: string
  productTemplateDescription: string
  requirements: BatchRequirementViewModel[]
  workerTasks: BatchWorkerTaskViewModel[]
}

export function normalizeRole(role?: string): CanonicalRole {
  switch (role) {
    case 'Admin':
      return 'Admin'
    case 'ComplianceOfficer':
    case 'Compliance Officer':
      return 'ComplianceOfficer'
    case 'QualityManager':
    case 'Quality Manager':
      return 'QualityManager'
    case 'CultivationOperator':
    case 'Cultivation Operator':
      return 'CultivationOperator'
    case 'LabAnalyst':
    case 'Lab Analyst':
      return 'LabAnalyst'
    case 'DistributionOperator':
    case 'Distribution Operator':
      return 'DistributionOperator'
    case 'Regulator':
      return 'Regulator'
    default:
      return 'Guest'
  }
}

export function getRoleLabel(role: CanonicalRole): string {
  switch (role) {
    case 'ComplianceOfficer':
      return 'Compliance Officer'
    case 'QualityManager':
      return 'Quality Manager'
    case 'CultivationOperator':
      return 'Cultivation Operator'
    case 'LabAnalyst':
      return 'Lab Analyst'
    case 'DistributionOperator':
      return 'Distribution Operator'
    case 'Guest':
      return 'Invitado'
    default:
      return role
  }
}

function isRoleAllowed(role: CanonicalRole, allowedRoles: CanonicalRole[]): boolean {
  return allowedRoles.includes(role)
}

function getStageOwnerLabel(batch: BatchViewModel): string {
  switch (batch.currentStage) {
    case 'Cultivation':
      return 'Cultivation Operator'
    case 'Laboratory':
      return batch.status === 'Ready For Release' ? 'Quality + Compliance' : 'Lab Analyst'
    case 'Distribution':
      return 'Distribution Operator'
    default:
      return 'Compliance Officer'
  }
}

function getVisibilityLabel(role: CanonicalRole): string {
  switch (role) {
    case 'Admin':
      return 'Vista total de plataforma'
    case 'Regulator':
      return 'Solo lectura con trazabilidad completa'
    case 'ComplianceOfficer':
      return 'Vista regulatoria y documental'
    case 'QualityManager':
      return 'Vista de calidad y liberacion'
    case 'CultivationOperator':
      return 'Vista operativa de cultivo'
    case 'LabAnalyst':
      return 'Vista de laboratorio y evidencia'
    case 'DistributionOperator':
      return 'Vista de despacho y salida'
    default:
      return 'Acceso limitado'
  }
}

function getNextActionLabel(batch: BatchViewModel, documents: BatchDocumentViewModel[]): string {
  if (batch.status === 'On Hold') {
    return 'Resolver investigacion y documentar el motivo del hold.'
  }

  if (documents.length === 0) {
    return 'Subir evidencia minima antes de seguir moviendo el lote.'
  }

  if (batch.currentStage === 'Cultivation') {
    return 'Mover el lote a laboratorio cuando termine la etapa de cultivo.'
  }

  if (batch.currentStage === 'Laboratory' && batch.status !== 'Ready For Release') {
    return 'Completar resultados, revisar documentos y decidir liberacion.'
  }

  if (batch.currentStage === 'Distribution') {
    return 'Confirmar salida y dejar lista la traza regulatoria de despacho.'
  }

  return 'Mantener evidencia y auditoria al dia.'
}

function getOperationalSummary(batch: BatchViewModel, documents: BatchDocumentViewModel[], auditCount: number): string {
  if (batch.status === 'On Hold') {
    return 'El lote esta detenido. Antes de tocarlo de nuevo, alguien debe justificar el bloqueo.'
  }

  if (batch.status === 'Ready For Release') {
    return 'El lote ya paso sus validaciones principales. Ahora importa no romper la cadena documental.'
  }

  if (documents.length < 2) {
    return 'La trazabilidad existe, pero la evidencia documental todavia se ve delgada para una operacion regulada.'
  }

  if (auditCount === 0) {
    return 'Hay datos del lote, pero casi no hay historia auditable visible para reconstruir decisiones.'
  }

  return 'El lote tiene una historia operativa razonable y ya se comporta como una entidad de negocio real.'
}

function buildWorkerTasks(
  role: CanonicalRole,
  batch: BatchViewModel,
  requirements: BatchRequirementViewModel[],
  actions: BatchActionAccessViewModel[],
): BatchWorkerTaskViewModel[] {
  const moveAllowed = actions.find((action) => action.id === 'move-stage')?.allowed ?? false
  const statusAllowed = actions.find((action) => action.id === 'change-status')?.allowed ?? false
  const uploadAllowed = actions.find((action) => action.id === 'upload-document')?.allowed ?? false
  const missingForRole = requirements.filter((requirement) => requirement.status === 'missing' && requirement.ownerRole === getRoleLabel(role))
  const tasks: BatchWorkerTaskViewModel[] = []

  if (role === 'CultivationOperator' && batch.currentStage === 'Cultivation') {
    tasks.push({
      id: 'cultivation-closeout',
      title: 'Cerrar etapa de cultivo',
      summary: 'Tu trabajo es dejar el lote listo para laboratorio y registrar el handoff operativo.',
      actionLabel: moveAllowed ? 'Registrar movimiento a laboratorio' : 'Esperar habilitacion para mover etapa',
      priority: 'high',
      blocked: !moveAllowed,
    })
  }

  if (role === 'LabAnalyst' && batch.currentStage === 'Laboratory') {
    tasks.push({
      id: 'lab-evidence',
      title: 'Cargar evidencia de laboratorio',
      summary: missingForRole.length > 0
        ? `Todavia faltan ${missingForRole.length} evidencias tecnicas para este lote.`
        : 'Revisa si la evidencia ya cargada necesita una nueva version o soporte adicional.',
      actionLabel: uploadAllowed ? 'Subir documento tecnico' : 'Sin permiso de carga',
      priority: 'high',
      blocked: !uploadAllowed,
    })
  }

  if ((role === 'QualityManager' || role === 'ComplianceOfficer') && batch.status === 'On Hold') {
    tasks.push({
      id: 'resolve-hold',
      title: 'Resolver lote retenido',
      summary: 'El lote esta detenido y necesita una decision de control para definir si sigue o permanece bloqueado.',
      actionLabel: statusAllowed ? 'Cambiar estado del lote' : 'Escalar a un rol con permiso de estado',
      priority: 'high',
      blocked: !statusAllowed,
    })
  }

  if (
    (role === 'QualityManager' || role === 'ComplianceOfficer') &&
    batch.currentStage === 'Laboratory' &&
    batch.status !== 'On Hold'
  ) {
    tasks.push({
      id: 'regulatory-review',
      title: 'Tomar decision sobre el lote',
      summary: 'Debes revisar evidencia y decidir si el lote sigue activo, queda en hold o listo para liberarse.',
      actionLabel: statusAllowed ? 'Cambiar estado del lote' : 'Sin permiso para decidir estado',
      priority: 'high',
      blocked: !statusAllowed,
    })
  }

  if (role === 'ComplianceOfficer' && batch.status === 'Ready For Release' && batch.currentStage !== 'Distribution') {
    tasks.push({
      id: 'release-handoff',
      title: 'Enviar lote a distribucion',
      summary: 'El lote ya esta liberado y necesita el movimiento operativo hacia distribucion.',
      actionLabel: moveAllowed ? 'Registrar movimiento a distribucion' : 'Esperar habilitacion para mover etapa',
      priority: 'medium',
      blocked: !moveAllowed,
    })
  }

  if (role === 'DistributionOperator' && (batch.currentStage === 'Distribution' || batch.status === 'Ready For Release')) {
    tasks.push({
      id: 'dispatch-preparation',
      title: 'Preparar salida del lote',
      summary: 'Tu trabajo es asegurar el paso operativo a distribucion sin romper la trazabilidad documental.',
      actionLabel: moveAllowed ? 'Registrar salida o movimiento final' : 'Esperar lote en etapa de distribucion',
      priority: 'medium',
      blocked: !moveAllowed,
    })
  }

  if (role === 'Regulator') {
    tasks.push({
      id: 'regulatory-review',
      title: 'Inspeccionar el expediente del lote',
      summary: 'Tu tarea es revisar evidencia, auditoria y decisiones sin intervenir operativamente.',
      actionLabel: 'Consultar auditoria y documentos',
      priority: 'medium',
      blocked: false,
    })
  }

  if (role === 'Admin') {
    tasks.push({
      id: 'admin-monitoring',
      title: 'Supervisar excepciones del lote',
      summary: batch.status === 'On Hold'
        ? 'El lote esta en hold; deberias monitorear si el flujo operativo necesita soporte.'
        : 'Tu rol entra por excepcion, soporte o correccion transversal cuando otro rol se bloquea.',
      actionLabel: 'Intervenir solo si el proceso lo requiere',
      priority: batch.status === 'On Hold' ? 'high' : 'medium',
      blocked: false,
    })
  }

  if (tasks.length === 0) {
    tasks.push({
      id: 'no-direct-work',
      title: 'Sin tarea operativa directa',
      summary: 'En este momento el lote no tiene una accion principal asignada a tu rol.',
      actionLabel: 'Monitorear el siguiente cambio de etapa o estado',
      priority: 'medium',
      blocked: false,
    })
  }

  return tasks
}

function buildSuggestedActions(
  role: CanonicalRole,
  batch: BatchViewModel,
  documents: BatchDocumentViewModel[],
  actions: BatchActionAccessViewModel[],
): BatchSuggestedActionViewModel[] {
  const moveAction = actions.find((action) => action.id === 'move-stage')
  const statusAction = actions.find((action) => action.id === 'change-status')
  const uploadAction = actions.find((action) => action.id === 'upload-document')
  const downloadAction = actions.find((action) => action.id === 'download-document')
  const suggestions: BatchSuggestedActionViewModel[] = []

  if (batch.status === 'On Hold') {
    suggestions.push({
      id: 'investigate-hold',
      title: 'Resolver el hold del lote',
      summary: 'Antes de seguir operando, alguien con rol de control debe evaluar el motivo del bloqueo.',
      whyNow: 'Mientras el lote siga en hold, el proceso queda detenido y las transiciones se frenan.',
      outcome: statusAction?.allowed
        ? 'Usa cambiar estado cuando la investigacion este cerrada.'
        : 'Escala este lote a Quality o Compliance para que decidan el siguiente estado.',
      tone: statusAction?.allowed ? 'primary' : 'blocked',
    })
  }

  if (documents.length === 0) {
    suggestions.push({
      id: 'minimum-evidence',
      title: 'Construir evidencia minima',
      summary: 'El lote necesita al menos un documento base para sostener su trazabilidad regulatoria.',
      whyNow: 'Sin evidencia documental, el lote queda debil frente a control de calidad o inspeccion.',
      outcome: uploadAction?.allowed
        ? 'Carga el primer documento tecnico o regulatorio del lote.'
        : 'Coordina con laboratorio, calidad o compliance para adjuntar evidencia.',
      tone: uploadAction?.allowed ? 'primary' : 'blocked',
    })
  }

  if (batch.currentStage === 'Cultivation') {
    suggestions.push({
      id: 'close-cultivation',
      title: 'Cerrar etapa de cultivo',
      summary: 'Confirma que el lote esta listo para salir de cultivo y quedar disponible para laboratorio.',
      whyNow: 'Este lote sigue en la etapa de origen y el siguiente cuello de botella es laboratorio.',
      outcome: moveAction?.allowed
        ? 'Registra el movimiento a laboratorio cuando termine la operacion de cultivo.'
        : 'El responsable operativo de cultivo debe registrar la salida de etapa.',
      tone: moveAction?.allowed ? 'primary' : 'secondary',
    })
  }

  if (batch.currentStage === 'Laboratory' && batch.status !== 'Ready For Release') {
    suggestions.push({
      id: 'laboratory-review',
      title: 'Completar revision de laboratorio',
      summary: 'Este lote necesita resultados y soporte tecnico antes de una decision de calidad o compliance.',
      whyNow: 'Laboratorio es el punto donde se transforma la muestra en evidencia util para liberar o retener.',
      outcome:
        role === 'LabAnalyst' || uploadAction?.allowed
          ? 'Sube resultados, COA u otros soportes y deja el lote listo para evaluacion.'
          : 'Espera la evidencia del laboratorio antes de decidir el estado regulatorio.',
      tone: role === 'LabAnalyst' || uploadAction?.allowed ? 'primary' : 'secondary',
    })
  }

  if (batch.currentStage === 'Laboratory' && batch.status !== 'On Hold') {
    suggestions.push({
      id: 'regulatory-decision',
      title: 'Tomar decision sobre el estado',
      summary: 'Cuando la evidencia este completa, calidad o compliance deben decidir si el lote sigue, se retiene o se libera.',
      whyNow: 'La etapa de laboratorio ya deberia desembocar en una decision regulatoria clara.',
      outcome: statusAction?.allowed
        ? 'Usa cambiar estado para poner On Hold o dejarlo listo para liberacion.'
        : 'Tu rol prepara informacion, pero la decision final la toma un rol de control.',
      tone: statusAction?.allowed ? 'primary' : 'secondary',
    })
  }

  if (batch.status === 'Ready For Release' && batch.currentStage !== 'Distribution') {
    suggestions.push({
      id: 'release-to-distribution',
      title: 'Preparar salida a distribucion',
      summary: 'El lote ya esta listo para liberarse y el siguiente paso es moverlo a su etapa de despacho.',
      whyNow: 'Un lote liberado no deberia quedarse inmovil sin una transicion operativa clara.',
      outcome: moveAction?.allowed
        ? 'Registra el movimiento a distribucion y deja trazabilidad de la salida.'
        : 'Coordina con operacion o compliance para completar la transicion.',
      tone: moveAction?.allowed ? 'primary' : 'secondary',
    })
  }

  if (batch.currentStage === 'Distribution') {
    suggestions.push({
      id: 'dispatch-control',
      title: 'Cerrar salida del lote',
      summary: 'Distribucion debe dejar evidencia del despacho y asegurar que no se rompa la cadena documental.',
      whyNow: 'Esta es la ultima etapa visible del lote antes de quedar fuera de la operacion interna.',
      outcome: downloadAction?.allowed
        ? 'Descarga y verifica los soportes clave antes del cierre logistico.'
        : 'Valida con el equipo de distribucion que el despacho quede documentado.',
      tone: moveAction?.allowed || downloadAction?.allowed ? 'primary' : 'secondary',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'maintain-traceability',
      title: 'Mantener la trazabilidad al dia',
      summary: 'El lote no tiene un bloqueo urgente, pero sigue necesitando disciplina documental y operativa.',
      whyNow: 'En cumplimiento regulatorio, la ausencia de incidentes no elimina la necesidad de control.',
      outcome: 'Revisa documentos, movimientos y estado antes de la siguiente decision.',
      tone: 'secondary',
    })
  }

  return suggestions
}

export function getBatchDetailAccess(
  role: string | undefined,
  batch: BatchViewModel,
  documents: BatchDocumentViewModel[],
  auditCount: number,
): BatchDetailAccessViewModel {
  const canonicalRole = normalizeRole(role)
  const canMoveStage = isRoleAllowed(canonicalRole, [
    'Admin',
    'CultivationOperator',
    'DistributionOperator',
    'ComplianceOfficer',
  ])
  const moveBlockedByStatus = batch.status === 'On Hold'
  const actions: BatchActionAccessViewModel[] = [
    {
      id: 'create-batch',
      title: 'Crear lote',
      description: 'Abrir un batch nuevo y registrar su origen.',
      allowed: isRoleAllowed(canonicalRole, ['Admin', 'CultivationOperator']),
      reason: isRoleAllowed(canonicalRole, ['Admin', 'CultivationOperator'])
        ? 'Tu rol puede iniciar el registro formal del lote.'
        : 'Tu rol no deberia abrir lotes nuevos en esta etapa.',
    },
    {
      id: 'move-stage',
      title: 'Mover etapa',
      description: 'Cambiar cultivo, laboratorio o distribucion.',
      allowed: canMoveStage && !moveBlockedByStatus,
      reason: moveBlockedByStatus
        ? 'El lote esta en hold. Antes de moverlo, alguien debe desbloquear su estado.'
        : canMoveStage
          ? 'Tu rol participa en transiciones operativas.'
          : 'Tu rol no mueve el lote entre etapas.',
    },
    {
      id: 'change-status',
      title: 'Cambiar estado',
      description: 'Poner on hold, aprobar o liberar.',
      allowed: isRoleAllowed(canonicalRole, ['Admin', 'ComplianceOfficer', 'QualityManager']),
      reason: isRoleAllowed(canonicalRole, ['Admin', 'ComplianceOfficer', 'QualityManager'])
        ? 'Este permiso vive en roles de control y gobierno.'
        : 'Solo roles de control pueden cambiar el estado regulatorio.',
    },
    {
      id: 'upload-document',
      title: 'Subir documento',
      description: 'Adjuntar COA, evidencia GMP o autorizaciones.',
      allowed: isRoleAllowed(canonicalRole, ['Admin', 'ComplianceOfficer', 'QualityManager', 'LabAnalyst']),
      reason: isRoleAllowed(canonicalRole, ['Admin', 'ComplianceOfficer', 'QualityManager', 'LabAnalyst'])
        ? 'Tu rol puede enriquecer la evidencia documental.'
        : 'Tu rol consume evidencia, pero no suele producirla.',
    },
    {
      id: 'download-document',
      title: 'Descargar documento',
      description: 'Bajar archivos protegidos con JWT.',
      allowed: canonicalRole !== 'Guest',
      reason: canonicalRole !== 'Guest'
        ? 'Con sesion valida puedes descargar evidencia protegida.'
        : 'Necesitas una sesion real para tocar documentos protegidos.',
    },
    {
      id: 'inspect-audit',
      title: 'Inspeccionar auditoria',
      description: 'Reconstruir quien hizo que y cuando.',
      allowed: isRoleAllowed(canonicalRole, ['Admin', 'ComplianceOfficer', 'QualityManager', 'Regulator']),
      reason: isRoleAllowed(canonicalRole, ['Admin', 'ComplianceOfficer', 'QualityManager', 'Regulator'])
        ? 'Tu rol necesita contexto completo para gobernanza o inspeccion.'
        : 'Ves parte de la operacion, pero no eres el principal auditor del proceso.',
    },
  ]
  const template = inferProductTemplate(batch.productName)
  const requirements: BatchRequirementViewModel[] = (template?.requiredArtifacts ?? []).map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    ownerRole: requirement.ownerRole,
    guidance: requirement.guidance,
    status: isRequirementSatisfied(requirement, batch, documents) ? 'complete' : 'missing',
  }))

  return {
    roleLabel: getRoleLabel(canonicalRole),
    visibilityLabel: getVisibilityLabel(canonicalRole),
    stageOwnerLabel: getStageOwnerLabel(batch),
    nextActionLabel: getNextActionLabel(batch, documents),
    operationalStatusLabel: batch.status === 'On Hold' ? 'Riesgo alto' : batch.status === 'Ready For Release' ? 'Controlado' : 'En seguimiento',
    operationalSummary: getOperationalSummary(batch, documents, auditCount),
    actions,
    suggestedActions: buildSuggestedActions(canonicalRole, batch, documents, actions),
    productTemplateLabel: template?.label ?? 'Producto sin plantilla operativa',
    productTemplateDescription:
      template?.description ?? 'Este producto todavia no tiene una plantilla de evidencia definida en el frontend.',
    requirements,
    workerTasks: buildWorkerTasks(canonicalRole, batch, requirements, actions),
  }
}
