import { ShieldCheck } from 'lucide-react';
import { fmtDate, inr } from '@/lib/utils';
import type { Booking } from '@/lib/types';
import { getService, getVendor } from '@/lib/data';

export function InvoicePreview({
  booking,
  customerName = 'Aarav Mehta',
  customerEmail = 'aarav.mehta@gmail.com',
  customerAddress,
}: {
  booking: Booking;
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
}) {
  const service = getService(booking.serviceId);
  const vendor = getVendor(booking.vendorId);
  const total = booking.amount;
  const subtotal = Math.round(total / 1.18);
  const tax = total - subtotal;
  const platformFee = Math.round(subtotal * 0.03);
  const base = subtotal - platformFee;

  return (
    <div className="rounded-xl border border-ink-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-800">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
              <path d="M11.3 2.2a.75.75 0 0 1 1.4 0l1.9 5.2 5.2 1.9a.75.75 0 0 1 0 1.4l-5.2 1.9-1.9 5.2a.75.75 0 0 1-1.4 0l-1.9-5.2-5.2-1.9a.75.75 0 0 1 0-1.4l5.2-1.9 1.9-5.2Z" />
            </svg>
          </span>
          <div>
            <p className="font-display text-[17px] font-extrabold leading-none text-ink-900">
              servora<span className="text-brand-500">.</span>
            </p>
            <p className="mt-1 text-[9.5px] text-ink-400">Local services marketplace</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">Tax invoice</p>
          <p className="mt-1 font-mono text-[13px] font-bold text-ink-900">INV-{booking.ref.replace('SRV-', '2026-')}</p>
          <p className="mt-0.5 text-[10px] text-ink-400">Issued {fmtDate(booking.createdAt)}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="grid gap-5 border-b border-ink-100 px-6 py-5 sm:grid-cols-2">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-ink-400">Billed to</p>
          <p className="mt-1.5 text-[12.5px] font-bold text-ink-900">{customerName}</p>
          <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{customerEmail}</p>
          <p className="text-[11px] leading-5 text-ink-500">
            {customerAddress ?? booking.address}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-ink-400">Service by</p>
          <p className="mt-1.5 text-[12.5px] font-bold text-ink-900">{vendor?.name}</p>
          <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{vendor?.address}</p>
          <p className="text-[11px] leading-5 text-ink-500">GSTIN: 27AAECS1234F1Z5</p>
        </div>
      </div>

      {/* Booking meta */}
      <div className="grid grid-cols-2 gap-3 border-b border-ink-100 bg-ink-50/50 px-6 py-3.5 sm:grid-cols-4">
        {[
          { label: 'Booking', value: booking.ref },
          { label: 'Service date', value: `${fmtDate(booking.date)} · ${booking.time}` },
          { label: 'Payment', value: booking.paymentMethod },
          { label: 'Status', value: booking.paymentStatus.toUpperCase() },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400">{m.label}</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-ink-800">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Line items */}
      <div className="px-6 py-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink-200">
              <th className="pb-2 text-[9.5px] font-bold uppercase tracking-wider text-ink-400">Description</th>
              <th className="pb-2 text-center text-[9.5px] font-bold uppercase tracking-wider text-ink-400">Qty</th>
              <th className="pb-2 text-right text-[9.5px] font-bold uppercase tracking-wider text-ink-400">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            <tr>
              <td className="py-2.5">
                <p className="text-[12px] font-semibold text-ink-800">{service?.name}</p>
                <p className="text-[10px] text-ink-400">{vendor?.name} · {booking.duration} minutes</p>
              </td>
              <td className="py-2.5 text-center text-[11.5px] text-ink-600">1</td>
              <td className="py-2.5 text-right text-[11.5px] font-semibold text-ink-800">{inr(base)}</td>
            </tr>
            {booking.addOns?.map((addon, i) => (
              <tr key={i}>
                <td className="py-2.5">
                  <p className="text-[12px] font-semibold text-ink-800">{addon}</p>
                  <p className="text-[10px] text-ink-400">Add-on service</p>
                </td>
                <td className="py-2.5 text-center text-[11.5px] text-ink-600">1</td>
                <td className="py-2.5 text-right text-[11.5px] font-semibold text-ink-800">Included</td>
              </tr>
            ))}
            <tr>
              <td className="py-2.5 text-[11.5px] text-ink-600">Platform fee</td>
              <td />
              <td className="py-2.5 text-right text-[11.5px] font-semibold text-ink-800">{inr(platformFee)}</td>
            </tr>
            <tr>
              <td className="py-2.5 text-[11.5px] text-ink-600">GST (18%)</td>
              <td />
              <td className="py-2.5 text-right text-[11.5px] font-semibold text-ink-800">{inr(tax)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="flex flex-col gap-3 border-t border-ink-100 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-2 text-[10px] leading-4 text-ink-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <p>Payment is processed securely by Servora. This is a computer-generated invoice and does not require a signature.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Total paid</p>
          <p className="font-display text-[22px] font-extrabold text-ink-900">{inr(total)}</p>
          <span className="mt-1 inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-emerald-700">
            {booking.paymentStatus === 'paid' ? 'Paid in full' : booking.paymentStatus}
          </span>
        </div>
      </div>
      <div className="border-t border-ink-100 px-6 py-3 text-center text-[9px] text-ink-400">
        Servora Marketplace Pvt. Ltd. · 4th Floor, Prestige Tech Park, Bengaluru 560103 · support@servora.demo · GSTIN 29AABCS4567G1Z2
      </div>
    </div>
  );
}
