import { describe, expect, it } from 'vitest';
import { bookingRef, disputeRef, payoutRef, sixDigitCode, slugify, ticketRef, uniqueSlug } from '../src/common/utils/refs';

describe('reference helpers', () => {
  it('builds a booking reference', () => {
    expect(bookingRef()).toMatch(/^SRV-[0-9A-F]{6}$/);
  });

  it('builds a payout reference with a padded sequence', () => {
    expect(payoutRef(42)).toMatch(/^PO-\d{4}-0042$/);
  });

  it('builds dispute and ticket references', () => {
    expect(disputeRef()).toMatch(/^DP-[0-9A-F]{4}$/);
    expect(ticketRef()).toMatch(/^TS-[0-9A-F]{4}$/);
  });

  it('slugifies free text', () => {
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
    expect(slugify('Deep Cleaning (Home)')).toBe('deep-cleaning-home');
  });

  it('appends a random suffix to make slugs unique', () => {
    expect(uniqueSlug('AC Repair')).toMatch(/^ac-repair-[0-9a-f]{4}$/);
  });

  it('produces a six digit numeric code', () => {
    const code = sixDigitCode();
    expect(code).toMatch(/^\d{6}$/);
  });
});
