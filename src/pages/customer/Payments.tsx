import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Download,
  Plus,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';
import { TRANSACTIONS } from '@/lib/data';
import { downloadFile, fmtDate, inr } from '@/lib/utils';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import { Badge, Button, buttonStyles, Card, EmptyState, Input, Skeleton, Tabs } from '@/components/ui/primitives';
import { ExportButton, InfoRow, PageHeader, SectionCard, StatCard, StatusBadge } from '@/components/ui/data-display';
import { ConfirmDialog, Modal } from '@/components/ui/overlays';

const initialCards = [
  { id: 'c1', brand: 'Visa', last4: '4242', expiry: '08/28', name: 'Aarav Mehta', primary: true },
  { id: 'c2', brand: 'Mastercard', last4: '8890', expiry: '11/27', name: 'Aarav Mehta', primary: false },
];

export default function CustomerPayments() {
  const loading = useMockLoad(400);
  const bookings = useApp((s) => s.bookings);
  const [tab, setTab] = useState<'methods' | 'history' | 'refunds'>('methods');
  const [cards, setCards] = useState(initialCards);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteCard, setDeleteCard] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const myTx = useMemo(() => TRANSACTIONS.filter((t) => t.customer === 'Aarav Mehta'), []);
  const refunds = useMemo(
    () => bookings.filter((b) => b.status === 'refunded' || b.paymentStatus === 'refunded'),
    [bookings],
  );
  const totalSpent = myTx.filter((t) => t.type === 'Payment' && t.status === 'success').reduce((s, t) => s + t.amount, 0);

  const addCard = () => {
    const errs: Record<string, string> = {};
    if (cardForm.number.replace(/\s/g, '').length < 16) errs.number = 'Enter a 16-digit card number.';
    if (!cardForm.name.trim()) errs.name = 'Enter the name on the card.';
    if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry)) errs.expiry = 'Use MM/YY.';
    if (cardForm.cvv.length < 3) errs.cvv = 'Enter the CVV.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setCards((prev) => [
      ...prev,
      { id: `c${Date.now()}`, brand: cardForm.number.startsWith('5') ? 'Mastercard' : 'Visa', last4: cardForm.number.replace(/\s/g, '').slice(-4), expiry: cardForm.expiry, name: cardForm.name, primary: false },
    ]);
    toast.success('Card added', `•••• ${cardForm.number.slice(-4)} is ready for checkout.`);
    setCardForm({ number: '', name: '', expiry: '', cvv: '' });
    setAddOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Manage payment methods, review transactions and track refunds — all in one place."
        actions={
          <>
            <ExportButton filename="servora-transactions.csv" rows={myTx as unknown as Record<string, unknown>[]} columns={[{ key: 'ref', label: 'Reference' }, { key: 'bookingRef', label: 'Booking' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Date' }]} />
            <Button size="md" iconLeft={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add card</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Spent this year" value={inr(totalSpent)} icon={<CreditCard className="h-5 w-5" />} tone="brand" delta={8.4} />
        <StatCard label="Wallet balance" value={inr(1250)} icon={<Wallet className="h-5 w-5" />} tone="success" footnote="expires 31 Dec 2026" />
        <StatCard label="Refunds in progress" value={refunds.reduce((s, b) => s + (b.refundAmount ?? b.amount), 0) > 0 ? inr(refunds.reduce((s, b) => s + (b.refundAmount ?? b.amount), 0)) : inr(0)} icon={<ArrowDownLeft className="h-5 w-5" />} tone="info" footnote={`${refunds.length} refunds`} />
        <StatCard label="Saved methods" value={cards.length + 1} icon={<Smartphone className="h-5 w-5" />} tone="violet" footnote="including UPI" />
      </div>

      <div className="mt-5">
        <Tabs
          value={tab}
          onChange={(k) => setTab(k as typeof tab)}
          items={[
            { key: 'methods', label: 'Payment methods' },
            { key: 'history', label: 'Transaction history', count: myTx.length },
            { key: 'refunds', label: 'Refunds', count: refunds.length },
          ]}
        />
      </div>

      {loading ? (
        <div className="mt-4 space-y-3"><Skeleton className="h-[160px]" /><Skeleton className="h-[220px]" /></div>
      ) : (
        <div className="mt-4">
          {tab === 'methods' && (
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <SectionCard title="Saved cards" description="Used for faster checkout." noPadding>
                <div className="divide-y divide-ink-100">
                  {cards.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-4">
                      <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-ink-800 to-ink-950 text-[9px] font-bold uppercase tracking-wide text-white">
                        {c.brand === 'Visa' ? 'VISA' : 'MC'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold text-ink-900">•••• •••• •••• {c.last4}</p>
                        <p className="text-[10.5px] text-ink-500">{c.name} · expires {c.expiry}</p>
                      </div>
                      {c.primary ? <Badge tone="brand" size="sm">Primary</Badge> : (
                        <button onClick={() => { setCards((prev) => prev.map((x) => ({ ...x, primary: x.id === c.id }))); toast.success('Primary card updated'); }} className="text-[10.5px] font-bold text-brand-700 hover:text-brand-800">
                          Make primary
                        </button>
                      )}
                      <button onClick={() => setDeleteCard(c.id)} className="rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove card ending ${c.last4}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Smartphone className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold text-ink-900">UPI · aarav@okhdfcbank</p>
                      <p className="text-[10.5px] text-ink-500">Default for instant payments</p>
                    </div>
                    <Badge tone="success" size="sm">Verified</Badge>
                  </div>
                </div>
                <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-3">
                  <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-brand-700 hover:text-brand-800">
                    <Plus className="h-3.5 w-3.5" /> Add another card
                  </button>
                </div>
              </SectionCard>

              <div className="space-y-4">
                <SectionCard title="Wallet" icon={<Wallet className="h-4 w-4" />}>
                  <p className="font-display text-[28px] font-extrabold text-ink-900">{inr(1250)}</p>
                  <p className="text-[10.5px] text-ink-500">Available credit · expires 31 Dec 2026</p>
                  <div className="mt-3 space-y-1">
                    <InfoRow label="Referral credit" value={inr(750)} />
                    <InfoRow label="Goodwill credit" value={inr(500)} />
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast.info('Top-up unavailable in demo', 'Wallet top-ups are disabled in this demo environment.')}>
                    Add money
                  </Button>
                </SectionCard>
                <div className="rounded-2xl border border-ink-200 bg-white p-4">
                  <p className="flex items-center gap-2 text-[11.5px] font-bold text-ink-800"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure by design</p>
                  <p className="mt-1 text-[10.5px] leading-5 text-ink-500">Card details are tokenised. Servora never stores full card numbers or CVVs. 3-D Secure is enforced on all card payments.</p>
                  <Link to="/policies/privacy" className="mt-1.5 inline-flex text-[10.5px] font-bold text-brand-700">Privacy policy →</Link>
                </div>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <SectionCard title="Transaction history" description="Every payment, refund and wallet movement." noPadding>
              {myTx.length === 0 ? (
                <EmptyState icon={<ReceiptText className="h-5 w-5" />} title="No transactions yet" description="Your payment history appears here after your first booking." compact />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead>
                      <tr className="border-b border-ink-200 bg-ink-50/60">
                        {['Reference', 'Booking', 'Type', 'Method', 'Date', 'Amount', 'Status'].map((h) => (
                          <th key={h} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-ink-400 ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myTx.map((t) => (
                        <tr key={t.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60">
                          <td className="px-4 py-3 font-mono text-[10.5px] text-ink-500">{t.ref}</td>
                          <td className="px-4 py-3 text-[11.5px] font-semibold text-ink-700">{t.bookingRef}</td>
                          <td className="px-4 py-3 text-[11.5px] text-ink-600">{t.type}</td>
                          <td className="px-4 py-3 text-[11.5px] text-ink-500">{t.method}</td>
                          <td className="px-4 py-3 text-[11px] text-ink-500">{fmtDate(t.date)}</td>
                          <td className="px-4 py-3 text-right text-[12px] font-bold text-ink-900">{inr(t.amount)}</td>
                          <td className="px-4 py-3"><StatusBadge status={t.status} size="sm" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          )}

          {tab === 'refunds' && (
            <SectionCard title="Refunds" description="Track money being returned to your original payment method." noPadding>
              {refunds.length === 0 ? (
                <EmptyState icon={<ArrowDownLeft className="h-5 w-5" />} title="No refunds" description="Any refunds from cancellations will appear here with live status." compact />
              ) : (
                <div className="divide-y divide-ink-100">
                  {refunds.map((b) => (
                    <div key={b.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ArrowDownLeft className="h-4.5 w-4.5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold text-ink-900">{b.ref}</p>
                        <p className="text-[10.5px] text-ink-500">Cancelled booking · {fmtDate(b.date)} · {b.paymentMethod}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[13px] font-bold text-emerald-600">+{inr(b.refundAmount ?? b.amount)}</p>
                        <p className="text-[10px] text-ink-400">Expected in 5–7 business days</p>
                      </div>
                      <Badge tone="success" size="sm"><CheckCircle2 className="h-3 w-3" /> Initiated</Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-ink-100 bg-ink-50/60 px-5 py-3 text-[10px] text-ink-500">
                Refunds to UPI are usually instant. Card refunds take 5–7 business days depending on your bank.
              </div>
            </SectionCard>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: '3-D Secure', text: 'Every card payment is protected by OTP.' },
          { icon: ArrowUpRight, title: 'Transparent fees', text: 'No hidden charges — taxes shown upfront.' },
          { icon: Download, title: 'Download receipts', text: 'GST invoices for every completed booking.' },
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
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a payment method"
        description="Your card is tokenised securely. We never store the CVV."
        icon={<CreditCard className="h-5 w-5" />}
        footer={<><Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button><Button size="sm" onClick={addCard}>Save card</Button></>}
      >
        <div className="space-y-3.5">
          <Input label="Card number" placeholder="4242 4242 4242 4242" value={cardForm.number} onChange={(e) => setCardForm((f) => ({ ...f, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() }))} error={errors.number} icon={<CreditCard className="h-4 w-4" />} />
          <Input label="Name on card" placeholder="Aarav Mehta" value={cardForm.name} onChange={(e) => setCardForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expiry" placeholder="MM/YY" value={cardForm.expiry} onChange={(e) => setCardForm((f) => ({ ...f, expiry: e.target.value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d{1,2})/, '$1/$2') }))} error={errors.expiry} />
            <Input label="CVV" type="password" placeholder="•••" value={cardForm.cvv} onChange={(e) => setCardForm((f) => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} error={errors.cvv} />
          </div>
          <p className="flex items-center gap-1.5 text-[10px] text-ink-400"><ShieldCheck className="h-3 w-3 text-emerald-500" /> This is a demo. Use any test card details.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteCard}
        onClose={() => setDeleteCard(null)}
        onConfirm={() => {
          setCards((prev) => prev.filter((c) => c.id !== deleteCard));
          toast.success('Card removed', 'The payment method was deleted.');
          setDeleteCard(null);
        }}
        title="Remove this card?"
        description="You can add it again at any time. Active bookings are not affected."
        confirmLabel="Remove card"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3">
        <p className="text-[10.5px] text-ink-500">Need an invoice for reimbursement? All completed bookings have downloadable GST invoices.</p>
        <Link to="/customer/invoices" className={buttonStyles({ variant: 'outline', size: 'sm' })}>Go to invoices</Link>
      </div>
    </div>
  );
}
