import { describe, expect, it } from 'vitest';
import { applyPercent, commissionSplit, formatInr, roundPaise, rupees, toRupees } from '../src/common/utils/money';

describe('money helpers', () => {
  it('converts rupees to paise and back', () => {
    expect(rupees(12.5)).toBe(1250);
    expect(toRupees(1250)).toBe(12.5);
  });

  it('rounds to the nearest rupee', () => {
    expect(roundPaise(1234)).toBe(1200);
    expect(roundPaise(1250)).toBe(1300);
  });

  it('applies a percentage with an optional cap', () => {
    expect(applyPercent(100_000, 10)).toBe(10_000);
    expect(applyPercent(100_000, 50, 30_000)).toBe(30_000);
    expect(applyPercent(0, 50)).toBe(0);
  });

  it('splits a payment into platform fee and vendor share', () => {
    const { platformFeePaise, vendorPaise } = commissionSplit(100_000, 12.5);
    expect(platformFeePaise).toBe(12_500);
    expect(vendorPaise).toBe(87_500);
    expect(platformFeePaise + vendorPaise).toBe(100_000);
  });

  it('formats paise as INR currency', () => {
    expect(formatInr(150_000)).toContain('1,500');
  });
});
