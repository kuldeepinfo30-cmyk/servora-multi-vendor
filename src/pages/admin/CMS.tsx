import { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  LayoutTemplate,
  Link2,
  Plus,
  Search,
  Send,
  Network,
} from 'lucide-react';
import { cn, fmtDate } from '@/lib/utils';
import { useMockLoad } from '@/lib/hooks';
import { toast } from '@/store/toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Textarea,
} from '@/components/ui/primitives';
import { DataTable, ExportButton, PageHeader, SectionCard, StatusBadge } from '@/components/ui/data-display';
import { ConfirmDialog, Drawer } from '@/components/ui/overlays';

type PageStatus = 'published' | 'draft' | 'scheduled' | 'review';

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  type: 'Marketing' | 'Legal' | 'Help' | 'Blog';
  author: string;
  updated: string;
  status: PageStatus;
  views: number;
  seoScore: number;
  body: string;
  metaTitle: string;
  metaDescription: string;
  noindex: boolean;
}

const seed: CmsPage[] = [
  {
    id: 'pg1', title: 'Homepage', slug: '/', type: 'Marketing', author: 'Aisha Khan', updated: '2026-11-06', status: 'published', views: 184200, seoScore: 94,
    body: 'India\u2019s trusted marketplace for local home services. Verified professionals, upfront pricing and happiness guaranteed.',
    metaTitle: 'Servora — Book trusted local services at home', metaDescription: 'Book verified home cleaning, AC repair, beauty, plumbing and more. Upfront prices, instant confirmation.', noindex: false,
  },
  {
    id: 'pg2', title: 'How it works', slug: '/how-it-works', type: 'Marketing', author: 'Meera Joshi', updated: '2026-11-04', status: 'published', views: 42800, seoScore: 88,
    body: 'Browse services, pick a slot, pay securely and track your professional live. Every booking is backed by the Servora Happiness Guarantee.',
    metaTitle: 'How Servora works — booking local services in 3 steps', metaDescription: 'See how to book a verified professional in minutes, from slot selection to payment and follow-up.', noindex: false,
  },
  {
    id: 'pg3', title: 'Terms of service', slug: '/policies/terms', type: 'Legal', author: 'Aisha Khan', updated: '2026-10-28', status: 'published', views: 18600, seoScore: 76,
    body: 'These terms govern your use of the Servora marketplace, including bookings, payments, cancellations and dispute resolution.',
    metaTitle: 'Terms of service', metaDescription: 'Read the terms that apply to customers, vendors and visitors using the Servora marketplace.', noindex: false,
  },
  {
    id: 'pg4', title: 'Privacy policy', slug: '/policies/privacy', type: 'Legal', author: 'Aisha Khan', updated: '2026-10-28', status: 'published', views: 12400, seoScore: 74,
    body: 'How Servora collects, uses and protects personal data, including location, payment and communication records.',
    metaTitle: 'Privacy policy', metaDescription: 'Learn what data Servora collects, why we collect it and the controls available to you.', noindex: false,
  },
  {
    id: 'pg5', title: 'Cancellation & refund policy', slug: '/policies/refunds', type: 'Legal', author: 'Rahul Nair', updated: '2026-11-02', status: 'review', views: 8900, seoScore: 71,
    body: 'Free cancellation up to 12 hours before the slot. Inside 12 hours, a 50% fee may apply. Full refunds for vendor cancellations or no-shows.',
    metaTitle: 'Cancellation & refunds', metaDescription: 'Understand cancellation windows, refund timelines and how disputes are handled.', noindex: false,
  },
  {
    id: 'pg6', title: 'Help centre', slug: '/help', type: 'Help', author: 'Meera Joshi', updated: '2026-11-05', status: 'published', views: 33200, seoScore: 90,
    body: 'Browse help articles for bookings, payments, refunds, vendor onboarding and account security.',
    metaTitle: 'Help centre', metaDescription: 'Find answers to common questions about bookings, payments, refunds and your account.', noindex: false,
  },
  {
    id: 'pg7', title: 'Festive cleaning guide', slug: '/blog/festive-cleaning-guide', type: 'Blog', author: 'Meera Joshi', updated: '2026-11-01', status: 'scheduled', views: 0, seoScore: 82,
    body: 'A room-by-room checklist to get your home ready for Diwali, with expert tips from SparkleHome Cleaning Co.',
    metaTitle: 'The complete festive cleaning checklist', metaDescription: 'A practical room-by-room guide to deep cleaning before the festive season.', noindex: false,
  },
  {
    id: 'pg8', title: 'Vendor guidelines', slug: '/policies/vendor-guidelines', type: 'Legal', author: 'Aisha Khan', updated: '2026-10-30', status: 'draft', views: 0, seoScore: 63,
    body: 'Service standards, arrival windows, photography requirements and conduct expectations for marketplace partners.',
    metaTitle: 'Vendor guidelines', metaDescription: 'The standards every Servora partner agrees to when joining the marketplace.', noindex: true,
  },
];

const typeTone: Record<string, string> = {
  Marketing: 'brand',
  Legal: 'violet',
  Help: 'info',
  Blog: 'warning',
};

export default function AdminCms() {
  const loading = useMockLoad(320);
  const [pages, setPages] = useState<CmsPage[]>(seed);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<CmsPage | null>(null);
  const [draft, setDraft] = useState<CmsPage | null>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null);

  const rows = useMemo(
    () =>
      pages.filter((p) => {
        if (tab !== 'all' && p.status !== tab) return false;
        if (query && !`${p.title} ${p.slug} ${p.type}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [pages, tab, query],
  );

  const openNew = () => {
    setDraft({
      id: `pg${Date.now()}`,
      title: '',
      slug: '/',
      type: 'Marketing',
      author: 'Aisha Khan',
      updated: new Date().toISOString().slice(0, 10),
      status: 'draft',
      views: 0,
      seoScore: 50,
      body: '',
      metaTitle: '',
      metaDescription: '',
      noindex: false,
    });
    setPreview(false);
    setError('');
  };

  const openEdit = (p: CmsPage) => {
    setDraft({ ...p });
    setPreview(false);
    setError('');
  };

  const save = (status?: PageStatus) => {
    if (!draft) return;
    if (!draft.title.trim()) return setError('Give the page a title.');
    if (!draft.slug.startsWith('/')) return setError('The URL slug must start with a forward slash.');
    if (pages.some((p) => p.slug === draft.slug && p.id !== draft.id)) return setError('That slug is already used by another page.');
    if (!draft.metaDescription.trim()) return setError('Add a meta description so search engines can summarise the page.');

    const payload: CmsPage = {
      ...draft,
      status: status ?? draft.status,
      updated: new Date().toISOString().slice(0, 10),
      seoScore: Math.min(100, 50 + (draft.title ? 12 : 0) + (draft.metaDescription ? 20 : 0) + (draft.body.length > 120 ? 12 : 0) + (draft.noindex ? 0 : 6)),
    };
    setPages((list) => (list.some((p) => p.id === payload.id) ? list.map((p) => (p.id === payload.id ? payload : p)) : [payload, ...list]));
    setDraft(payload);
    toast.success(status === 'published' ? 'Page published' : 'Draft saved', status === 'published' ? `${payload.title} is live at ${payload.slug}.` : 'Your changes are saved and visible only to admins.');
    if (status === 'published') setActive(null);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-full max-w-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)}</div>
        <Skeleton className="h-[440px]" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="CMS pages"
        description="Manage marketing, legal and help content with SEO controls and a publish workflow."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-sky-600">
            <LayoutTemplate className="h-3.5 w-3.5" /> Content management
          </span>
        }
        actions={
          <>
            <ExportButton
              filename="cms-pages.csv"
              rows={pages}
              columns={[{ key: 'title', label: 'Title' }, { key: 'slug', label: 'Slug' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'updated', label: 'Updated' }]}
            />
            <Button size="sm" iconLeft={<Plus className="h-4 w-4" />} onClick={openNew}>New page</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Published pages', value: pages.filter((p) => p.status === 'published').length, hint: 'indexed by search', icon: Globe, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'In review / draft', value: pages.filter((p) => ['review', 'draft'].includes(p.status)).length, hint: 'awaiting approval', icon: FileText, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Scheduled', value: pages.filter((p) => p.status === 'scheduled').length, hint: 'auto-publishes', icon: Clock, tone: 'bg-sky-50 text-sky-600' },
          { label: 'Avg. SEO score', value: Math.round(pages.reduce((a, p) => a + p.seoScore, 0) / pages.length), hint: 'target 85+', icon: Link2, tone: 'bg-violet-50 text-violet-600' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', s.tone)}>
              <s.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[19px] font-extrabold leading-none text-ink-900">{s.value}</p>
              <p className="mt-1 truncate text-[10.5px] font-semibold text-ink-600">{s.label}</p>
              <p className="text-[9.5px] text-ink-400">{s.hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-ink-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { key: 'all', label: 'All pages', count: pages.length },
                { key: 'published', label: 'Published', count: pages.filter((p) => p.status === 'published').length },
                { key: 'review', label: 'In review', count: pages.filter((p) => p.status === 'review').length },
                { key: 'draft', label: 'Drafts', count: pages.filter((p) => p.status === 'draft').length },
                { key: 'scheduled', label: 'Scheduled', count: pages.filter((p) => p.status === 'scheduled').length },
              ]}
            />
            <div className="relative lg:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or slug…" className="h-9 w-full rounded-lg border border-ink-200 pl-9 pr-3 text-[12px] focus:border-brand-400 focus:outline-none" />
            </div>
          </div>

          <DataTable
            rows={rows}
            rowKey={(p) => p.id}
            onRowClick={openEdit}
            empty={<EmptyState compact icon={<FileText className="h-5 w-5" />} title="No pages in this view" description="Create a page or change the filter to see existing content." action={<Button size="sm" onClick={openNew}>New page</Button>} />}
            columns={[
              {
                key: 'title',
                header: 'Page',
                render: (p) => (
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500"><FileText className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[11.5px] font-bold text-ink-900">{p.title}</p>
                      <p className="font-mono text-[9.5px] text-ink-400">{p.slug}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'type', header: 'Type', render: (p) => <Badge tone={typeTone[p.type]} size="sm">{p.type}</Badge> },
              { key: 'author', header: 'Owner', render: (p) => <span className="text-[10.5px] text-ink-600">{p.author}</span> },
              { key: 'views', header: 'Views', align: 'right', render: (p) => <span className="text-[10.5px] font-semibold text-ink-700">{p.views ? new Intl.NumberFormat('en-IN').format(p.views) : '—'}</span> },
              { key: 'seo', header: 'SEO', align: 'center', render: (p) => <Badge tone={p.seoScore >= 85 ? 'success' : p.seoScore >= 70 ? 'warning' : 'danger'} size="sm">{p.seoScore}</Badge> },
              { key: 'updated', header: 'Updated', render: (p) => <span className="text-[10.5px] text-ink-500">{fmtDate(p.updated)}</span> },
              { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status === 'review' ? 'under_review' : p.status} size="sm" label={p.status === 'review' ? 'In review' : undefined} /> },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (p) => (
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="xs" variant="ghost" onClick={() => { setActive(p); setPreview(true); }} aria-label="Preview"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="xs" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        <div className="space-y-4">
          <SectionCard title="Publishing workflow" description="How content goes live">
            <div className="space-y-3">
              {[
                ['Draft', 'Author writes and saves changes.', 'neutral'],
                ['In review', 'Legal or brand approves the copy.', 'warning'],
                ['Scheduled', 'Goes live automatically at a set time.', 'info'],
                ['Published', 'Visible to the public and indexed.', 'success'],
              ].map(([label, body, tone], i) => (
                <div key={String(label)} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[9px] font-bold text-ink-500">{i + 1}</span>
                  <div>
                    <Badge tone={String(tone)} size="sm">{label}</Badge>
                    <p className="mt-1 text-[10px] leading-4 text-ink-500">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="SEO health" description="Site-wide checks">
            <div className="space-y-2.5">
              {[
                ['Pages with meta description', true],
                ['Canonical tags on all pages', true],
                ['Sitemap submitted to Google', true],
                ['2 pages marked noindex', false],
                ['5 pages missing alt text', false],
              ].map(([label, ok]) => (
                <p key={String(label)} className="flex items-center gap-2 text-[10.5px] text-ink-600">
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded-full', ok ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')}>
                    {ok ? <Check className="h-2.5 w-2.5" /> : '!'}
                  </span>
                  {label}
                </p>
              ))}
            </div>
            <div className="mt-3 border-t border-ink-100 pt-3">
              <Button size="xs" variant="outline" iconLeft={<Network className="h-3.5 w-3.5" />} onClick={() => toast.success('Sitemap regenerated', 'Search engines have been pinged with the fresh sitemap.')}>Regenerate sitemap</Button>
            </div>
          </SectionCard>

          <Card className="bg-gradient-to-br from-sky-600 to-brand-700 p-4 text-white">
            <p className="flex items-center gap-1.5 text-[12px] font-bold"><Globe className="h-4 w-4" /> Live announcement</p>
            <p className="mt-1 text-[10.5px] leading-5 text-white/75">The festive banner is showing on the homepage. It ends automatically on 15 Nov.</p>
            <button onClick={() => toast.info('Announcements', 'Manage promotional banners from the Coupons & promotions area.')} className="mt-2.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-[10.5px] font-bold backdrop-blur transition hover:bg-white/25">Manage banners</button>
          </Card>
        </div>
      </div>

      <Drawer
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title}
        description={active ? `${active.type} · ${active.slug}` : undefined}
        width="max-w-2xl"
        footer={
          active ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setActive(null)}>Close</Button>
              <Button variant="outline" size="sm" onClick={() => { setDraft({ ...active }); setActive(null); }}>Edit page</Button>
              {active.status !== 'published' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    setPages((list) => list.map((p) => (p.id === active.id ? { ...p, status: 'published' } : p)));
                    toast.success('Page published', `${active.title} is now live.`);
                    setActive(null);
                  }}
                >
                  <Send className="h-3.5 w-3.5" /> Publish now
                </Button>
              )}
            </>
          ) : null
        }
      >
        {active && (
          <div className="space-y-4">
            {preview ? (
              <>
                <div className="flex items-center justify-between">
                  <Badge tone="success" size="sm">Preview mode</Badge>
                  <Button size="xs" variant="ghost" onClick={() => setPreview(false)}>View details</Button>
                </div>
                <article className="rounded-xl border border-ink-100 p-5">
                  <p className="text-[9.5px] uppercase tracking-wide text-ink-400">servora.in{active.slug}</p>
                  <h2 className="mt-2 font-display text-[22px] font-extrabold text-ink-900">{active.title}</h2>
                  <p className="mt-1 text-[10.5px] text-ink-400">Updated {fmtDate(active.updated)} · {active.author}</p>
                  <div className="mt-4 space-y-3 text-[12px] leading-6 text-ink-600">
                    <p>{active.body}</p>
                    <p className="text-ink-400">This is a simplified preview. The live page applies the full marketing layout, navigation and footer.</p>
                  </div>
                </article>
                <div className="rounded-xl border border-ink-100 bg-ink-50 p-3">
                  <p className="text-[9.5px] font-bold uppercase tracking-wide text-ink-400">Search preview</p>
                  <p className="mt-1 text-[11px] font-semibold text-sky-700">{active.metaTitle || active.title}</p>
                  <p className="text-[9.5px] text-emerald-700">servora.in{active.slug}</p>
                  <p className="text-[10px] leading-4 text-ink-500">{active.metaDescription}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><StatusBadge status={active.status === 'review' ? 'under_review' : active.status} /><Badge tone={typeTone[active.type]} size="sm">{active.type}</Badge></div>
                  <Button size="xs" variant="ghost" iconLeft={<Eye className="h-3.5 w-3.5" />} onClick={() => setPreview(true)}>Preview</Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-ink-50 p-2.5"><p className="text-[9px] uppercase tracking-wide text-ink-400">Views</p><p className="text-[13px] font-bold text-ink-900">{active.views ? new Intl.NumberFormat('en-IN').format(active.views) : '0'}</p></div>
                  <div className="rounded-lg bg-ink-50 p-2.5"><p className="text-[9px] uppercase tracking-wide text-ink-400">SEO score</p><p className="text-[13px] font-bold text-ink-900">{active.seoScore}/100</p></div>
                </div>
                <div className="rounded-xl border border-ink-100 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Body</p>
                  <p className="mt-1 text-[11.5px] leading-5 text-ink-600">{active.body}</p>
                </div>
                <div className="rounded-xl border border-ink-100 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">SEO metadata</p>
                  <p className="mt-1 text-[11px] font-semibold text-ink-800">{active.metaTitle}</p>
                  <p className="mt-0.5 text-[10.5px] leading-5 text-ink-500">{active.metaDescription}</p>
                  <p className="mt-1 text-[9.5px] text-ink-400">{active.noindex ? 'Marked noindex — hidden from search engines.' : 'Indexable by search engines.'}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="xs" variant="outline" iconLeft={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => toast.info('Opening live page', `${active.slug} opens in a new tab in production.`)}>Open live page</Button>
                  <Button size="xs" variant="ghost" onClick={() => { setDeleteTarget(active); setActive(null); }} className="text-rose-600 hover:bg-rose-50">Delete page</Button>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft && pages.some((p) => p.id === draft.id) ? 'Edit page' : 'New page'}
        description="Changes are saved as a draft until published."
        width="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
            <Button variant="outline" size="sm" onClick={() => save('draft')}>Save draft</Button>
            <Button size="sm" onClick={() => save('published')}><Send className="h-3.5 w-3.5" /> Publish</Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{error}</div>}
            <Input label="Page title" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Festive cleaning guide" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="URL slug" required value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value.startsWith('/') ? e.target.value : `/${e.target.value}` })} hint="Must start with /" />
              <Select label="Content type" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as CmsPage['type'] })}>
                <option>Marketing</option>
                <option>Legal</option>
                <option>Help</option>
                <option>Blog</option>
              </Select>
            </div>
            <Textarea label="Page body" className="min-h-[140px] text-[12px]" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Write the page copy. Basic markdown is supported." hint="Markdown supported: **bold**, _italic_, [link](url), lists." />
            <div className="rounded-xl border border-ink-200 p-3.5">
              <p className="text-[11px] font-bold text-ink-800">Search engine listing</p>
              <div className="mt-2 space-y-3">
                <Input label="Meta title" value={draft.metaTitle} onChange={(e) => setDraft({ ...draft, metaTitle: e.target.value })} hint={`${draft.metaTitle.length}/60 characters`} />
                <Textarea label="Meta description" className="min-h-[72px] text-[12px]" value={draft.metaDescription} onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })} hint={`${draft.metaDescription.length}/160 characters`} />
              </div>
              <div className="mt-3">
                <Switch checked={draft.noindex} onChange={(v) => setDraft({ ...draft, noindex: v })} label="Hide from search engines" description="Adds a noindex tag. Use for internal or duplicate pages." />
              </div>
            </div>
            <div className="rounded-lg bg-ink-50 p-3 text-[10.5px] leading-5 text-ink-500">
              Publishing updates the live page immediately and creates an audit log entry. Legal pages additionally require a second admin approval.
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setPages((list) => list.filter((p) => p.id !== deleteTarget.id));
          toast.success('Page deleted', `${deleteTarget.title} was removed from the CMS.`);
          setDeleteTarget(null);
        }}
        title={`Delete “${deleteTarget?.title}”?`}
        description="The page will return a 404. This cannot be undone, but you can restore it from the audit log within 30 days."
        confirmLabel="Delete page"
      />
    </div>
  );
}
