import { randomBytes } from 'node:crypto';

/** Human-friendly booking reference: SRV-8F3K2Q */
export function bookingRef(): string {
  return `SRV-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function payoutRef(sequence = Date.now() % 10000): string {
  return `PO-${new Date().getFullYear()}-${String(sequence).padStart(4, '0')}`;
}

export function disputeRef(): string {
  return `DP-${randomBytes(2).toString('hex').toUpperCase()}`;
}

export function ticketRef(): string {
  return `TS-${randomBytes(2).toString('hex').toUpperCase()}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

export function uniqueSlug(value: string): string {
  return `${slugify(value)}-${randomBytes(2).toString('hex')}`;
}

export function sixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
