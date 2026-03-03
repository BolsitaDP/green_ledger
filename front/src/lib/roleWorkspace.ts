import type { BatchViewModel } from '../types'
import { getBatchDetailAccess, getRoleLabel, normalizeRole } from './batchAccess'

export type WorkerInboxItem = {
  id: string
  batchId?: string
  title: string
  summary: string
  actionLabel: string
  priority: 'high' | 'medium'
  to: string
}

export type RoleBatchExperience = {
  showCultivarColumn: boolean
  showDocumentsColumn: boolean
  showGovernancePanel: boolean
  showTemplatePanel: boolean
  showRequirements: boolean
  requirementScope: 'all' | 'owned'
  showSuggestedActions: boolean
  showPermissions: boolean
  showAudit: boolean
  showDocuments: boolean
  showEducation: boolean
}

export type RoleWorkspaceConfig = {
  homeTitle: string
  homeDescription: string
  primaryActionLabel: string
  primaryActionTo: string
  navigationItems: Array<{ to: string; label: string }>
  batchExperience: RoleBatchExperience
}

function createBatchTask(
  batch: BatchViewModel,
  title: string,
  summary: string,
  actionLabel: string,
  priority: 'high' | 'medium',
): WorkerInboxItem {
  return {
    id: `${batch.id}:${title}`,
    batchId: batch.id,
    title,
    summary,
    actionLabel,
    priority,
    to: `/batches/${batch.id}`,
  }
}

function sortTasks(tasks: WorkerInboxItem[]): WorkerInboxItem[] {
  return [...tasks].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority === 'high' ? -1 : 1
    }

    return left.title.localeCompare(right.title)
  })
}

function createBatchExperience(overrides: Partial<RoleBatchExperience> = {}): RoleBatchExperience {
  return {
    showCultivarColumn: true,
    showDocumentsColumn: true,
    showGovernancePanel: true,
    showTemplatePanel: true,
    showRequirements: true,
    requirementScope: 'all',
    showSuggestedActions: true,
    showPermissions: false,
    showAudit: true,
    showDocuments: true,
    showEducation: false,
    ...overrides,
  }
}

export function canCreateBatch(role?: string): boolean {
  const canonicalRole = normalizeRole(role)
  return canonicalRole === 'Admin' || canonicalRole === 'CultivationOperator'
}

export function canReadUsers(role?: string): boolean {
  const canonicalRole = normalizeRole(role)
  return canonicalRole === 'Admin' || canonicalRole === 'ComplianceOfficer' || canonicalRole === 'Regulator'
}

export function getWorkerInbox(batches: BatchViewModel[], role?: string): WorkerInboxItem[] {
  const canonicalRole = normalizeRole(role)

  switch (canonicalRole) {
    case 'CultivationOperator':
      return sortTasks(
        batches
          .flatMap((batch) => {
            const access = getBatchDetailAccess(role, batch, [], 0)
            const closeoutTask = access.workerTasks.find((task) => task.id === 'cultivation-closeout' && !task.blocked)

            if (!closeoutTask) {
              return []
            }

            return [
              createBatchTask(
                batch,
                closeoutTask.title,
                `El lote ${batch.batchNumber} sigue en cultivo y necesita handoff operativo.`,
                'Abrir lote y mover etapa',
                'high',
              ),
            ]
          }),
      )
    case 'LabAnalyst':
      return sortTasks(
        batches
          .flatMap((batch) => {
            const access = getBatchDetailAccess(role, batch, [], 0)
            const evidenceTask = access.workerTasks.find((task) => task.id === 'lab-evidence' && !task.blocked)

            if (!evidenceTask) {
              return []
            }

            return [
              createBatchTask(
                batch,
                batch.documentsCount === 0 ? 'Subir primer documento tecnico' : evidenceTask.title,
                `El lote ${batch.batchNumber} esta en laboratorio y necesita soporte tecnico para seguir.`,
                'Abrir lote y cargar documento',
                batch.documentsCount === 0 ? 'high' : 'medium',
              ),
            ]
          }),
      )
    case 'QualityManager':
      return sortTasks(
        batches
          .flatMap((batch) => {
            const access = getBatchDetailAccess(role, batch, [], 0)
            const qualityTask = access.workerTasks.find(
              (task) => (task.id === 'resolve-hold' || task.id === 'regulatory-review') && !task.blocked,
            )

            if (!qualityTask) {
              return []
            }

            return [
              createBatchTask(
                batch,
                qualityTask.title,
                `El lote ${batch.batchNumber} necesita una decision de calidad o seguimiento.`,
                'Abrir lote y revisar estado',
                'high',
              ),
            ]
          }),
      )
    case 'ComplianceOfficer':
      return sortTasks(
        batches
          .flatMap((batch) => {
            const access = getBatchDetailAccess(role, batch, [], 0)
            const complianceTask = access.workerTasks.find(
              (task) =>
                (task.id === 'resolve-hold' || task.id === 'regulatory-review' || task.id === 'release-handoff') &&
                !task.blocked,
            )

            if (!complianceTask) {
              return []
            }

            return [
              createBatchTask(
                batch,
                complianceTask.title,
                `El lote ${batch.batchNumber} necesita validacion regulatoria o cierre documental.`,
                complianceTask.id === 'release-handoff' ? 'Abrir lote y mover etapa' : 'Abrir lote y revisar cumplimiento',
                batch.status === 'On Hold' ? 'high' : 'medium',
              ),
            ]
          }),
      )
    case 'DistributionOperator':
      return sortTasks(
        batches
          .flatMap((batch) => {
            const access = getBatchDetailAccess(role, batch, [], 0)
            const dispatchTask = access.workerTasks.find((task) => task.id === 'dispatch-preparation' && !task.blocked)

            if (!dispatchTask) {
              return []
            }

            return [
              createBatchTask(
                batch,
                dispatchTask.title,
                `El lote ${batch.batchNumber} ya esta listo para despacho o seguimiento logistico.`,
                'Abrir lote y registrar movimiento',
                'high',
              ),
            ]
          }),
      )
    case 'Regulator':
      return sortTasks(
        batches
          .flatMap((batch) => {
            if (batch.status !== 'On Hold' && batch.status !== 'Ready For Release') {
              return []
            }

            const access = getBatchDetailAccess(role, batch, [], 0)
            const inspectionTask = access.workerTasks.find((task) => task.id === 'regulatory-review' && !task.blocked)

            if (!inspectionTask) {
              return []
            }

            return [
              createBatchTask(
                batch,
                inspectionTask.title,
                `El lote ${batch.batchNumber} tiene un estado relevante para inspeccion.`,
                'Abrir lote y consultar expediente',
                'medium',
              ),
            ]
          }),
      )
    case 'Admin':
      return sortTasks(
        batches
          .flatMap((batch) => {
            const access = getBatchDetailAccess(role, batch, [], 0)
            const adminTask = access.workerTasks.find((task) => task.id === 'admin-monitoring' && !task.blocked)

            if (!adminTask) {
              return []
            }

            if (batch.status !== 'On Hold' && batch.documentsCount > 0) {
              return []
            }

            return [
              createBatchTask(
                batch,
                batch.status === 'On Hold' ? 'Supervisar lote en hold' : adminTask.title,
                `El lote ${batch.batchNumber} puede necesitar apoyo transversal.`,
                'Abrir lote',
                'high',
              ),
            ]
          }),
      )
    default:
      return []
  }
}

export function getRoleWorkspaceConfig(role?: string): RoleWorkspaceConfig {
  const canonicalRole = normalizeRole(role)
  const roleLabel = getRoleLabel(canonicalRole)
  const baseItems: Array<{ to: string; label: string }> = [
    { to: '/dashboard', label: 'Mi trabajo' },
    { to: '/batches', label: 'Lotes' },
  ]

  if (canCreateBatch(role)) {
    baseItems.splice(1, 0, { to: '/new-batch', label: 'Crear lote' })
  }

  if (canReadUsers(role)) {
    baseItems.push({ to: '/control-center', label: 'Equipo' })
  }

  switch (canonicalRole) {
    case 'CultivationOperator':
      return {
        homeTitle: 'Tus tareas de cultivo',
        homeDescription: 'Aqui ves solo lo necesario para crear lotes, cerrarlos y enviarlos a la siguiente etapa.',
        primaryActionLabel: 'Crear nuevo lote',
        primaryActionTo: '/new-batch',
        navigationItems: baseItems,
        batchExperience: createBatchExperience({
          showDocumentsColumn: false,
          showGovernancePanel: false,
          showTemplatePanel: false,
          requirementScope: 'owned',
          showSuggestedActions: false,
          showAudit: false,
          showDocuments: false,
        }),
      }
    case 'LabAnalyst':
      return {
        homeTitle: 'Tus tareas de laboratorio',
        homeDescription: 'El sistema te muestra primero los lotes que necesitan evidencia tecnica o revision documental.',
        primaryActionLabel: 'Ver lotes en laboratorio',
        primaryActionTo: '/batches',
        navigationItems: baseItems,
        batchExperience: createBatchExperience({
          showGovernancePanel: false,
          showCultivarColumn: false,
          requirementScope: 'owned',
          showSuggestedActions: false,
          showAudit: false,
        }),
      }
    case 'QualityManager':
      return {
        homeTitle: 'Tus tareas de calidad',
        homeDescription: 'Aqui aparecen los lotes que requieren decision de calidad o seguimiento por retencion.',
        primaryActionLabel: 'Revisar lotes pendientes',
        primaryActionTo: '/batches',
        navigationItems: baseItems,
        batchExperience: createBatchExperience(),
      }
    case 'ComplianceOfficer':
      return {
        homeTitle: 'Tus tareas de cumplimiento',
        homeDescription: 'El sistema prioriza los lotes que necesitan validacion regulatoria o cierre documental.',
        primaryActionLabel: 'Revisar lotes de cumplimiento',
        primaryActionTo: '/batches',
        navigationItems: baseItems,
        batchExperience: createBatchExperience(),
      }
    case 'DistributionOperator':
      return {
        homeTitle: 'Tus tareas de despacho',
        homeDescription: 'Aqui ves solo los lotes listos para salida o en etapa de distribucion.',
        primaryActionLabel: 'Abrir lotes listos para salida',
        primaryActionTo: '/batches',
        navigationItems: baseItems,
        batchExperience: createBatchExperience({
          showCultivarColumn: false,
          showDocumentsColumn: false,
          showGovernancePanel: false,
          showTemplatePanel: false,
          showRequirements: false,
          showSuggestedActions: false,
          showAudit: false,
          showDocuments: false,
        }),
      }
    case 'Regulator':
      return {
        homeTitle: 'Lotes para inspeccion',
        homeDescription: 'Tu portada se enfoca en expedientes que merecen revision y trazabilidad completa.',
        primaryActionLabel: 'Abrir lotes inspeccionables',
        primaryActionTo: '/batches',
        navigationItems: baseItems,
        batchExperience: createBatchExperience({
          showSuggestedActions: false,
        }),
      }
    case 'Admin':
      return {
        homeTitle: 'Supervision operativa',
        homeDescription: 'Tu portada muestra excepciones y puntos donde otros equipos pueden necesitar soporte.',
        primaryActionLabel: 'Crear nuevo lote',
        primaryActionTo: '/new-batch',
        navigationItems: baseItems,
        batchExperience: createBatchExperience({
          showPermissions: true,
          showEducation: true,
        }),
      }
    default:
      return {
        homeTitle: `Trabajo de ${roleLabel}`,
        homeDescription: 'El sistema te muestra las tareas prioritarias dentro del alcance actual.',
        primaryActionLabel: 'Abrir lotes',
        primaryActionTo: '/batches',
        navigationItems: baseItems,
        batchExperience: createBatchExperience(),
      }
  }
}
