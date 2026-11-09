import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, FileText, Filter, ReceiptText, Search, ShieldCheck } from 'lucide-react';
import { getService, getVendor } from '@/lib/data';
import { downloadFile, fmtDate, inr } from '@/lib/utils';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import type { Booking } from '@/lib/types';
import { Badge, Button, buttonStyles, Card, EmptyState, Skeleton } from '@/components/ui/primitives';
import { ExportButton, PageHeader, SectionCard, StatCard } from '@/components/ui/data-display';
import { Modal } from '@/components/ui/overlays';
import { InvoicePreview } from '@/components/invoice';

export default function CustomerInvoices() {
  const loading = useMockLoad(400);
  const bookings = useApp((s) => s.bookings);
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('all');
  const [preview, setPreview] = useState<Booking | null>(null);

  const invoices = useMemo(
    () =>
      bookings
        .filter((b) => ['completed', 'refunded'].includes(b.status) || b.paymentStatus === 'paid')
        .filter((b) => {
          if (year === 'all') return true;
          return b.date.startsWith(year);
        })
        .filter((b) => {
          const q = query.toLowerCase();
          if (!q) return true;
          return `${b.ref} ${getService(b.serviceId)?.name} ${getVendor(b.vendorId)?.name}`.toLowerCase().includes(q);
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [bookings, query, year],
  );

  const total = invoices.reduce((s, b) => s + b.amount, 0);
  const gst = Math.round(total - total / 1.18);

  const downloadInvoice = (b: Booking) => {
    const service = getService(b.serviceId);
    const vendor = getVendor(b.vendorId);
    const subtotal = Math.round(b.amount / 1.18);
    const content = [
      'SERVORA — TAX INVOICE',
      'Servora Technologies Pvt. Ltd. · GSTIN 29ABCDE1234F1Z5',
      '',
      `Invoice no: INV-${b.ref.replace('SRV-', '2026-')}`,
      `Invoice date: ${fmtDate(b.createdAt)}`,
      `Booking ref: ${b.ref}`,
      `Customer: ${b.customerName}`,
      '',
      `Service: ${service?.name}`,
      `Vendor: ${vendor?.name}`,
      `Service date: ${fmtDate(b.date)} at ${b.time}`,
      `Address: ${b.address}`,
      '',
      `Subtotal: ${inr(subtotal)}`,
      `GST @ 18%: ${inr(b.amount - subtotal)}`,
      `Total: ${inr(b.amount)}`,
      `Payment method: ${b.paymentMethod}`,
      `Payment status: ${b.paymentStatus}`,
    ].join('\n');
    downloadFile(`${b.ref}-invoice.txt`, content);
    toast.success('Invoice downloaded', `${b.ref}-invoice.txt saved.`);
  };

  const downloadAll = () => {
    const rows = invoices.map((b) => `${b.ref},${getService(b.serviceId)?.name},${fmtDate(b.date)},${b.amount},${b.paymentStatus}`);
    downloadFile('servora-invoices.csv', `Reference,Service,Date,Amount,Status\n${rows.join('\n')}`, 'text/csv;charset=utf-8;');
    toast.success('All invoices exported', `${invoices.length} invoices exported to CSV.`);
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="GST-ready invoices for every paid booking. Download individually or export all."
        actions={
          <>
            <Button variant="outline" size="md" iconLeft={<ArrowDownToLine className="h-4 w-4" />} onClick={downloadAll} disabled={invoices.length === 0}>
              Export all
            </Button>
            <Link to="/customer/payments" className={buttonStyles({ variant: 'outline', size: 'md' })}>Payment methods</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Invoices" value={invoices.length} icon={<ReceiptText className="h-5 w-5" />} tone="brand" footnote="paid bookings" />
        <StatCard label="Total invoiced" value={inr(total)} icon={<FileText className="h-5 w-5" />} tone="violet" footnote="incl. GST" />
        <StatCard label="GST paid" value={inr(gst)} icon={<ShieldCheck className="h-5 w-5" />} tone="success" footnote="claimable" />
        <StatCard label="Fiscal year" value="2026–27" icon={<Filter className="h-5 w-5" />} tone="info" footnote="Apr–Mar" />
      </div>

      <div className="mt-5">
        <SectionCard
          title="All invoices"
          description="Download for reimbursement, tax filing or your records."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoices" className="h-9 w-44 rounded-lg border border-ink-200 pl-9 pr-3 text-[11.5px] focus:border-brand-400 focus:outline-none" />
              </div>
              <select value={year} onChange={(e) => setYear(e.target.value)} className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-[11.5px] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none">
                <option value="all">All time</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          }
          noPadding
        >
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : invoices.length === 0 ? (
            <EmptyState icon={<ReceiptText className="h-5 w-5" />} title="No invoices found" description={query || year !== 'all' ? 'Try clearing filters or searching a different reference.' : 'Invoices are generated automatically after a paid booking.'} compact action={query || year !== 'all' ? <Button variant="outline" size="sm" onClick={() => { setQuery(''); setYear('all'); }}>Clear filters</Button> : <Link to="/services" className={buttonStyles({ size: 'sm' })}>Book a service</Link>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50/60">
                    {['Invoice', 'Service', 'Vendor', 'Date', 'Amount', ''].map((h) => <th key={h} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-ink-400 ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((b) => (
                    <tr key={b.id} className="border-b border-ink-100 last:border-0 transition hover:bg-ink-50/50">
                      <td className="px-4 py-3">
                        <button onClick={() => setPreview(b)} className="font-mono text-[11px] font-bold text-brand-700 hover:text-brand-800">
                          INV-{b.ref.replace('SRV-', '2026-')}
                        </button>
                        <p className="text-[9.5px] text-ink-400">{b.ref}</p>
                      </td>
                      <td className="px-4 py-3 text-[11.5px] font-semibold text-ink-700">{getService(b.serviceId)?.name}</td>
                      <td className="px-4 py-3 text-[11px] text-ink-500">{getVendor(b.vendorId)?.name}</td>
                      <td className="px-4 py-3 text-[11px] text-ink-500">{fmtDate(b.date)}</td>
                      <td className="px-4 py-3 text-right text-[12px] font-bold text-ink-900">{inr(b.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setPreview(b)} className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-[10.5px] font-semibold text-ink-600 hover:bg-ink-50">View</button>
                          <button onClick={() => downloadInvoice(b)} className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-[10.5px] font-bold text-brand-700 hover:bg-brand-100">Download</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: 'GST compliant', text: 'Every invoice carries a valid GSTIN and HSN breakdown.' },
          { icon: FileText, title: 'Reimbursement ready', text: 'Download PDF-ready invoices with a single click.' },
          { icon: ReceiptText, title: 'Always available', text: 'Invoices stay in your account for 7 years.' },
        ].map((c) => (
          <div key={c.title} className="flex items-start gap-2.5 rounded-xl border border-ink-200 bg-white p-3.5">
            <c.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <div>
              <p className="text-[11.5px] font-bold text-ink-800">{c.title}</p>
              <p className="text-[10.5px] leading-4 text-ink-500">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Invoice preview"
        description={preview ? `INV-${preview.ref.replace('SRV-', '2026-')}` : undefined}
        size="xl"
        footer={<><Button variant="outline" size="sm" onClick={() => setPreview(null)}>Close</Button>{preview && <Button size="sm" iconLeft={<ArrowDownToLine className="h-3.5 w-3.5" />} onClick={() => downloadInvoice(preview)}>Download</Button>}</>}
      >
        {preview && <InvoicePreview booking={preview} customerName={preview.customerName} customerEmail="aarav.mehta@gmail.com" />}
      </Modal>
    </div>
  );
}
