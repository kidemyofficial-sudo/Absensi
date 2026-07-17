import { prisma } from './prisma'

interface AuditLogParams {
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: string
  entityId: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  ip?: string
}

/**
 * Log audit trail untuk semua write operations
 * Panggil setelah operasi berhasil
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined,
        newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
        ip: params.ip || undefined,
      },
    })
  } catch (error) {
    // Audit log tidak boleh crash aplikasi
    console.error('Audit log failed:', error)
  }
}

/**
 * Helper untuk mendapatkan IP dari request
 */
export function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}
