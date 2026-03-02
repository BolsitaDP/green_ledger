export type BatchViewModel = {
  id: string
  batchNumber: string
  productName: string
  cultivarName: string
  currentStage: string
  status: string
  documentsCount: number
  lastMovementAtUtc: string
}

export type UserSummaryViewModel = {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
}

export type AuditTrailItemViewModel = {
  id: string
  actorEmail: string
  actorRole: string
  action: string
  entityName: string
  entityId: string
  oldValuesJson: string | null
  newValuesJson: string | null
  reason: string | null
  correlationId: string | null
  ipAddress: string | null
  occurredAtUtc: string
}

export type ArchitectureLayer = {
  name: string
  job: string
  plainExplanation: string
}

export type RoleCard = {
  name: string
  mainPower: string
  simpleExplanation: string
}

export type ImplementationPhase = {
  title: string
  goal: string
  explanation: string
}
