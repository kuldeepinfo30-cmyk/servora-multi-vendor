/** Money helpers — every amount is an integer number of paise. */
export const rupees = (value: number) => Math.round(value * 100);
export const toRupees = (paise: number) => Math.round(paise) / 100;

/** Round to the nearest rupee (100 paise) — used for taxes and fees. */
export const roundPaise = (paise: number) => Math.round(paise / 100) * 100;

export const formatInr = (paise: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(toRupees(paise));

export function applyPercent(amountPaise: number, percent: number, maxPaise?: number | null) {
  const raw = roundPaise((amountPaise * percent) / 100);
  return maxPaise ? Math.min(raw, maxPaise) : raw;
}

export function commissionSplit(totalPaise: number, commissionRate: number) {
  const platformFeePaise = roundPaise((totalPaise * commissionRate) / 100);
  return { platformFeePaise, vendorPaise: totalPaise - platformFeePaise };
}
