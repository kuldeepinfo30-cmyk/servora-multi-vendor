import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Info,
  MapPin,
  MessageSquare,
  Navigation,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  User,
  Wallet,
} from 'lucide-react';
import { getService, getVendor, getVendorStaff, SERVICES } from '@/lib/data';
import { cn, fmtDate, inr, iso, minsToLabel, slotAvailability, to12h, bookingRef, uid } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { Badge, Button, buttonStyles, Card, Checkbox, EmptyState, Input, Select, Textarea } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/data-display';
import { BookingCalendar, SlotHoldTimer, TimeSlotPicker } from '@/components/booking';
import { LocationBar } from '@/components/LocationBar';
import { Avatar } from '@/components/ui/primitives';
import type { Booking } from '@/lib/types';
import NotFoundPage from '../NotFound';

const steps = [
  { key: 'schedule', label: 'Schedule' },
  { key: 'details', label: 'Details' },
  { key: 'payment', label: 'Payment' },
  { key: 'done', label: 'Confirmed' },
];

const coupons: Record<string, { type: 'percent' | 'flat'; value: number; max?: number; label: string }> = {
  SERVORA20: { type: 'percent', value: 20, max: 500, label: '20% off up to ₹500' },
  FIRST100: { type: 'flat', value: 100, label: '₹100 off your booking' },
  CLEAN150: { type: 'flat', value: 150, label: '₹150 off cleaning services' },
};

export default function BookingFlowPage() {
  const { serviceId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const addresses = useApp((s) => s.addresses);
  const addBooking = useApp((s) => s.addBooking);

  const service = SERVICES.find((s) => s.id === serviceId) ?? (serviceId ? undefined : SERVICES[0]);
  const vendor = service ? getVendor(service.vendorId) : null;
  const team = service ? getVendorStaff(service.vendorId) : [];

  const [step, setStep] = useState(0);
  const [date, setDate] = useState(params.get('date') ?? iso(new Date()));
  const [time, setTime] = useState(params.get('time') ?? '');
  const [staffId, setStaffId] = useState(team[0]?.id ?? '');
  const [addOns, setAddOns] = useState<string[]>(() => {
    const raw = params.get('addons');
    return raw ? decodeURIComponent(raw).split('|').filter(Boolean) : [];
  });
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState('');
  const [answer, setAnswer] = useState('');

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState(defaultAddress?.id ?? '');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ line1: '', line2: '', city: user?.city ?? 'Mumbai', pincode: '', phone: user?.phone ?? '' });

  const [method, setMethod] = useState<'upi' | 'card' | 'wallet' | 'cash'>('upi');
  const [upiId, setUpiId] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: user?.name ?? '' });
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<Booking | null>(null);

  useEffect(() => {
    if (service) {
      document.title = `Book ${service.name} · Servora`;
    }
  }, [service]);

  const slots = useMemo(() => (service && date ? slotAvailability(service.id, date) : []), [service, date]);

  const addOnDetails = useMemo(
    () => (service?.addOns ?? []).filter((a) => addOns.includes(a.name)),
    [service, addOns],
  );

  const selectedAddress = useNewAddress ? null : addresses.find((a) => a.id === addressId);

  const pricing = useMemo(() => {
    if (!service) return { base: 0, addOnTotal: 0, platformFee: 0, gst: 0, discount: 0, total: 0 };
    const base = service.price;
    const addOnTotal = addOnDetails.reduce((s, a) => s + a.price, 0);
    const platformFee = Math.round((base + addOnTotal) * 0.03);
    const c = appliedCoupon ? coupons[appliedCoupon] : null;
    const discount = c ? Math.min(c.type === 'flat' ? c.value : Math.round(((base + addOnTotal) * c.value) / 100), c.max ?? Infinity) : 0;
    const taxable = base + addOnTotal + platformFee - discount;
    const gst = Math.round(taxable * 0.18);
    return { base, addOnTotal, platformFee, gst, discount, total: taxable + gst };
  }, [service, addOnDetails, appliedCoupon]);

  if (!service || !vendor) return <NotFoundPage />;

  const setError = (key: string, value: string) => setErrors((e) => ({ ...e, [key]: value }));

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    if (coupons[code]) {
      setAppliedCoupon(code);
      setCouponError('');
      toast.success('Coupon applied', coupons[code].label);
    } else {
      setAppliedCoupon(null);
      setCouponError('That code isn’t valid. Try SERVORA20 or FIRST100.');
    }
  };

  const goNext = () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!date) errs.date = 'Choose a date for your service.';
      if (!time) errs.time = 'Select an available time slot.';
    }
    if (step === 1) {
      if (useNewAddress) {
        if (!newAddress.line1.trim()) errs.line1 = 'Enter your building and street.';
        if (!/^\d{6}$/.test(newAddress.pincode)) errs.pincode = 'Enter a valid 6-digit pincode.';
        if (!/^[0-9+\s-]{10,15}$/.test(newAddress.phone)) errs.phone = 'Enter a valid phone number.';
      } else if (!addressId) {
        errs.address = 'Select a service address.';
      }
    }
    if (step === 2) {
      if (method === 'upi' && !/^[\w.-]{2,}@[\w.-]{2,}$/.test(upiId)) errs.upi = 'Enter a valid UPI ID, e.g. name@okhdfcbank.';
      if (method === 'card') {
        if (card.number.replace(/\s/g, '').length < 16) errs.cardNumber = 'Enter a 16-digit card number.';
        if (!/^\d{2}\/\d{2}$/.test(card.expiry)) errs.expiry = 'Use MM/YY format.';
        if (card.cvv.length < 3) errs.cvv = 'Enter the 3-digit CVV.';
      }
      if (!terms) errs.terms = 'Please accept the booking terms.';
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Almost there', Object.values(errs)[0]);
      return;
    }
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmBooking = () => {
    setSubmitting(true);
    window.setTimeout(() => {
      const address = useNewAddress
        ? `${newAddress.line1}${newAddress.line2 ? `, ${newAddress.line2}` : ''}, ${newAddress.city} ${newAddress.pincode}`
        : selectedAddress
          ? `${selectedAddress.line1}, ${selectedAddress.line2}, ${selectedAddress.city} ${selectedAddress.pincode}`
          : 'Mumbai';
      const booking: Booking = {
        id: uid('b'),
        ref: bookingRef(),
        customerId: user?.id ?? 'u1',
        customerName: user?.name ?? 'Aarav Mehta',
        vendorId: vendor.id,
        serviceId: service.id,
        staffId: staffId || undefined,
        date,
        time,
        duration: service.duration + addOnDetails.reduce((s, a) => s + (a.duration ?? 0), 0),
        status: method === 'cash' ? 'pending_approval' : 'confirmed',
        amount: pricing.total,
        paymentStatus: method === 'cash' ? 'pending' : 'paid',
        paymentMethod: method === 'upi' ? `UPI · ${upiId}` : method === 'card' ? `Card •••• ${card.number.slice(-4)}` : method === 'wallet' ? 'Servora wallet' : 'Cash after service',
        address,
        notes: [notes, answer].filter(Boolean).join(' · ') || undefined,
        addOns: addOns.length ? addOns : undefined,
        createdAt: iso(new Date()),
      };
      addBooking(booking);
      setCompleted(booking);
      setSubmitting(false);
      setStep(3);
      toast.success('Booking confirmed', `${booking.ref} · ${fmtDate(date)} at ${to12h(time)}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1100);
  };

  if (step === 3 && completed) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-card">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-10 text-center text-white">
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_70%,white,transparent_30%)]" />
            <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-8 ring-white/10">
              <CheckCircle2 className="h-9 w-9" />
            </span>
            <h1 className="relative mt-4 font-display text-[28px] font-extrabold tracking-tight">You’re booked!</h1>
            <p className="relative mt-1.5 text-[13px] text-emerald-100">
              {service.name} on {fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} at {to12h(time)}
            </p>
            <div className="relative mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-mono text-[12px] font-bold tracking-wide ring-1 ring-white/20">
              {completed.ref}
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-ink-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">What happens next</p>
                <ol className="mt-2 space-y-2">
                  {[
                    completed.status === 'pending_approval' ? 'Vendor reviews and confirms your request' : 'Vendor receives your confirmed booking',
                    'You get a reminder 24 hours before the visit',
                    'Professional arrives — track live from the app',
                    'Pay, review and earn loyalty points',
                  ].map((s, i) => (
                    <li key={s} className="flex items-start gap-2 text-[11.5px] text-ink-600">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[9px] font-bold text-brand-700">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rounded-xl border border-ink-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Booking summary</p>
                  <StatusBadge status={completed.status} size="sm" />
                </div>
                <div className="mt-2 space-y-1.5 text-[11.5px]">
                  <div className="flex justify-between"><span className="text-ink-500">Vendor</span><span className="font-semibold text-ink-800">{vendor.name}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Slot</span><span className="font-semibold text-ink-800">{fmtDate(date, { day: 'numeric', month: 'short' })} · {to12h(time)}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Payment</span><span className="font-semibold text-ink-800">{completed.paymentStatus === 'paid' ? 'Paid' : 'Pay after service'}</span></div>
                  <div className="flex justify-between border-t border-ink-100 pt-1.5"><span className="font-bold text-ink-900">Total</span><span className="font-display font-extrabold text-ink-900">{inr(completed.amount)}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="flex-1" iconRight={<ArrowRight className="h-4 w-4" />} onClick={() => navigate(`/customer/bookings/${completed.id}`)}>
                Track this booking
              </Button>
              <Link to="/customer/bookings" className={buttonStyles({ variant: 'outline', size: 'lg', className: 'flex-1' })}>
                <CalendarCheck className="h-4 w-4" /> My bookings
              </Link>
              <Link to="/services" className={buttonStyles({ variant: 'ghost', size: 'lg' })}>Book another</Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] text-ink-400">
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Covered by the happiness guarantee</span>
              <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3 text-brand-500" /> Chat with your pro anytime</span>
              <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-amber-500" /> +{Math.round(completed.amount / 10)} loyalty points earned</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-500 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[10.5px] text-ink-400 sm:inline">Secure checkout</span>
          <Badge tone="success" size="sm" icon={<ShieldCheck className="h-3 w-3" />}>SSL encrypted</Badge>
          <SlotHoldTimer seconds={540} />
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-ink-200 bg-white">
        <div className="flex">
          {steps.slice(0, 3).map((s, i) => (
            <button
              key={s.key}
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                'relative flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-[11.5px] font-bold transition',
                i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-brand-50 text-brand-700' : 'bg-white text-ink-400',
              )}
            >
              <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px]', i === step ? 'bg-white/20 text-white' : i < step ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400')}>
                {i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
              {i < step && <ChevronRight className="absolute right-2 hidden h-3 w-3 text-brand-300 sm:block" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          {step === 0 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Navigation className="h-4.5 w-4.5" /></span>
                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">Your live location</h2>
                    <p className="mt-0.5 text-[11.5px] text-ink-500">Detect your current position to see vendors within your travel radius. Nothing is shared with the vendor until you confirm the booking.</p>
                  </div>
                </div>
                <LocationBar className="mt-4" />
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><CalendarCheck className="h-4.5 w-4.5" /></span>
                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">When should we come?</h2>
                    <p className="mt-0.5 text-[11.5px] text-ink-500">Choose a date and an available slot. Times are shown in IST.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <BookingCalendar value={date} onChange={(d) => { setDate(d); setTime(''); }} />
                    {errors.date && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.date}</p>}
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[12px] font-bold text-ink-800">Available times</p>
                      <span className="text-[10px] text-ink-400">{fmtDate(date, { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <TimeSlotPicker slots={slots} value={time} onChange={setTime} />
                    {errors.time && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.time}</p>}
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><User className="h-4.5 w-4.5" /></span>
                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">Choose your professional</h2>
                    <p className="mt-0.5 text-[11.5px] text-ink-500">Optional — pick a favourite or let us assign the best available.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {team.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setStaffId(m.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 text-left transition',
                        staffId === m.id ? 'border-brand-300 bg-brand-50/60 ring-1 ring-brand-200' : 'border-ink-200 hover:border-ink-300',
                      )}
                    >
                      <Avatar name={m.name} size="sm" tone={m.tone} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-bold text-ink-800">{m.name}</span>
                        <span className="block text-[10px] text-ink-500">★ {m.rating} · {m.role}</span>
                      </span>
                      {staffId === m.id && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setStaffId('')}
                    className={cn('flex items-center gap-3 rounded-xl border border-dashed p-3 text-left transition', staffId === '' ? 'border-brand-300 bg-brand-50/60' : 'border-ink-300 hover:bg-ink-50')}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-ink-500"><Sparkles className="h-4 w-4" /></span>
                    <span>
                      <span className="block text-[12px] font-bold text-ink-800">No preference</span>
                      <span className="block text-[10px] text-ink-500">Best rated available</span>
                    </span>
                    {staffId === '' && <CheckCircle2 className="ml-auto h-4 w-4 text-brand-600" />}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><MapPin className="h-4.5 w-4.5" /></span>
                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">Service address</h2>
                    <p className="mt-0.5 text-[11.5px] text-ink-500">Your address is shared with the vendor only after confirmation.</p>
                  </div>
                </div>
                {errors.address && <p className="mt-2 text-xs font-medium text-rose-600">{errors.address}</p>}
                <div className="mt-4 space-y-2">
                  {!useNewAddress && addresses.map((a) => (
                    <label key={a.id} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition', addressId === a.id ? 'border-brand-300 bg-brand-50/50' : 'border-ink-200 hover:border-ink-300')}>
                      <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 h-4 w-4 accent-brand-600" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[12.5px] font-bold text-ink-900">{a.label}</span>
                          {a.isDefault && <Badge tone="brand" size="sm">Default</Badge>}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] leading-5 text-ink-500">{a.line1}, {a.line2}, {a.city} {a.pincode}</span>
                        <span className="block text-[10.5px] text-ink-400">{a.phone}</span>
                      </span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setUseNewAddress((v) => !v)}
                    className={cn('flex w-full items-center gap-2 rounded-xl border border-dashed p-3.5 text-[12px] font-bold transition', useNewAddress ? 'border-brand-300 bg-brand-50/50 text-brand-700' : 'border-ink-300 text-ink-600 hover:bg-ink-50')}
                  >
                    <Plus className="h-4 w-4" /> {useNewAddress ? 'Using a new address' : 'Add a new address'}
                  </button>
                </div>

                {useNewAddress && (
                  <div className="mt-4 grid gap-3 rounded-xl bg-ink-50/70 p-4 sm:grid-cols-2">
                    <Input containerClassName="sm:col-span-2" label="Building, flat and street" value={newAddress.line1} onChange={(e) => setNewAddress((a) => ({ ...a, line1: e.target.value }))} error={errors.line1} placeholder="B-1204, Oberoi Springs" />
                    <Input containerClassName="sm:col-span-2" label="Area / landmark (optional)" value={newAddress.line2} onChange={(e) => setNewAddress((a) => ({ ...a, line2: e.target.value }))} placeholder="New Link Road, Andheri West" />
                    <Select label="City" value={newAddress.city} onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}>
                      {['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'].map((c) => <option key={c}>{c}</option>)}
                    </Select>
                    <Input label="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} error={errors.pincode} placeholder="400053" />
                    <Input label="Contact number" value={newAddress.phone} onChange={(e) => setNewAddress((a) => ({ ...a, phone: e.target.value }))} error={errors.phone} />
                  </div>
                )}
              </Card>

              {service.addOns.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Sparkles className="h-4.5 w-4.5" /></span>
                    <div>
                      <h2 className="text-[15px] font-bold text-ink-900">Make it complete</h2>
                      <p className="mt-0.5 text-[11.5px] text-ink-500">Optional add-ons. You can remove these at any time.</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {service.addOns.map((a) => {
                      const checked = addOns.includes(a.name);
                      return (
                        <div key={a.name} className={cn('flex items-start gap-3 rounded-xl border p-3.5 transition', checked ? 'border-brand-200 bg-brand-50/40' : 'border-ink-200')}>
                          <Checkbox
                            checked={checked}
                            onChange={(v) => setAddOns((prev) => (v ? [...prev, a.name] : prev.filter((x) => x !== a.name)))}
                            label={<span className="text-[12px] font-semibold text-ink-800">{a.name}</span>}
                            description={a.duration ? `Adds ${a.duration} minutes` : 'Included in the same visit'}
                          />
                          <span className="ml-auto shrink-0 text-[12px] font-bold text-ink-800">+{inr(a.price)}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              <Card className="p-5">
                <h2 className="text-[15px] font-bold text-ink-900">Anything we should know?</h2>
                <div className="mt-3 space-y-3">
                  <Textarea
                    label="Notes for the professional"
                    placeholder="Gate code, parking, pets, focus areas…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    hint="Optional, but helps the professional arrive prepared."
                  />
                  {service.questions?.map((q) => (
                    <div key={q.id}>
                      {q.type === 'select' ? (
                        <Select label={q.label} required={q.required} value={answer} onChange={(e) => setAnswer(e.target.value)}>
                          <option value="">Select an option</option>
                          {q.options?.map((o) => <option key={o}>{o}</option>)}
                        </Select>
                      ) : (
                        <Input label={q.label} required={q.required} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer" />
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3.5 py-3">
                    <div>
                      <p className="text-[12px] font-bold text-ink-800">Number of participants</p>
                      <p className="text-[10px] text-ink-500">For group sessions only</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setParticipants((p) => Math.max(1, p - 1))} className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50">−</button>
                      <span className="w-6 text-center text-[12px] font-bold text-ink-900">{participants}</span>
                      <button type="button" onClick={() => setParticipants((p) => Math.min(10, p + 1))} className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50">+</button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CreditCard className="h-4.5 w-4.5" /></span>
                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">Payment method</h2>
                    <p className="mt-0.5 text-[11.5px] text-ink-500">Choose how you’d like to pay. All transactions are encrypted.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { key: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm and more', icon: Smartphone, badge: 'Instant' },
                    { key: 'card', label: 'Credit / debit card', desc: 'Visa, Mastercard, RuPay, Amex', icon: CreditCard },
                    { key: 'wallet', label: 'Servora wallet', desc: `Balance: ${inr(1250)}`, icon: Wallet, badge: ' ₹1,250' },
                    ...(service.serviceAt !== 'Vendor location' ? [{ key: 'cash', label: 'Pay after service', desc: 'Cash or UPI directly to the professional', icon: ShieldCheck }] : []),
                  ].map((m) => (
                    <label key={m.key} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition', method === m.key ? 'border-brand-300 bg-brand-50/50' : 'border-ink-200 hover:border-ink-300')}>
                      <input type="radio" name="method" checked={method === m.key} onChange={() => setMethod(m.key as typeof method)} className="h-4 w-4 accent-brand-600" />
                      <m.icon className={cn('h-4.5 w-4.5', method === m.key ? 'text-brand-600' : 'text-ink-400')} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[12.5px] font-bold text-ink-900">{m.label}{m.badge && <Badge tone="success" size="sm">{m.badge}</Badge>}</span>
                        <span className="block text-[10.5px] text-ink-500">{m.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>

                {method === 'upi' && (
                  <div className="mt-3 rounded-xl bg-ink-50/70 p-4">
                    <Input label="UPI ID" placeholder="yourname@okhdfcbank" value={upiId} onChange={(e) => { setUpiId(e.target.value); setError('upi', ''); }} error={errors.upi} hint="A collect request will be sent to your UPI app." />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['@okhdfcbank', '@ybl', '@paytm'].map((suffix) => (
                        <button key={suffix} type="button" onClick={() => setUpiId((v) => `${v.split('@')[0] || 'aarav'}${suffix}`)} className="rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-ink-500 hover:border-brand-200 hover:text-brand-700">{suffix}</button>
                      ))}
                    </div>
                  </div>
                )}

                {method === 'card' && (
                  <div className="mt-3 grid gap-3 rounded-xl bg-ink-50/70 p-4 sm:grid-cols-2">
                    <Input containerClassName="sm:col-span-2" label="Card number" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() }))} error={errors.cardNumber} icon={<CreditCard className="h-4 w-4" />} />
                    <Input label="Expiry" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d{1,2})/, '$1/$2') }))} error={errors.expiry} />
                    <Input label="CVV" type="password" placeholder="•••" value={card.cvv} onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} error={errors.cvv} />
                    <Input containerClassName="sm:col-span-2" label="Name on card" value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} />
                    <p className="sm:col-span-2 flex items-center gap-1.5 text-[10px] text-ink-400"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Card details are tokenised by our PCI-DSS gateway. Servora never stores them.</p>
                  </div>
                )}

                {method === 'wallet' && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                    <div>
                      <p className="text-[12px] font-bold text-emerald-900">Available balance {inr(1250)}</p>
                      <p className="text-[10.5px] text-emerald-700">Remaining {inr(Math.max(0, pricing.total - 1250))} will be charged to UPI.</p>
                    </div>
                    <Badge tone="success">Auto-applied</Badge>
                  </div>
                )}

                {method === 'cash' && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3.5">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-[10.5px] leading-5 text-amber-800">
                      Your booking will be sent to the vendor for approval. You pay after the service — please keep exact change or use UPI. Cash bookings are not eligible for instant confirmation.
                    </p>
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h2 className="text-[15px] font-bold text-ink-900">Have a coupon?</h2>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(''); }}
                    placeholder="Enter coupon code"
                    icon={<Tag className="h-4 w-4" />}
                    error={couponError}
                    containerClassName="flex-1"
                  />
                  <Button variant="outline" onClick={applyCoupon} className="shrink-0">Apply</Button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                    <p className="text-[11px] font-semibold text-emerald-800"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> {appliedCoupon} applied — {coupons[appliedCoupon].label}</p>
                    <button onClick={() => setAppliedCoupon(null)} className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900">Remove</button>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(coupons).map(([code, c]) => (
                    <button key={code} type="button" onClick={() => { setCoupon(code); setAppliedCoupon(code); setCouponError(''); toast.success('Coupon applied', c.label); }} className="rounded-full border border-dashed border-brand-200 bg-brand-50/50 px-2.5 py-1 text-[10px] font-bold text-brand-700 hover:bg-brand-50">
                      {code}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <Checkbox
                  checked={terms}
                  onChange={(v) => { setTerms(v); setError('terms', ''); }}
                  label={<span>I agree to the <Link to="/policies/terms" className="font-bold text-brand-700">booking terms</Link>, <Link to="/policies/refunds" className="font-bold text-brand-700">cancellation policy</Link> and confirm my address and slot are correct.</span>}
                />
                {errors.terms && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.terms}</p>}
              </Card>
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {step > 0 ? (
              <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)} iconLeft={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            ) : (
              <Link to={`/services/${service.slug}`} className={buttonStyles({ variant: 'ghost', size: 'lg' })}>
                <ArrowLeft className="h-4 w-4" /> Back to service
              </Link>
            )}
            {step < 2 ? (
              <Button size="lg" className="sm:ml-auto" onClick={goNext} iconRight={<ArrowRight className="h-4 w-4" />}>
                Continue to {step === 0 ? 'details' : 'payment'}
              </Button>
            ) : (
              <Button size="lg" className="sm:ml-auto" loading={submitting} onClick={confirmBooking} iconRight={!submitting ? <ShieldCheck className="h-4 w-4" /> : undefined}>
                {submitting ? 'Confirming…' : `Pay ${inr(pricing.total)} & confirm`}
              </Button>
            )}
          </div>
          <p className="mt-2 text-center text-[10px] text-ink-400 sm:text-right">No hidden fees. Free cancellation as per the service policy.</p>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-ink-100 p-4">
              <Avatar name={vendor.name} size="md" tone="teal" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-ink-900">{service.name}</p>
                <p className="text-[10.5px] text-ink-500">{vendor.name} · ★ {vendor.rating}</p>
              </div>
              {vendor.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" />}
            </div>
            <div className="space-y-2.5 p-4 text-[11.5px]">
              <div className="flex items-start gap-2"><CalendarCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" /><span className="text-ink-600">{fmtDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}{time ? ` · ${to12h(time)}` : ' · choose a time'}</span></div>
              <div className="flex items-start gap-2"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" /><span className="text-ink-600">{minsToLabel(service.duration + addOnDetails.reduce((s, a) => s + (a.duration ?? 0), 0))} total</span></div>
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" /><span className="text-ink-600">{useNewAddress ? newAddress.line1 || 'New address' : selectedAddress ? `${selectedAddress.label} · ${selectedAddress.line1}` : 'Choose an address'}</span></div>
              <div className="flex items-start gap-2"><User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" /><span className="text-ink-600">{team.find((m) => m.id === staffId)?.name ?? 'Best available pro'}</span></div>
            </div>

            <div className="border-t border-ink-100 p-4">
              <div className="space-y-2 text-[11.5px]">
                <div className="flex justify-between"><span className="text-ink-500">Service charge</span><span className="font-semibold text-ink-800">{inr(pricing.base)}</span></div>
                {addOnDetails.map((a) => (
                  <div key={a.name} className="flex justify-between gap-3"><span className="min-w-0 truncate text-ink-400">{a.name}</span><span className="shrink-0 font-semibold text-ink-700">{inr(a.price)}</span></div>
                ))}
                <div className="flex justify-between"><span className="text-ink-500">Platform fee (3%)</span><span className="font-semibold text-ink-800">{inr(pricing.platformFee)}</span></div>
                {pricing.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon {appliedCoupon}</span><span className="font-semibold">−{inr(pricing.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-ink-500">GST (18%)</span><span className="font-semibold text-ink-800">{inr(pricing.gst)}</span></div>
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-ink-200 pt-3">
                <span className="text-[12.5px] font-bold text-ink-900">Total payable</span>
                <span className="font-display text-[20px] font-extrabold text-ink-900">{inr(pricing.total)}</span>
              </div>
              <p className="mt-1 text-[10px] text-ink-400">Inclusive of all taxes · {appliedCoupon ? 'Coupon applied' : 'No coupon applied'}</p>
            </div>

            <div className="border-t border-ink-100 bg-ink-50/60 p-4">
              <div className="flex items-center gap-2 text-[10.5px] text-ink-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Happiness guarantee</div>
              <div className="mt-1.5 flex items-center gap-2 text-[10.5px] text-ink-500"><BadgeCheck className="h-3.5 w-3.5 text-brand-500" /> Verified & insured professionals</div>
              <div className="mt-1.5 flex items-center gap-2 text-[10.5px] text-ink-500"><MessageSquare className="h-3.5 w-3.5 text-violet-500" /> Free reschedule up to 24h</div>
            </div>
          </Card>

          <div className="mt-3 rounded-xl border border-ink-200 bg-white p-3.5">
            <p className="flex items-center gap-1.5 text-[10.5px] font-bold text-ink-700"><Info className="h-3.5 w-3.5 text-brand-500" /> Need help booking?</p>
            <p className="mt-1 text-[10px] leading-4 text-ink-500">Call <span className="font-semibold text-ink-700">1800-123-4567</span> or chat with support — we’ll book it for you.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
