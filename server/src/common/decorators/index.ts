import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Marks a route as reachable without an access token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restricts a route to one or more roles. Enforced by RolesGuard. */
export const Roles = (...roles: Array<'customer' | 'vendor' | 'admin'>) =>
  SetMetadata(ROLES_KEY, roles.map((role) => role.toUpperCase()));

export const RAW_RESPONSE_KEY = 'rawResponse';
/** Skips the global response envelope (used for webhooks and streams). */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);

export const AUDIT_KEY = 'audit';
export interface AuditMeta {
  action: string;
  entity: string;
  severity?: 'INFO' | 'ROUTINE' | 'REVIEW' | 'CRITICAL';
}
/** Attach explicit audit metadata to a mutation. */
export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_KEY, meta);
