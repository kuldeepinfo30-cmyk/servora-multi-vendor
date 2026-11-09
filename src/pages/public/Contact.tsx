import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CheckCircle2, Clock, Headphones, Mail, MapPin, MessageSquare, Phone, Send, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toast';
import { Button, Card, Input, Select, Textarea } from '@/components/ui/primitives';
import { SectionHeading } from '@/components/marketplace';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: 'Booking help', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.message.trim().length < 15) next.message = 'Please add a little more detail (at least 15 characters).';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success('Message sent', 'Our support team will reply within 4 working hours.');
    }, 900);
  };

  return (
    <div>
      <section className="border-b border-ink-100 bg-mesh">
        <div className="container-page py-11">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] text-ink-400">
            <Link to="/" className="hover:text-brand-600">Home</Link>
            <span>/</span>
            <span className="text-ink-600">Contact</span>
          </div>
          <p className="eyebrow mb-2.5">We’re here to help</p>
          <h1 className="font-display text-[32px] font-extrabold tracking-tight text-ink-900 sm:text-[40px]">Talk to a real human.</h1>
          <p className="mt-2.5 max-w-xl text-[13.5px] leading-6 text-ink-500">
            Booking question, payment issue or vendor partnership — pick a channel and we will get back fast.
            Average first response: 3 minutes on live chat, 4 hours on email.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-[11.5px] font-semibold text-ink-600">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand-600" /> Support hours 8 AM – 10 PM IST</span>
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-emerald-600" /> 98% resolution on first contact</span>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h2 className="mt-4 font-display text-xl font-extrabold text-ink-900">Message received</h2>
              <p className="mt-2 max-w-sm text-[12.5px] leading-6 text-ink-500">
                Thanks {form.name.split(' ')[0]}. Our team will reply to <span className="font-semibold text-ink-700">{form.email}</span> within
                4 working hours. Your reference is <span className="font-mono font-semibold text-brand-700">CNT-{Math.floor(10000 + Math.random() * 89999)}</span>.
              </p>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', topic: 'Booking help', message: '' }); }}>
                  Send another message
                </Button>
                <Link to="/help"><Button size="sm" variant="soft">Visit help center</Button></Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-extrabold text-ink-900">Send us a message</h2>
                <p className="mt-1 text-[12px] text-ink-500">Fill in the form and we will route it to the right team.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" required placeholder="Aarav Mehta" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
                <Input label="Email address" required type="email" placeholder="you@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Phone (optional)" placeholder="+91 98XXX XXXXX" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                <Select label="Topic" value={form.topic} onChange={(e) => set('topic', e.target.value)}>
                  <option>Booking help</option>
                  <option>Payment or refund</option>
                  <option>Review or dispute</option>
                  <option>Vendor partnership</option>
                  <option>Press & media</option>
                  <option>Something else</option>
                </Select>
              </div>
              <Textarea
                label="How can we help?"
                required
                rows={5}
                placeholder="Share your booking reference (if any) and as much detail as possible…"
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                error={errors.message}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="max-w-xs text-[10px] leading-4 text-ink-400">
                  By submitting you agree to our <Link to="/policies/privacy" className="underline hover:text-brand-600">privacy policy</Link>.
                </p>
                <Button type="submit" loading={loading} iconRight={<Send className="h-3.5 w-3.5" />}>Send message</Button>
              </div>
            </form>
          )}
        </Card>

        <div className="space-y-4">
          {[
            { icon: Headphones, title: 'Customer support', desc: 'Bookings, payments, refunds and disputes.', email: 'support@servora.demo', phone: '+91 80 4718 2200', tone: 'brand' },
            { icon: Store, title: 'Vendor support', desc: 'Onboarding, payouts and listing help.', email: 'vendors@servora.demo', phone: '+91 80 4718 2210', tone: 'emerald' },
            { icon: MessageSquare, title: 'Press & partnerships', desc: 'Media kit, collaborations and brand.', email: 'press@servora.demo', phone: '+91 80 4718 2220', tone: 'violet' },
          ].map((c) => (
            <Card key={c.title} className="p-5">
              <div className="flex items-start gap-3">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', c.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : c.tone === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-brand-50 text-brand-600')}>
                  <c.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-bold text-ink-900">{c.title}</h3>
                  <p className="mt-0.5 text-[11px] text-ink-500">{c.desc}</p>
                  <div className="mt-2 space-y-1">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-700 hover:text-brand-800"><Mail className="h-3 w-3" /> {c.email}</a>
                    <p className="flex items-center gap-1.5 text-[11px] text-ink-500"><Phone className="h-3 w-3" /> {c.phone}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Card className="p-5">
            <h3 className="text-[13px] font-bold text-ink-900">Registered office</h3>
            <p className="mt-2 flex items-start gap-2 text-[11.5px] leading-5 text-ink-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
              Servora Marketplace Pvt. Ltd.<br />
              4th Floor, Prestige Tech Park, Kadubeesanahalli,<br />
              Bengaluru, Karnataka 560103
            </p>
            <div className="mt-3 border-t border-ink-100 pt-3">
              <p className="flex items-center gap-1.5 text-[10.5px] text-ink-400"><Clock className="h-3 w-3" /> Mon–Sun, 8:00 AM – 10:00 PM IST</p>
              <p className="mt-1 text-[10.5px] text-ink-400">CIN: U74999KA2019PTC123456 · GSTIN: 29AABCS4567G1Z2</p>
            </div>
          </Card>
        </div>
      </div>

      <section className="border-t border-ink-100 bg-ink-50/50 py-12">
        <div className="container-page">
          <SectionHeading eyebrow="Faster answers" title="Try these before you write in" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Cancel or reschedule a booking', desc: 'Manage it instantly from My Bookings.', to: '/customer/bookings' },
              { title: 'Track a refund', desc: 'Check payment status and UTR references.', to: '/customer/payments' },
              { title: 'Browse the help center', desc: 'Guides for bookings, payments and vendors.', to: '/help' },
            ].map((l) => (
              <Link key={l.title} to={l.to} className="group rounded-xl border border-ink-200/80 bg-white p-4 transition hover:border-brand-300">
                <p className="text-[12.5px] font-bold text-ink-900 group-hover:text-brand-700">{l.title}</p>
                <p className="mt-1 text-[11px] text-ink-500">{l.desc}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-bold text-brand-600">Open <ArrowRight className="h-3 w-3" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
