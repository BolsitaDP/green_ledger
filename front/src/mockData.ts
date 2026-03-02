import type {
  ArchitectureLayer,
  AuditTrailItemViewModel,
  BatchDocumentViewModel,
  BatchViewModel,
  ImplementationPhase,
  RoleCard,
  UserSummaryViewModel,
} from './types'

export const demoBatches: BatchViewModel[] = [
  {
    id: 'd8e5544b-cf0f-4adc-8b83-118b81df5f55',
    batchNumber: 'GL-2026-001',
    productName: 'CBD Oil 30ml',
    cultivarName: 'Harmony One',
    currentStage: 'Laboratory',
    status: 'Active',
    documentsCount: 3,
    lastMovementAtUtc: '2026-02-26T14:30:00Z',
  },
  {
    id: '6d61c2fd-9cc0-4cf2-9fe7-8854068c93e0',
    batchNumber: 'GL-2026-002',
    productName: 'THC Capsules',
    cultivarName: 'Aurora Med',
    currentStage: 'Distribution',
    status: 'Ready For Release',
    documentsCount: 5,
    lastMovementAtUtc: '2026-02-25T10:15:00Z',
  },
  {
    id: 'd930cf96-a042-4549-8f85-01cc9f63253f',
    batchNumber: 'GL-2026-003',
    productName: 'Dry Flower 10g',
    cultivarName: 'Emerald Calm',
    currentStage: 'Cultivation',
    status: 'On Hold',
    documentsCount: 1,
    lastMovementAtUtc: '2026-02-27T08:45:00Z',
  },
  {
    id: 'b6b1d57d-58f5-4e71-ad52-bf6465d37c95',
    batchNumber: 'GL-2026-004',
    productName: 'Topical Cream',
    cultivarName: 'Relief Prime',
    currentStage: 'Laboratory',
    status: 'Active',
    documentsCount: 2,
    lastMovementAtUtc: '2026-02-24T16:00:00Z',
  },
]

export const architectureLayers: ArchitectureLayer[] = [
  {
    name: 'Front',
    job: 'Pantallas y experiencia de usuario',
    plainExplanation: 'Aqui vive React. Su trabajo es mostrar datos y mandar solicitudes al backend.',
  },
  {
    name: 'API',
    job: 'Puerta de entrada del sistema',
    plainExplanation: 'ASP.NET recibe peticiones, valida permisos y responde con datos limpios.',
  },
  {
    name: 'Application',
    job: 'Reglas de negocio',
    plainExplanation: 'Aqui se decide que se puede hacer, que no, y en que orden.',
  },
  {
    name: 'Infrastructure',
    job: 'Conexion con mundo externo',
    plainExplanation: 'Base de datos, archivos, Redis, logs y cualquier servicio externo.',
  },
]

export const demoUsers: UserSummaryViewModel[] = [
  {
    id: '1',
    fullName: 'Ana Compliance',
    email: 'ana.compliance@greenledger.com',
    role: 'Compliance Officer',
    isActive: true,
  },
  {
    id: '2',
    fullName: 'Camila Cultivation',
    email: 'camila.cultivation@greenledger.com',
    role: 'Cultivation Operator',
    isActive: true,
  },
  {
    id: '3',
    fullName: 'Diego Lab',
    email: 'diego.lab@greenledger.com',
    role: 'Lab Analyst',
    isActive: true,
  },
  {
    id: '4',
    fullName: 'Sofia Quality',
    email: 'sofia.quality@greenledger.com',
    role: 'Quality Manager',
    isActive: true,
  },
]

export const demoAuditTrailByBatchId: Record<string, AuditTrailItemViewModel[]> = {
  'd8e5544b-cf0f-4adc-8b83-118b81df5f55': [
    {
      id: 'a1',
      actorEmail: 'diego.lab@greenledger.com',
      actorRole: 'Lab Analyst',
      action: 'DOCUMENT_UPLOADED',
      entityName: 'CertificationDocument',
      entityId: 'coa-cbd-oil-v1.pdf',
      oldValuesJson: null,
      newValuesJson: '{"fileName":"coa-cbd-oil-v1.pdf","version":1}',
      reason: 'Initial COA uploaded.',
      correlationId: 'corr-001',
      ipAddress: '10.0.10.24',
      occurredAtUtc: '2026-02-26T14:30:00Z',
    },
    {
      id: 'a2',
      actorEmail: 'camila.cultivation@greenledger.com',
      actorRole: 'Cultivation Operator',
      action: 'BATCH_MOVED_TO_LAB',
      entityName: 'Batch',
      entityId: 'GL-2026-001',
      oldValuesJson: '{"currentStage":"Cultivation"}',
      newValuesJson: '{"currentStage":"Laboratory"}',
      reason: 'Transferred to laboratory.',
      correlationId: 'corr-002',
      ipAddress: '10.0.10.24',
      occurredAtUtc: '2026-02-26T12:15:00Z',
    },
  ],
  '6d61c2fd-9cc0-4cf2-9fe7-8854068c93e0': [
    {
      id: 'b1',
      actorEmail: 'ana.compliance@greenledger.com',
      actorRole: 'Compliance Officer',
      action: 'RELEASE_APPROVED',
      entityName: 'Batch',
      entityId: 'GL-2026-002',
      oldValuesJson: '{"status":"Active"}',
      newValuesJson: '{"status":"Ready For Release"}',
      reason: 'Compliance approved final release.',
      correlationId: 'corr-101',
      ipAddress: '10.0.10.24',
      occurredAtUtc: '2026-02-25T10:15:00Z',
    },
  ],
}

export const demoDocumentsByBatchId: Record<string, BatchDocumentViewModel[]> = {
  'd8e5544b-cf0f-4adc-8b83-118b81df5f55': [
    {
      id: 'doc-a1',
      batchId: 'd8e5544b-cf0f-4adc-8b83-118b81df5f55',
      fileName: 'coa-cbd-oil-v1.pdf',
      contentType: 'application/pdf',
      fileSizeInBytes: 180224,
      sha256Hash: '2ec22b6f1b8c1bc264dbfcd6b2d35fa6e87cd88d5fa4d780f5b3182fd4b479ab',
      version: 1,
      status: 'Pending Review',
      expiresAtUtc: '2026-08-26T00:00:00Z',
      createdAtUtc: '2026-02-26T14:30:00Z',
    },
  ],
  '6d61c2fd-9cc0-4cf2-9fe7-8854068c93e0': [
    {
      id: 'doc-b1',
      batchId: '6d61c2fd-9cc0-4cf2-9fe7-8854068c93e0',
      fileName: 'release-authorization.pdf',
      contentType: 'application/pdf',
      fileSizeInBytes: 88912,
      sha256Hash: '8ee217aa992b34b3ebb1b9380156fa7429ecba6ced48925787b81051f31cc06d',
      version: 1,
      status: 'Pending Review',
      expiresAtUtc: '2026-07-02T00:00:00Z',
      createdAtUtc: '2026-02-25T10:15:00Z',
    },
  ],
}

export const roleCards: RoleCard[] = [
  {
    name: 'Admin',
    mainPower: 'Gestiona usuarios y configuracion',
    simpleExplanation: 'Es la persona que mantiene la plataforma funcionando para la empresa.',
  },
  {
    name: 'Compliance Officer',
    mainPower: 'Valida cumplimiento regulatorio',
    simpleExplanation: 'Revisa si documentos, fechas y movimientos cumplen la norma.',
  },
  {
    name: 'Regulator',
    mainPower: 'Solo lectura con trazabilidad completa',
    simpleExplanation: 'Puede inspeccionar, pero no modificar informacion.',
  },
]

export const implementationPhases: ImplementationPhase[] = [
  {
    title: '30 dias',
    goal: 'Base tecnica sana',
    explanation: 'Autenticacion, estructura por capas, lotes, movimientos y documentos basicos.',
  },
  {
    title: '60 dias',
    goal: 'Cumplimiento y auditoria',
    explanation: 'Audit trail, expiracion de certificados, filtros avanzados y reportes CSV.',
  },
  {
    title: '90 dias',
    goal: 'Nivel portfolio serio',
    explanation: 'Multi tenant ready, cache con Redis, background jobs y pruebas integrales.',
  },
]
