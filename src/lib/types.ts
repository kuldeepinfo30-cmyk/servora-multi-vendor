export type Role = 'customer' | 'vendor' | 'admin';
export type Tone =
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'violet'
  | 'amber'
  | 'teal';

export interface Category {
  id: string;
  slug: string;
  name: string;
  short: string;
  description: string;
  icon: string;
  tone: Tone;
  image: string;
  vendors: number;
  services: number;
  from: number;
  subcategories: string[];
}

export interface AddOn {
  name: string;
  price: number;
  duration?: number;
}

export interface ServiceQuestion {
  id: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  options?: string[];
  required?: boolean;
}

export interface Service {
  id: string;
  slug: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  price: number;
  priceType: 'fixed' | 'hourly' | 'session' | 'package';
  duration: number;
  rating: number;
  reviewCount: number;
  bookings: number;
  tags: string[];
  featured?: boolean;
  status: 'published' | 'draft' | 'pending';
  addOns: AddOn[];
  notice: number;
  maxAdvance: number;
  cancellation: 'Flexible' | 'Moderate' | 'Strict';
  serviceAt: 'Customer location' | 'Vendor location' | 'Both';
  questions: ServiceQuestion[];
  availableToday: boolean;
  discount?: number;
  includes: string[];
}

export interface Staff {
  id: string;
  vendorId: string;
  name: string;
  role: string;
  tone: Tone;
  rating: number;
  jobs: number;
  services: string[];
  status: 'active' | 'on_leave' | 'inactive';
  email: string;
  phone: string;
  commission: number;
  experience: string;
}

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  owner: string;
  categoryId: string;
  city: string;
  area: string;
  address: string;
  rating: number;
  reviewCount: number;
  jobsDone: number;
  verified: boolean;
  featured: boolean;
  responseTime: string;
  since: number;
  cover: string;
  priceFrom: number;
  languages: string[];
  radius: number;
  status: 'approved' | 'pending' | 'suspended';
  commission: number;
  email: string;
  phone: string;
  website?: string;
  hours: { day: string; open: string; close: string; closed?: boolean }[];
  gallery: string[];
  certifications: string[];
  policies: { cancellation: string; reschedule: string; refund: string };
  socials: { instagram?: string; facebook?: string; linkedin?: string };
  staffIds: string[];
  tags: string[];
}

export type BookingStatus =
  | 'pending_payment'
  | 'pending_approval'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancellation_requested'
  | 'cancelled'
  | 'rejected'
  | 'expired'
  | 'no_show'
  | 'disputed'
  | 'refunded';

export interface Booking {
  id: string;
  ref: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  serviceId: string;
  staffId?: string;
  date: string;
  time: string;
  duration: number;
  status: BookingStatus;
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed' | 'partial';
  paymentMethod: string;
  address: string;
  notes?: string;
  addOns?: string[];
  participants?: number;
  createdAt: string;
  refundAmount?: number;
}

export interface Review {
  id: string;
  vendorId: string;
  serviceId: string;
  customer: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  reply?: string;
  images?: string[];
  verified: boolean;
  flagged?: boolean;
  hidden?: boolean;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface Notification {
  id: string;
  kind: 'booking' | 'payment' | 'review' | 'system' | 'message' | 'promo';
  title: string;
  body: string;
  time: string;
  read: boolean;
  audience: Role;
  href?: string;
}

export interface Transaction {
  id: string;
  ref: string;
  bookingRef: string;
  customer: string;
  vendor: string;
  type: 'Payment' | 'Refund' | 'Payout' | 'Commission';
  method: string;
  amount: number;
  fee: number;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  date: string;
  gateway: string;
}

export interface Payout {
  id: string;
  ref: string;
  vendorId: string;
  vendor: string;
  amount: number;
  fee: number;
  method: string;
  status: 'requested' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed';
  requestedAt: string;
  period: string;
  bank: string;
}

export interface Dispute {
  id: string;
  bookingRef: string;
  customer: string;
  vendor: string;
  amount: number;
  reason: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  opened: string;
  evidence: number;
  priority: 'high' | 'medium' | 'low';
}

export interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created: string;
  updated: string;
  messages: { from: 'me' | 'support'; text: string; time: string }[];
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  uses: number;
  limit: number;
  expires: string;
  status: 'active' | 'scheduled' | 'expired' | 'disabled';
  scope: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  time: string;
  tone: Tone;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joined: string;
  bookings: number;
  spend: number;
  status: 'active' | 'blocked' | 'suspended';
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  tone: Tone;
}

export interface Application {
  id: string;
  business: string;
  owner: string;
  category: string;
  city: string;
  submitted: string;
  docs: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  email: string;
  phone: string;
  notes: string;
  tone: Tone;
}

export interface Conversation {
  id: string;
  name: string;
  role: string;
  tone: Tone;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  bookingRef?: string;
  messages: { id: string; from: 'me' | 'them'; text: string; time: string; attachment?: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  city: string;
  tone: Tone;
  vendorId?: string;
}
