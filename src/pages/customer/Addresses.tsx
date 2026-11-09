import { useState } from 'react';
import {
  Briefcase,
  Check,
  Home,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useApp } from '@/store/app';
import { toast } from '@/store/toast';
import { useMockLoad } from '@/lib/hooks';
import type { Address } from '@/lib/types';
import { cn, uid } from '@/lib/utils';
import { Badge, Button, Card, EmptyState, Input, Select, Skeleton } from '@/components/ui/primitives';
import { PageHeader } from '@/components/ui/data-display';
import { ConfirmDialog, Dropdown, DropdownItem, Modal } from '@/components/ui/overlays';

const emptyForm = {
  label: 'Home' as Address['label'],
  name: '',
  line1: '',
  line2: '',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '',
  phone: '',
  isDefault: false,
};

const cities = ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];

export default function CustomerAddresses() {
  const { user } = useAuth();
  const loading = useMockLoad(360);
  const addresses = useApp((s) => s.addresses);
  const addAddress = useApp((s) => s.addAddress);
  const updateAddress = useApp((s) => s.updateAddress);
  const removeAddress = useApp((s) => s.removeAddress);
  const setDefaultAddress = useApp((s) => s.setDefaultAddress);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, name: user?.name ?? '', phone: user?.phone ?? '' });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({ label: a.label, name: a.name, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, phone: a.phone, isDefault: a.isDefault });
    setErrors({});
    setOpen(true);
  };

  const save = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Enter the recipient’s name.';
    if (!form.line1.trim()) errs.line1 = 'Enter the building and street.';
    if (!/^\d{6}$/.test(form.pincode)) errs.pincode = 'Enter a valid 6-digit pincode.';
    if (!/^[0-9+\s-]{10,15}$/.test(form.phone)) errs.phone = 'Enter a valid phone number.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    window.setTimeout(() => {
      if (editing) {
        updateAddress(editing.id, form);
        toast.success('Address updated', `${form.label} address saved.`);
      } else {
        addAddress({ ...form, id: uid('a') });
        toast.success('Address added', `${form.label} address is ready for checkout.`);
      }
      setSaving(false);
      setOpen(false);
    }, 500);
  };

  return (
    <div>
      <PageHeader
        title="Saved addresses"
        description="Manage where services are delivered. Your default address is used automatically at checkout."
        actions={<Button size="md" iconLeft={<Plus className="h-4 w-4" />} onClick={openNew}>Add address</Button>}
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[180px]" />)}
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-5 w-5" />}
          title="No saved addresses"
          description="Add your home or work address so checkout takes seconds."
          action={<Button size="sm" onClick={openNew} iconLeft={<Plus className="h-3.5 w-3.5" />}>Add your first address</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {addresses.map((a) => {
            const Icon = a.label === 'Work' ? Briefcase : a.label === 'Home' ? Home : MapPin;
            return (
              <Card key={a.id} className={cn('relative p-5', a.isDefault && 'ring-1 ring-brand-200')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', a.isDefault ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500')}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-ink-900">{a.label}</p>
                        {a.isDefault && <Badge tone="brand" size="sm">Default</Badge>}
                      </div>
                      <p className="text-[10.5px] text-ink-400">{a.name}</p>
                    </div>
                  </div>
                  <Dropdown
                    trigger={<button className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700" aria-label={`Manage ${a.label} address`}><MoreHorizontal className="h-4 w-4" /></button>}
                  >
                    {(close) => (
                      <div>
                        <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { close(); openEdit(a); }}>Edit address</DropdownItem>
                        {!a.isDefault && (
                          <DropdownItem icon={<Check className="h-4 w-4" />} onClick={() => { close(); setDefaultAddress(a.id); toast.success('Default updated', `${a.label} is now your default address.`); }}>
                            Set as default
                          </DropdownItem>
                        )}
                        <DropdownItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => { close(); setDeleteTarget(a); }}>Delete</DropdownItem>
                      </div>
                    )}
                  </Dropdown>
                </div>
                <p className="mt-3 text-[12px] leading-6 text-ink-600">
                  {a.line1}<br />
                  {a.line2}<br />
                  {a.city}, {a.state} {a.pincode}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] text-ink-500"><Phone className="h-3 w-3" /> {a.phone}</span>
                  {!a.isDefault && (
                    <button onClick={() => { setDefaultAddress(a.id); toast.success('Default updated'); }} className="ml-auto text-[10.5px] font-bold text-brand-700 hover:text-brand-800">
                      Set default
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
          <button onClick={openNew} className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-ink-50/40 text-ink-500 transition hover:border-brand-300 hover:bg-brand-50/30 hover:text-brand-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-ink-100"><Plus className="h-5 w-5" /></span>
            <span className="mt-2 text-[12px] font-bold">Add a new address</span>
            <span className="mt-0.5 text-[10.5px] text-ink-400">Home, work or a friend’s place</span>
          </button>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit address' : 'Add a new address'}
        description="We only share this with the vendor after your booking is confirmed."
        icon={<MapPin className="h-5 w-5" />}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} loading={saving}>{editing ? 'Save changes' : 'Add address'}</Button>
          </>
        }
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Select label="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value as Address['label'] }))}>
            <option>Home</option><option>Work</option><option>Other</option>
          </Select>
          <Input label="Recipient name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} required />
          <Input containerClassName="sm:col-span-2" label="Building, flat and street" value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} error={errors.line1} placeholder="B-1204, Oberoi Springs" required />
          <Input containerClassName="sm:col-span-2" label="Area / landmark" value={form.line2} onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))} placeholder="New Link Road, Andheri West" />
          <Select label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input label="Pincode" value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} error={errors.pincode} placeholder="400053" required />
          <Input label="State" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} error={errors.phone} required />
          <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} className="h-4 w-4 rounded border-ink-300 accent-brand-600" />
            <span className="text-[12px] text-ink-600">Make this my default address</span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            removeAddress(deleteTarget.id);
            toast.success('Address deleted', `${deleteTarget.label} address removed.`);
          }
          setDeleteTarget(null);
        }}
        title="Delete this address?"
        description={deleteTarget ? `${deleteTarget.line1}, ${deleteTarget.city} ${deleteTarget.pincode}` : undefined}
        confirmLabel="Delete address"
      />

      <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50/60 p-4">
        <p className="text-[11px] font-bold text-ink-700">Serviceable areas</p>
        <p className="mt-1 text-[10.5px] leading-5 text-ink-500">
          Servora currently operates in {cities.length} cities with 500+ verified businesses. If your pincode isn’t serviceable yet, join the waitlist and we’ll notify you at launch.
        </p>
      </div>
    </div>
  );
}
