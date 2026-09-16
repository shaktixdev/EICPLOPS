export type AppRole = 'admin' | 'operator' | 'guard'

export type Permission =
  | 'settings'
  | 'users'
  | 'form_fields'
  | 'delete_data'
  | 'masters_write'
  | 'create_slip'
  | 'mark_arrived'
  | 'analytics'
  | 'invoices'
  | 'view_trips'
  | 'view_fleet'

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    'settings',
    'users',
    'form_fields',
    'delete_data',
    'masters_write',
    'create_slip',
    'mark_arrived',
    'analytics',
    'invoices',
    'view_trips',
    'view_fleet',
  ],
  operator: ['create_slip', 'mark_arrived', 'analytics', 'view_trips', 'view_fleet'],
  guard: ['view_trips', 'view_fleet'],
}

/** Map legacy roles to the new set */
export function normalizeRole(role?: string | null): AppRole {
  const r = String(role || '')
    .toLowerCase()
    .trim()
  if (r === 'admin' || r === 'owner') return 'admin'
  if (r === 'operator' || r === 'manager') return 'operator'
  if (r === 'guard') return 'guard'
  return 'guard'
}

export function roleLabel(role?: string | null): string {
  const n = normalizeRole(role)
  if (n === 'admin') return 'Admin'
  if (n === 'operator') return 'Operator'
  return 'Guard'
}

export function can(role: string | null | undefined, permission: Permission): boolean {
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(permission)
}

export function permissionsFor(role: string | null | undefined): Permission[] {
  return [...ROLE_PERMISSIONS[normalizeRole(role)]]
}

export const ALL_ROLES: AppRole[] = ['admin', 'operator', 'guard']
