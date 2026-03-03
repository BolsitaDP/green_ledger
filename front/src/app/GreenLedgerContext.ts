import { createContext, useContext } from 'react'
import type { getBatchDetailAccess } from '../lib/batchAccess'
import type { RoleWorkspaceConfig, WorkerInboxItem } from '../lib/roleWorkspace'
import type {
  AuditTrailItemViewModel,
  AuthSession,
  BatchDocumentViewModel,
  BatchViewModel,
  UserSummaryViewModel,
} from '../types'

export type LoginInput = {
  email: string
  password: string
}

export type CreateBatchInput = {
  batchNumber: string
  productName: string
  cultivarName: string
}

export type MoveBatchInput = {
  toStage: string
  notes: string
}

export type ChangeStatusInput = {
  status: string
  reason: string
}

export type UploadDocumentInput = {
  file: File
  expiresAtUtc?: string
}

export type GreenLedgerContextValue = {
  authSession: AuthSession | null
  isAuthenticated: boolean
  isAuthenticating: boolean
  authError: string | null
  isLoading: boolean
  workspaceError: string | null
  batchContextError: string | null
  usersDirectoryRestricted: boolean
  auditTrailRestricted: boolean
  workerInbox: WorkerInboxItem[]
  roleWorkspace: RoleWorkspaceConfig
  batches: BatchViewModel[]
  users: UserSummaryViewModel[]
  auditTrail: AuditTrailItemViewModel[]
  documents: BatchDocumentViewModel[]
  selectedBatchId: string
  selectedBatch: BatchViewModel | undefined
  selectedBatchAccess: ReturnType<typeof getBatchDetailAccess> | null
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  selectBatch: (batchId: string) => void
  createBatch: (input: CreateBatchInput) => Promise<BatchViewModel>
  moveBatch: (batchId: string, input: MoveBatchInput) => Promise<void>
  changeBatchStatus: (batchId: string, input: ChangeStatusInput) => Promise<void>
  uploadDocument: (batchId: string, input: UploadDocumentInput) => Promise<void>
  downloadDocument: (documentId: string, fileName: string) => Promise<void>
}

export const GreenLedgerContext = createContext<GreenLedgerContextValue | null>(null)

export function useGreenLedger() {
  const context = useContext(GreenLedgerContext)

  if (!context) {
    throw new Error('useGreenLedger must be used inside GreenLedgerProvider.')
  }

  return context
}
