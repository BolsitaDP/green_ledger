import type { BatchDocumentViewModel, BatchViewModel } from '../types'

export type ProductTemplateRequirement = {
  id: string
  label: string
  kind: 'document' | 'record'
  ownerRole: string
  guidance: string
  matchers?: string[]
}

export type ProductTemplate = {
  id: string
  label: string
  defaultProductName: string
  description: string
  requiredArtifacts: ProductTemplateRequirement[]
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export const productTemplates: ProductTemplate[] = [
  {
    id: 'cbd-oil-30ml',
    label: 'Aceite CBD 30 ml',
    defaultProductName: 'CBD Oil 30ml',
    description: 'Producto oral con foco en evidencia analitica, liberacion y soporte de handoff entre cultivo y laboratorio.',
    requiredArtifacts: [
      {
        id: 'cultivation-handoff',
        label: 'Registro de handoff de cultivo',
        kind: 'record',
        ownerRole: 'Cultivation Operator',
        guidance: 'El lote debe dejar constancia de que ya salio de cultivo y fue entregado a laboratorio.',
      },
      {
        id: 'coa',
        label: 'COA del lote',
        kind: 'document',
        ownerRole: 'Lab Analyst',
        guidance: 'El laboratorio debe subir un certificado de analisis del lote.',
        matchers: ['coa', 'certificate', 'analysis'],
      },
      {
        id: 'batch-record',
        label: 'Batch production record',
        kind: 'document',
        ownerRole: 'Quality Manager',
        guidance: 'Calidad necesita un batch record o production record para soportar la revision.',
        matchers: ['batch-record', 'production-record', 'manufacturing-record'],
      },
      {
        id: 'release-authorization',
        label: 'Decision de liberacion',
        kind: 'record',
        ownerRole: 'Compliance Officer',
        guidance: 'Compliance o calidad deben dejar la decision regulatoria del lote antes de salida.',
      },
    ],
  },
  {
    id: 'thc-capsules',
    label: 'Capsulas THC',
    defaultProductName: 'THC Capsules',
    description: 'Producto encapsulado que exige evidencia de formulacion, analitica y liberacion controlada.',
    requiredArtifacts: [
      {
        id: 'encapsulation-record',
        label: 'Registro de encapsulado',
        kind: 'document',
        ownerRole: 'Quality Manager',
        guidance: 'Debe existir un registro de produccion o encapsulado del lote.',
        matchers: ['encapsulation', 'batch-record', 'production-record'],
      },
      {
        id: 'coa',
        label: 'COA del lote',
        kind: 'document',
        ownerRole: 'Lab Analyst',
        guidance: 'Laboratorio debe cargar el resultado analitico del lote.',
        matchers: ['coa', 'certificate', 'analysis'],
      },
      {
        id: 'release-authorization',
        label: 'Liberacion de cumplimiento',
        kind: 'record',
        ownerRole: 'Compliance Officer',
        guidance: 'Debe existir una decision formal antes de pasar a salida.',
      },
    ],
  },
  {
    id: 'dry-flower-10g',
    label: 'Flor seca 10 g',
    defaultProductName: 'Dry Flower 10g',
    description: 'Producto botanico donde importan cultivo, pruebas de laboratorio y evidencia de empaque final.',
    requiredArtifacts: [
      {
        id: 'cultivation-handoff',
        label: 'Registro de cierre de cultivo',
        kind: 'record',
        ownerRole: 'Cultivation Operator',
        guidance: 'Cultivo debe cerrar y documentar la salida del lote hacia laboratorio.',
      },
      {
        id: 'microbiology-result',
        label: 'Resultado microbiologico',
        kind: 'document',
        ownerRole: 'Lab Analyst',
        guidance: 'Se necesita evidencia analitica del lote botanico.',
        matchers: ['micro', 'coa', 'analysis', 'lab'],
      },
      {
        id: 'packaging-clearance',
        label: 'Aprobacion de empaque',
        kind: 'document',
        ownerRole: 'Quality Manager',
        guidance: 'Calidad debe disponer de soporte de liberacion o clearance final.',
        matchers: ['release', 'clearance', 'authorization'],
      },
    ],
  },
  {
    id: 'topical-cream',
    label: 'Crema topica',
    defaultProductName: 'Topical Cream',
    description: 'Producto formulado que necesita soporte de fabricacion, laboratorio y liberacion de calidad.',
    requiredArtifacts: [
      {
        id: 'formulation-record',
        label: 'Registro de formulacion',
        kind: 'document',
        ownerRole: 'Quality Manager',
        guidance: 'Debe existir un registro formal de formulacion o manufactura.',
        matchers: ['formulation', 'batch-record', 'production-record'],
      },
      {
        id: 'coa',
        label: 'COA del lote',
        kind: 'document',
        ownerRole: 'Lab Analyst',
        guidance: 'Laboratorio debe soportar la evidencia analitica del lote.',
        matchers: ['coa', 'analysis', 'certificate'],
      },
      {
        id: 'release-authorization',
        label: 'Liberacion final',
        kind: 'record',
        ownerRole: 'Compliance Officer',
        guidance: 'El lote requiere decision de liberacion antes de pasar a distribucion.',
      },
    ],
  },
]

export function getProductTemplateById(templateId: string): ProductTemplate | undefined {
  return productTemplates.find((template) => template.id === templateId)
}

export function inferProductTemplate(productName: string): ProductTemplate | undefined {
  const normalizedProduct = normalizeText(productName)

  return productTemplates.find((template) => {
    const normalizedTemplate = normalizeText(template.defaultProductName)

    return (
      normalizedProduct === normalizedTemplate ||
      normalizedProduct.includes(normalizedTemplate) ||
      normalizedTemplate.split(' ').every((token) => normalizedProduct.includes(token))
    )
  })
}

export function isRequirementSatisfied(
  requirement: ProductTemplateRequirement,
  batch: BatchViewModel,
  documents: BatchDocumentViewModel[],
): boolean {
  if (requirement.kind === 'record') {
    if (requirement.id === 'cultivation-handoff') {
      return batch.currentStage !== 'Cultivation'
    }

    if (requirement.id === 'release-authorization') {
      return batch.status === 'Ready For Release' || batch.currentStage === 'Distribution' || batch.currentStage === 'Released'
    }

    return false
  }

  const normalizedFileNames = documents.map((document) => normalizeText(document.fileName))
  return (requirement.matchers ?? []).some((matcher) =>
    normalizedFileNames.some((fileName) => fileName.includes(normalizeText(matcher))),
  )
}
