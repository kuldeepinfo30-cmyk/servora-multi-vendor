/* eslint-disable no-console */
import {
  ApplicationStatus,
  BookingStatus,
  CmsStatus,
  CouponStatus,
  CouponType,
  DisputePriority,
  DisputeStatus,
  NotificationChannel,
  NotificationKind,
  PaymentMethod,
  PaymentStatus,
  PayoutStatus,
  PrismaClient,
  ReviewStatus,
  Role,
  ServiceStatus,
  TicketStatus,
  TransactionStatus,
  TransactionType,
  UserStatus,
  VendorStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'demo1234';

/** Build an IST wall-clock time as a UTC instant. */
function ist(daysFromNow: number, hour: number, minute = 0) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const iso = date.toISOString().slice(0, 10);
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour - 5, minute - 30));
}

function ref(prefix: string, index: number) {
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

async function clear() {
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.timeOff.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.vendorStaff.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.serviceAddOn.deleteMany();
  await prisma.serviceQuestion.deleteMany();
  await prisma.service.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.vendorApplication.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.cmsPage.deleteMany();
  await prisma.platformSetting.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('🌱 Seeding Servora…');
  await clear();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  /* ------------------------------- Categories ------------------------------ */
  const categories = [
    { id: 'c1', slug: 'home-cleaning', name: 'Home Cleaning', short: 'Deep cleans, regular help and move-out cleans', icon: 'sparkles', tone: 'brand', fromPricePaise: 79900, image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80' },
    { id: 'c2', slug: 'plumbing', name: 'Plumbing', short: 'Leaks, taps, drains and bathroom fittings', icon: 'wrench', tone: 'info', fromPricePaise: 29900, image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=900&q=80' },
    { id: 'c3', slug: 'electrical', name: 'Electrical', short: 'Wiring, switches, fans and safety checks', icon: 'zap', tone: 'amber', fromPricePaise: 24900, image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=80' },
    { id: 'c4', slug: 'ac-appliance', name: 'AC & Appliances', short: 'Servicing, repair and installation', icon: 'wind', tone: 'teal', fromPricePaise: 49900, image: 'https://images.unsplash.com/photo-1631545806609-20a4c1c5b5d0?w=900&q=80' },
    { id: 'c5', slug: 'beauty-spa', name: 'Beauty & Spa', short: 'Salon-at-home, makeup and wellness', icon: 'sparkle', tone: 'violet', fromPricePaise: 99900, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80' },
    { id: 'c6', slug: 'photography', name: 'Photography', short: 'Weddings, portraits and events', icon: 'camera', tone: 'neutral', fromPricePaise: 499900, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&q=80' },
    { id: 'c7', slug: 'gardening', name: 'Gardening', short: 'Garden makeovers and plant care', icon: 'sprout', tone: 'success', fromPricePaise: 59900, image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80' },
    { id: 'c8', slug: 'moving', name: 'Moving & Packing', short: 'Local shifting, packing and storage', icon: 'truck', tone: 'warning', fromPricePaise: 149900, image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=900&q=80' },
  ];
  for (const category of categories) {
    await prisma.category.create({
      data: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        short: category.short,
        description: `${category.name} from verified, background-checked professionals. Transparent pricing and on-time arrival.`,
        icon: category.icon,
        tone: category.tone,
        imageUrl: category.image,
        fromPricePaise: category.fromPricePaise,
        subcategories: [],
        sortOrder: Number(category.id.slice(1)),
      },
    });
  }

  /* --------------------------------- Users --------------------------------- */
  const users = [
    { id: 'u1', name: 'Aarav Mehta', email: 'customer@servora.demo', role: Role.CUSTOMER, city: 'Mumbai', phone: '+91 98200 12345' },
    { id: 'u2', name: 'Neha Kulkarni', email: 'vendor@servora.demo', role: Role.VENDOR, city: 'Mumbai', phone: '+91 98200 41120' },
    { id: 'u3', name: 'Aisha Khan', email: 'admin@servora.demo', role: Role.ADMIN, city: 'Bengaluru', phone: '+91 90000 12345' },
    { id: 'u4', name: 'Rahul Nair', email: 'rahul@coolbreeze.demo', role: Role.VENDOR, city: 'Bengaluru', phone: '+91 98860 33445' },
    { id: 'u5', name: 'Imran Sheikh', email: 'imran@urbanfix.demo', role: Role.VENDOR, city: 'Delhi NCR', phone: '+91 98110 55667' },
    { id: 'u6', name: 'Vikram Rao', email: 'vikram@voltiq.demo', role: Role.VENDOR, city: 'Pune', phone: '+91 98220 77889' },
    { id: 'u7', name: 'Riya Kapoor', email: 'riya@glowstudio.demo', role: Role.VENDOR, city: 'Mumbai', phone: '+91 98330 99001' },
    { id: 'u8', name: 'Kabir Sen', email: 'kabir@framecraft.demo', role: Role.VENDOR, city: 'Hyderabad', phone: '+91 99490 11223' },
    { id: 'u9', name: 'Priya Sharma', email: 'priya@example.com', role: Role.CUSTOMER, city: 'Bengaluru', phone: '+91 98800 22334' },
    { id: 'u10', name: 'Rohan Kapoor', email: 'rohan@example.com', role: Role.CUSTOMER, city: 'Mumbai', phone: '+91 98111 66778' },
    { id: 'u11', name: 'Ananya Iyer', email: 'ananya@example.com', role: Role.CUSTOMER, city: 'Pune', phone: '+91 98220 44556' },
    { id: 'u12', name: 'Dev Malhotra', email: 'dev@example.com', role: Role.CUSTOMER, city: 'Delhi NCR', phone: '+91 98100 88990' },
  ];
  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        role: user.role,
        passwordHash,
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
        ...(user.role === Role.ADMIN ? { avatarUrl: null } : {}),
      },
    });
  }

  /* -------------------------------- Vendors -------------------------------- */
  const vendorSeeds = [
    {
      id: 'v1', ownerId: 'u2', slug: 'sparklehome-cleaning', name: 'SparkleHome Cleaning Co.', categoryId: 'c1',
      tagline: 'Deep cleaning specialists with a 100% satisfaction promise.',
      city: 'Mumbai', area: 'Andheri West', rating: 4.9, reviewCount: 214, jobsDone: 1240, priceFromPaise: 99900,
      responseTimeMins: 18, since: 2019, languages: ['English', 'Hindi', 'Marathi'], commissionRate: 12.5,
      email: 'vendor@servora.demo', phone: '+91 98200 41120', tags: ['Deep cleaning', 'Eco-friendly', 'Insured'],
    },
    {
      id: 'v2', ownerId: 'u4', slug: 'coolbreeze-ac-care', name: 'CoolBreeze AC Care', categoryId: 'c4',
      tagline: 'Certified HVAC technicians for every major brand.',
      city: 'Bengaluru', area: 'Indiranagar', rating: 4.8, reviewCount: 168, jobsDone: 940, priceFromPaise: 49900,
      responseTimeMins: 25, since: 2020, languages: ['English', 'Hindi', 'Kannada'], commissionRate: 12,
      email: 'rahul@coolbreeze.demo', phone: '+91 98860 33445', tags: ['AC service', 'Same-day', 'Brand parts'],
    },
    {
      id: 'v3', ownerId: 'u5', slug: 'urbanfix-plumbing', name: 'UrbanFix Plumbing', categoryId: 'c2',
      tagline: 'Leak-free homes, fixed right the first time.',
      city: 'Delhi NCR', area: 'Saket', rating: 4.7, reviewCount: 132, jobsDone: 760, priceFromPaise: 29900,
      responseTimeMins: 20, since: 2018, languages: ['English', 'Hindi'], commissionRate: 13,
      email: 'imran@urbanfix.demo', phone: '+91 98110 55667', tags: ['Emergency', 'Upfront pricing', 'Warranty'],
    },
    {
      id: 'v4', ownerId: 'u6', slug: 'voltiq-electricians', name: 'Voltiq Electricians', categoryId: 'c3',
      tagline: 'Licensed electricians for safe, tidy work.',
      city: 'Pune', area: 'Baner', rating: 4.8, reviewCount: 96, jobsDone: 540, priceFromPaise: 24900,
      responseTimeMins: 22, since: 2021, languages: ['English', 'Hindi', 'Marathi'], commissionRate: 12.5,
      email: 'vikram@voltiq.demo', phone: '+91 98220 77889', tags: ['Licensed', 'Safety-first', 'Warranty'],
    },
    {
      id: 'v5', ownerId: 'u7', slug: 'glow-studio-riya', name: 'Glow Studio by Riya', categoryId: 'c5',
      tagline: 'Salon-quality beauty and bridal artistry at home.',
      city: 'Mumbai', area: 'Bandra West', rating: 4.9, reviewCount: 187, jobsDone: 690, priceFromPaise: 149900,
      responseTimeMins: 15, since: 2019, languages: ['English', 'Hindi'], commissionRate: 15,
      email: 'riya@glowstudio.demo', phone: '+91 98330 99001', tags: ['Bridal', 'Premium products', 'Studio hygiene'],
    },
    {
      id: 'v6', ownerId: 'u8', slug: 'framecraft-photography', name: 'FrameCraft Photography', categoryId: 'c6',
      tagline: 'Editorial-style weddings and portraits.',
      city: 'Hyderabad', area: 'Jubilee Hills', rating: 4.9, reviewCount: 74, jobsDone: 210, priceFromPaise: 499900,
      responseTimeMins: 45, since: 2017, languages: ['English', 'Hindi', 'Telugu'], commissionRate: 10,
      email: 'kabir@framecraft.demo', phone: '+91 99490 11223', tags: ['Weddings', 'Cinematic', '48h preview'],
    },
    {
      id: 'v7', ownerId: 'u9', slug: 'greenthumb-gardeners', name: 'GreenThumb Gardeners', categoryId: 'c7',
      tagline: 'Thoughtful garden care for balconies and villas.',
      city: 'Bengaluru', area: 'Whitefield', rating: 4.6, reviewCount: 58, jobsDone: 320, priceFromPaise: 59900,
      responseTimeMins: 35, since: 2022, languages: ['English', 'Kannada'], commissionRate: 12,
      email: 'priya@example.com', phone: '+91 98800 22334', tags: ['Organic', 'Maintenance plans'],
    },
    {
      id: 'v8', ownerId: 'u10', slug: 'swiftmove-packers', name: 'SwiftMove Packers', categoryId: 'c8',
      tagline: 'Careful packing, on-time local moving.',
      city: 'Mumbai', area: 'Powai', rating: 4.7, reviewCount: 88, jobsDone: 410, priceFromPaise: 149900,
      responseTimeMins: 30, since: 2020, languages: ['English', 'Hindi'], commissionRate: 11,
      email: 'rohan@example.com', phone: '+91 98111 66778', tags: ['Local moving', 'Insurance', 'Trained crew'],
    },
  ];

  const hours = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => ({
    day,
    open: index === 6 ? '10:00' : '09:00',
    close: index === 6 ? '14:00' : '18:00',
    closed: false,
  }));

  for (const vendor of vendorSeeds) {
    await prisma.vendor.create({
      data: {
        id: vendor.id,
        ownerId: vendor.ownerId,
        slug: vendor.slug,
        name: vendor.name,
        categoryId: vendor.categoryId,
        tagline: vendor.tagline,
        description: `${vendor.name} is a verified Servora partner serving ${vendor.city}. Background-checked professionals, transparent pricing and a satisfaction guarantee on every visit.`,
        city: vendor.city,
        area: vendor.area,
        address: `${vendor.area}, ${vendor.city}`,
        rating: vendor.rating,
        reviewCount: vendor.reviewCount,
        jobsDone: vendor.jobsDone,
        priceFromPaise: vendor.priceFromPaise,
        verified: true,
        featured: vendor.id === 'v1' || vendor.id === 'v5',
        responseTimeMins: vendor.responseTimeMins,
        since: vendor.since,
        languages: vendor.languages,
        radiusKm: 15,
        status: VendorStatus.APPROVED,
        commissionRate: vendor.commissionRate,
        email: vendor.email,
        phone: vendor.phone,
        website: `https://${vendor.slug}.servora.in`,
        coverUrl: `https://images.unsplash.com/photo-${vendor.id === 'v1' ? '1581578731548-c64695cc6952' : vendor.id === 'v5' ? '1560066984-138dadb4c035' : '1527515637462-cff94eecc1ac'}?w=1200&q=80`,
        hours,
        gallery: [],
        certifications: ['GST registered', 'Police verified', 'Servora quality audit'],
        policies: {
          cancellation: 'Free cancellation up to 24 hours before the slot.',
          reschedule: 'Reschedule once free of charge up to 12 hours before.',
          refund: 'Full refund if the professional does not arrive.',
        },
        socials: { instagram: `https://instagram.com/${vendor.slug}` },
        tags: vendor.tags,
      },
    });
  }

  /* -------------------------------- Services ------------------------------- */
  const services = [
    { id: 's1', slug: 'deep-home-cleaning-3bhk', vendorId: 'v1', categoryId: 'c1', name: 'Deep Home Cleaning (3 BHK)', pricePaise: 249900, durationMin: 240, rating: 4.9, reviewCount: 168, bookingsCount: 640, tags: ['Deep clean', 'Bestseller'], featured: true, includes: ['Kitchen degreasing', 'Bathroom sanitisation', 'Floor scrubbing', 'Window interiors'] },
    { id: 's2', slug: 'kitchen-deep-cleaning', vendorId: 'v1', categoryId: 'c1', name: 'Kitchen Deep Cleaning', pricePaise: 129900, durationMin: 150, rating: 4.8, reviewCount: 94, bookingsCount: 410, tags: ['Kitchen', 'Degreasing'], includes: ['Chimney exteriors', 'Cabinet fronts', 'Sink descaling'] },
    { id: 's3', slug: 'sofa-carpet-shampoo', vendorId: 'v1', categoryId: 'c1', name: 'Sofa & Carpet Shampoo', pricePaise: 99900, durationMin: 120, rating: 4.7, reviewCount: 61, bookingsCount: 288, tags: ['Upholstery', 'Eco-friendly'], includes: ['3-seater sofa', '2 armchairs', '1 carpet'] },
    { id: 's4', slug: 'ac-service-gas-check', vendorId: 'v2', categoryId: 'c4', name: 'AC Service + Gas Check', pricePaise: 59900, durationMin: 90, rating: 4.8, reviewCount: 122, bookingsCount: 512, tags: ['AC', 'Same-day'], featured: true, includes: ['Filter cleaning', 'Coil wash', 'Gas pressure check'] },
    { id: 's5', slug: 'ac-deep-cleaning', vendorId: 'v2', categoryId: 'c4', name: 'AC Deep Cleaning', pricePaise: 89900, durationMin: 120, rating: 4.8, reviewCount: 76, bookingsCount: 290, tags: ['Deep clean', 'Jet wash'], includes: ['Indoor unit jet wash', 'Drain flush', 'Anti-bacterial spray'] },
    { id: 's6', slug: 'ac-installation', vendorId: 'v2', categoryId: 'c4', name: 'Split AC Installation', pricePaise: 149900, durationMin: 180, rating: 4.7, reviewCount: 44, bookingsCount: 160, tags: ['Installation', 'Warranty'], includes: ['Wall bracket', 'Copper piping up to 3m', 'Test run'] },
    { id: 's7', slug: 'tap-mixer-repair', vendorId: 'v3', categoryId: 'c2', name: 'Tap & Mixer Repair', pricePaise: 39900, durationMin: 60, rating: 4.7, reviewCount: 88, bookingsCount: 340, tags: ['Plumbing', 'Quick fix'], featured: true, includes: ['Leak diagnosis', 'Washer replacement', '30-day warranty'] },
    { id: 's8', slug: 'bathroom-leak-fix', vendorId: 'v3', categoryId: 'c2', name: 'Bathroom Leak Fix', pricePaise: 79900, durationMin: 120, rating: 4.6, reviewCount: 51, bookingsCount: 190, tags: ['Leak', 'Waterproofing'], includes: ['Leak trace', 'Sealant work', 'Clean-up'] },
    { id: 's9', slug: 'water-tank-cleaning', vendorId: 'v3', categoryId: 'c2', name: 'Water Tank Cleaning', pricePaise: 119900, durationMin: 150, rating: 4.8, reviewCount: 39, bookingsCount: 140, tags: ['Hygiene', 'Annual'], includes: ['Drain & scrub', 'Food-grade sanitisation', 'Before/after photos'] },
    { id: 's10', slug: 'switchboard-wiring', vendorId: 'v4', categoryId: 'c3', name: 'Switchboard & Wiring', pricePaise: 49900, durationMin: 90, rating: 4.8, reviewCount: 63, bookingsCount: 220, tags: ['Electrical', 'Safety'], includes: ['Load check', 'Switch replacement', 'Insulation test'] },
    { id: 's11', slug: 'ceiling-fan-installation', vendorId: 'v4', categoryId: 'c3', name: 'Ceiling Fan Installation', pricePaise: 34900, durationMin: 60, rating: 4.7, reviewCount: 41, bookingsCount: 180, tags: ['Fan', 'Installation'], includes: ['Unmount old fan', 'Mount & balance', 'Wiring check'] },
    { id: 's12', slug: 'inverter-stabilizer-setup', vendorId: 'v4', categoryId: 'c3', name: 'Inverter & Stabilizer Setup', pricePaise: 89900, durationMin: 120, rating: 4.6, reviewCount: 28, bookingsCount: 96, tags: ['Power backup'], includes: ['Site survey', 'Mounting', 'Load test'] },
    { id: 's13', slug: 'bridal-makeup-at-home', vendorId: 'v5', categoryId: 'c5', name: 'Bridal Makeup at Home', pricePaise: 1499900, durationMin: 240, rating: 4.9, reviewCount: 98, bookingsCount: 210, tags: ['Bridal', 'HD makeup'], featured: true, includes: ['Trial consultation', 'HD airbrush', 'Hair styling', 'Draping'] },
    { id: 's14', slug: 'party-makeup-hair', vendorId: 'v5', categoryId: 'c5', name: 'Party Makeup & Hair', pricePaise: 399900, durationMin: 120, rating: 4.8, reviewCount: 54, bookingsCount: 180, tags: ['Party', 'Hair'], includes: ['Skin prep', 'Makeup', 'Blow-dry styling'] },
    { id: 's15', slug: 'luxury-facial', vendorId: 'v5', categoryId: 'c5', name: 'Luxury Facial', pricePaise: 249900, durationMin: 75, rating: 4.8, reviewCount: 35, bookingsCount: 120, tags: ['Spa', 'Glow'], includes: ['Cleanse & exfoliate', 'Massage', 'Mask & serum'] },
    { id: 's16', slug: 'pre-wedding-shoot', vendorId: 'v6', categoryId: 'c6', name: 'Pre-Wedding Shoot', pricePaise: 2499900, durationMin: 360, rating: 4.9, reviewCount: 38, bookingsCount: 72, tags: ['Photography', 'Couple'], featured: true, includes: ['4-hour shoot', '2 locations', '40 edited photos'] },
    { id: 's17', slug: 'balcony-garden-makeover', vendorId: 'v7', categoryId: 'c7', name: 'Balcony Garden Makeover', pricePaise: 89900, durationMin: 180, rating: 4.6, reviewCount: 22, bookingsCount: 58, tags: ['Balcony', 'Plants'], includes: ['Planter layout', 'Soil & compost', 'Plant selection'] },
    { id: 's18', slug: 'local-shifting-2bhk', vendorId: 'v8', categoryId: 'c8', name: 'Local Shifting (2 BHK)', pricePaise: 899900, durationMin: 480, rating: 4.7, reviewCount: 33, bookingsCount: 64, tags: ['Moving', '2 BHK'], includes: ['Packing material', '2 loaders', 'Tempo & transit insurance'] },
  ];

  for (const service of services) {
    await prisma.service.create({
      data: {
        id: service.id,
        slug: service.slug,
        vendorId: service.vendorId,
        categoryId: service.categoryId,
        name: service.name,
        description: `${service.name} by a verified Servora professional. Includes transparent pricing, professional-grade supplies and a satisfaction guarantee.`,
        pricePaise: service.pricePaise,
        durationMin: service.durationMin,
        rating: service.rating,
        reviewCount: service.reviewCount,
        bookingsCount: service.bookingsCount,
        tags: service.tags,
        featured: service.featured ?? false,
        includes: service.includes,
        priceType: 'FIXED',
        status: ServiceStatus.PUBLISHED,
        noticeHours: 4,
        maxAdvanceDays: 60,
        cancellationPolicy: 'Flexible',
        serviceAt: 'Customer location',
        availableToday: true,
        imageUrl: `https://images.unsplash.com/photo-${service.categoryId === 'c1' ? '1581578731548-c64695cc6952' : service.categoryId === 'c5' ? '1560066984-138dadb4c035' : '1600880292203-757bb62b4baf'}?w=900&q=80`,
        addOns: {
          create: [
            { name: 'Inside fridge cleaning', pricePaise: 29900, durationMin: 20, sortOrder: 0 },
            { name: 'Balcony deep clean', pricePaise: 19900, durationMin: 15, sortOrder: 1 },
            { name: 'Eco-friendly supplies', pricePaise: 14900, durationMin: 0, sortOrder: 2 },
          ],
        },
        questions: {
          create: [
            { label: 'Any pets at home?', type: 'select', options: ['No', 'Yes — dog', 'Yes — cat'], required: true, sortOrder: 0 },
            { label: 'Anything specific we should focus on?', type: 'textarea', required: false, sortOrder: 1 },
          ],
        },
      },
    });
  }

  /* --------------------------------- Staff --------------------------------- */
  const staffSeeds = [
    { id: 'st1', vendorId: 'v1', name: 'Meera Joshi', role: 'Senior cleaner', email: 'meera@sparklehome.demo', phone: '+91 98200 11111', rating: 4.9, jobsCount: 412, experience: '6 years', serviceIds: ['s1', 's2', 's3'] },
    { id: 'st2', vendorId: 'v1', name: 'Ravi Patil', role: 'Deep-clean specialist', email: 'ravi@sparklehome.demo', phone: '+91 98200 22222', rating: 4.8, jobsCount: 286, experience: '4 years', serviceIds: ['s1', 's3'] },
    { id: 'st3', vendorId: 'v1', name: 'Sunita Yadav', role: 'Kitchen specialist', email: 'sunita@sparklehome.demo', phone: '+91 98200 33333', rating: 4.9, jobsCount: 198, experience: '5 years', serviceIds: ['s1', 's2'] },
    { id: 'st4', vendorId: 'v2', name: 'Arjun Rao', role: 'HVAC technician', email: 'arjun@coolbreeze.demo', phone: '+91 98860 11111', rating: 4.8, jobsCount: 344, experience: '7 years', serviceIds: ['s4', 's5', 's6'] },
    { id: 'st5', vendorId: 'v5', name: 'Riya Kapoor', role: 'Lead artist', email: 'riya@glowstudio.demo', phone: '+91 98330 99001', rating: 4.9, jobsCount: 420, experience: '9 years', serviceIds: ['s13', 's14', 's15'] },
  ];
  for (const staff of staffSeeds) {
    await prisma.vendorStaff.create({
      data: {
        id: staff.id,
        vendorId: staff.vendorId,
        name: staff.name,
        role: staff.role,
        email: staff.email,
        phone: staff.phone,
        rating: staff.rating,
        jobsCount: staff.jobsCount,
        experience: staff.experience,
        status: 'active',
        commissionRate: 20,
        services: { create: staff.serviceIds.map((serviceId) => ({ serviceId })) },
      },
    });
  }

  /* ------------------------------ Availability ----------------------------- */
  for (const vendor of vendorSeeds) {
    for (let weekday = 0; weekday <= 6; weekday += 1) {
      await prisma.availabilityRule.create({
        data: {
          vendorId: vendor.id,
          weekday,
          startMinute: weekday === 0 ? 600 : 540,
          endMinute: weekday === 0 ? 840 : 1080,
          slotIntervalMin: 30,
        },
      });
    }
  }
  // Per-staff schedule demonstration for SparkleHome.
  for (const staffId of ['st1', 'st2']) {
    for (let weekday = 1; weekday <= 6; weekday += 1) {
      await prisma.availabilityRule.create({
        data: { vendorId: 'v1', staffId, weekday, startMinute: 540, endMinute: 1020, slotIntervalMin: 60 },
      });
    }
  }
  await prisma.timeOff.create({
    data: {
      vendorId: 'v1',
      staffId: 'st3',
      startsAt: ist(4, 9),
      endsAt: ist(4, 18),
      reason: 'Family leave',
    },
  });

  /* -------------------------------- Addresses ------------------------------ */
  await prisma.address.createMany({
    data: [
      { id: 'a1', userId: 'u1', label: 'Home', name: 'Aarav Mehta', line1: 'B-704, Oberoi Springs', line2: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400053', phone: '+91 98200 12345', isDefault: true },
      { id: 'a2', userId: 'u1', label: 'Work', name: 'Aarav Mehta', line1: 'WeWork, BKC', line2: 'Bandra East', city: 'Mumbai', state: 'Maharashtra', pincode: '400051', phone: '+91 98200 12345', isDefault: false },
      { id: 'a3', userId: 'u9', label: 'Home', name: 'Priya Sharma', line1: '14, Palm Meadows', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', phone: '+91 98800 22334', isDefault: true },
      { id: 'a4', userId: 'u10', label: 'Home', name: 'Rohan Kapoor', line1: '22, Hiranandani Gardens', city: 'Mumbai', state: 'Maharashtra', pincode: '400076', phone: '+91 98111 66778', isDefault: true },
    ],
  });

  /* --------------------------------- Coupons ------------------------------- */
  const coupons = [
    { id: 'cp1', code: 'WELCOME10', description: '10% off your first booking', type: CouponType.PERCENT, value: 10, minOrderPaise: 49900, maxDiscountPaise: 20000, usageLimit: 10000, usedCount: 2841, expiresAt: new Date(Date.now() + 60 * 86400000), status: CouponStatus.ACTIVE },
    { id: 'cp2', code: 'FESTIVE15', description: '15% off festive cleaning', type: CouponType.PERCENT, value: 15, minOrderPaise: 99900, maxDiscountPaise: 30000, usageLimit: 5000, usedCount: 1220, expiresAt: new Date(Date.now() + 30 * 86400000), status: CouponStatus.ACTIVE },
    { id: 'cp3', code: 'CLEAN200', description: '₹200 off deep cleaning', type: CouponType.FLAT, value: 20000, minOrderPaise: 149900, usageLimit: 2000, usedCount: 604, expiresAt: new Date(Date.now() + 45 * 86400000), status: CouponStatus.ACTIVE, scope: 'vendor', vendorId: 'v1' },
    { id: 'cp4', code: 'NEWUSER', description: '₹300 off your first order', type: CouponType.FLAT, value: 30000, minOrderPaise: 99900, usageLimit: 99999, usedCount: 886, expiresAt: new Date(Date.now() + 90 * 86400000), status: CouponStatus.ACTIVE },
    { id: 'cp5', code: 'SUMMER20', description: 'Summer AC service offer', type: CouponType.PERCENT, value: 20, minOrderPaise: 49900, maxDiscountPaise: 25000, usageLimit: 1000, usedCount: 1000, expiresAt: new Date(Date.now() - 10 * 86400000), status: CouponStatus.EXPIRED },
  ];
  for (const coupon of coupons) {
    await prisma.coupon.create({
      data: {
        ...coupon,
        startsAt: new Date(Date.now() - 20 * 86400000),
        scope: coupon.scope ?? 'all',
        vendorId: coupon.vendorId,
      },
    });
  }

  /* -------------------------------- Bookings ------------------------------- */
  type BookingSeed = {
    id: string; ref: string; customerId: string; vendorId: string; serviceId: string; staffId?: string;
    days: number; hour: number; status: BookingStatus; paymentStatus: PaymentStatus; totalPaise: number;
    durationMin: number; refundAmount?: number;
  };

  const bookingSeeds: BookingSeed[] = [
    { id: 'b1', ref: 'SRV-23981', customerId: 'u1', vendorId: 'v1', serviceId: 's1', staffId: 'st1', days: 3, hour: 10, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, totalPaise: 294800, durationMin: 240 },
    { id: 'b2', ref: 'SRV-23942', customerId: 'u1', vendorId: 'v5', serviceId: 's14', staffId: 'st5', days: -9, hour: 17, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, totalPaise: 399900, durationMin: 120 },
    { id: 'b3', ref: 'SRV-23901', customerId: 'u1', vendorId: 'v2', serviceId: 's4', staffId: 'st4', days: -22, hour: 11, status: BookingStatus.CANCELLED, paymentStatus: PaymentStatus.REFUNDED, totalPaise: 59900, durationMin: 90, refundAmount: 59900 },
    { id: 'b4', ref: 'SRV-24012', customerId: 'u1', vendorId: 'v3', serviceId: 's7', days: 5, hour: 15, status: BookingStatus.PENDING_APPROVAL, paymentStatus: PaymentStatus.PAID, totalPaise: 39900, durationMin: 60 },
    { id: 'b5', ref: 'SRV-24015', customerId: 'u1', vendorId: 'v1', serviceId: 's2', staffId: 'st3', days: 0, hour: 14, status: BookingStatus.IN_PROGRESS, paymentStatus: PaymentStatus.PAID, totalPaise: 129900, durationMin: 150 },
    { id: 'b6', ref: 'SRV-23877', customerId: 'u1', vendorId: 'v1', serviceId: 's3', staffId: 'st2', days: -33, hour: 10, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, totalPaise: 99900, durationMin: 120 },
    { id: 'b7', ref: 'SRV-24020', customerId: 'u9', vendorId: 'v2', serviceId: 's5', days: 2, hour: 12, status: BookingStatus.PENDING_PAYMENT, paymentStatus: PaymentStatus.PENDING, totalPaise: 89900, durationMin: 120 },
    { id: 'b8', ref: 'SRV-24021', customerId: 'u10', vendorId: 'v1', serviceId: 's1', days: 7, hour: 9, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, totalPaise: 249900, durationMin: 240 },
    { id: 'b9', ref: 'SRV-24022', customerId: 'u11', vendorId: 'v5', serviceId: 's13', days: 14, hour: 6, status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, totalPaise: 1499900, durationMin: 240 },
    { id: 'b10', ref: 'SRV-24023', customerId: 'u12', vendorId: 'v6', serviceId: 's16', days: -14, hour: 8, status: BookingStatus.COMPLETED, paymentStatus: PaymentStatus.PAID, totalPaise: 2499900, durationMin: 360 },
  ];

  // Historical completed bookings to make charts meaningful.
  for (let index = 0; index < 18; index += 1) {
    const service = services[index % services.length];
    bookingSeeds.push({
      id: `bh${index + 1}`,
      ref: `SRV-2${3100 + index}`,
      customerId: ['u1', 'u9', 'u10', 'u11', 'u12'][index % 5],
      vendorId: service.vendorId,
      serviceId: service.id,
      days: -(index * 9 + 40),
      hour: 10 + (index % 6),
      status: index % 11 === 0 ? BookingStatus.CANCELLED : BookingStatus.COMPLETED,
      paymentStatus: index % 11 === 0 ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
      totalPaise: service.pricePaise,
      durationMin: service.durationMin,
      ...(index % 11 === 0 ? { refundAmount: service.pricePaise } : {}),
    });
  }

  let paymentIndex = 1;
  let ledgerIndex = 1;
  for (const booking of bookingSeeds) {
    const startsAt = ist(booking.days, booking.hour);
    const endsAt = new Date(startsAt.getTime() + booking.durationMin * 60000);
    const platformFeePaise = Math.round((booking.totalPaise * 0.125) / 100) * 100;
    await prisma.booking.create({
      data: {
        id: booking.id,
        ref: booking.ref,
        customerId: booking.customerId,
        vendorId: booking.vendorId,
        serviceId: booking.serviceId,
        staffId: booking.staffId,
        addressId: booking.customerId === 'u1' ? 'a1' : undefined,
        startsAt,
        endsAt,
        durationMin: booking.durationMin,
        status: booking.status,
        amountPaise: booking.totalPaise,
        addOnsPaise: 0,
        discountPaise: 0,
        platformFeePaise,
        taxPaise: 0,
        totalPaise: booking.totalPaise,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentStatus === PaymentStatus.PENDING ? null : PaymentMethod.UPI,
        notes: booking.id === 'b1' ? 'Please bring eco-friendly supplies.' : undefined,
        participants: 1,
        addressSnapshot: booking.customerId === 'u1'
          ? { label: 'Home', line1: 'B-704, Oberoi Springs', city: 'Mumbai', pincode: '400053' }
          : undefined,
        confirmedAt: ([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED] as BookingStatus[]).includes(booking.status) ? new Date(startsAt.getTime() - 86400000) : null,
        completedAt: booking.status === BookingStatus.COMPLETED ? endsAt : null,
        cancelledAt: ([BookingStatus.CANCELLED, BookingStatus.REFUNDED] as BookingStatus[]).includes(booking.status) ? new Date(startsAt.getTime() - 172800000) : null,
        expiresAt: booking.status === BookingStatus.PENDING_PAYMENT ? new Date(Date.now() + 20 * 60000) : null,
      },
    });

    if (booking.paymentStatus === PaymentStatus.PAID || booking.paymentStatus === PaymentStatus.REFUNDED) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: 'RAZORPAY',
          providerOrderId: `order_seed_${paymentIndex}`,
          providerPaymentId: `pay_seed_${paymentIndex}`,
          amountPaise: booking.totalPaise,
          status: booking.paymentStatus === PaymentStatus.REFUNDED ? TransactionStatus.REFUNDED : TransactionStatus.SUCCESS,
          method: PaymentMethod.UPI,
          signatureVerified: true,
          capturedAt: new Date(startsAt.getTime() - 2 * 86400000),
          receipt: booking.ref,
        },
      });
      paymentIndex += 1;

      if (booking.paymentStatus === PaymentStatus.REFUNDED && booking.refundAmount) {
        await prisma.refund.create({
          data: {
            bookingId: booking.id,
            amountPaise: booking.refundAmount,
            reason: 'Customer cancelled within policy window',
            status: TransactionStatus.SUCCESS,
            processedAt: new Date(),
            providerRefundId: `rfnd_seed_${booking.id}`,
          },
        });
      }
    }

    if (booking.status === BookingStatus.COMPLETED) {
      await prisma.ledgerEntry.createMany({
        data: [
          { id: `le${ledgerIndex++}`, vendorId: booking.vendorId, bookingId: booking.id, type: TransactionType.PAYOUT, amountPaise: booking.totalPaise - platformFeePaise, description: `Earning for ${booking.ref}`, createdAt: endsAt },
          { id: `le${ledgerIndex++}`, vendorId: null, bookingId: booking.id, type: TransactionType.COMMISSION, amountPaise: platformFeePaise, description: `Platform commission for ${booking.ref}`, createdAt: endsAt },
        ],
      });
    }
  }

  /* --------------------------------- Reviews ------------------------------- */
  const reviewSeeds = [
    { bookingId: 'b2', vendorId: 'v5', serviceId: 's14', customerId: 'u1', rating: 5, title: 'Riya is a magician', text: 'My party makeup lasted through a 12-hour wedding. She arrived early, was so organised, and the products were premium. Worth every rupee.' },
    { bookingId: 'b6', vendorId: 'v1', serviceId: 's3', customerId: 'u1', rating: 5, title: 'Sofa looks brand new', text: 'The team was punctual and incredibly thorough. They moved all the furniture, cleaned every cushion and left the flat spotless.' },
    { bookingId: 'b10', vendorId: 'v6', serviceId: 's16', customerId: 'u12', rating: 5, title: 'Wedding photos we will treasure', text: 'Kabir understood exactly the vibe we wanted. The preview arrived in 48 hours and the final album is stunning.' },
  ];
  let reviewIndex = 1;
  for (const review of reviewSeeds) {
    await prisma.review.create({
      data: {
        id: `r${reviewIndex++}`,
        ...review,
        images: [],
        status: ReviewStatus.PUBLISHED,
        verified: true,
      },
    });
  }

  /* --------------------------------- Payouts ------------------------------- */
  const payouts = [
    { id: 'po1', ref: 'PO-2026-1841', vendorId: 'v1', amountPaise: 1840000, status: PayoutStatus.PAID, requestedAt: new Date(Date.now() - 12 * 86400000), processedAt: new Date(Date.now() - 10 * 86400000) },
    { id: 'po2', ref: 'PO-2026-1842', vendorId: 'v2', amountPaise: 960000, status: PayoutStatus.REQUESTED, requestedAt: new Date(Date.now() - 2 * 86400000), processedAt: null },
    { id: 'po3', ref: 'PO-2026-1843', vendorId: 'v5', amountPaise: 2450000, status: PayoutStatus.PROCESSING, requestedAt: new Date(Date.now() - 1 * 86400000), processedAt: null },
    { id: 'po4', ref: 'PO-2026-1844', vendorId: 'v3', amountPaise: 420000, status: PayoutStatus.APPROVED, requestedAt: new Date(Date.now() - 3 * 86400000), processedAt: null },
  ];
  for (const payout of payouts) {
    await prisma.payout.create({
      data: {
        ...payout,
        feePaise: 500,
        method: 'IMPS',
        periodStart: new Date(Date.now() - 30 * 86400000),
        periodEnd: new Date(),
        bankSnapshot: { bank: 'HDFC Bank', account: '•••• 4821', ifsc: 'HDFC0001234' },
      },
    });
  }

  /* --------------------------------- Disputes ------------------------------ */
  await prisma.dispute.createMany({
    data: [
      {
        id: 'dp1',
        ref: 'DP-1041',
        bookingId: 'b3',
        customerId: 'u1',
        vendorId: 'v2',
        reason: 'Service not delivered as described',
        description: 'The technician arrived but did not complete the promised coil cleaning. Requesting a full refund.',
        status: DisputeStatus.OPEN,
        priority: DisputePriority.HIGH,
        amountPaise: 59900,
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        id: 'dp2',
        ref: 'DP-1042',
        bookingId: 'bh3',
        customerId: 'u10',
        vendorId: 'v7',
        reason: 'Damage during service',
        description: 'A planter was broken during the garden makeover. Vendor has not responded for three days.',
        status: DisputeStatus.UNDER_REVIEW,
        priority: DisputePriority.MEDIUM,
        amountPaise: 89900,
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
    ],
  });

  /* ------------------------------ Applications ----------------------------- */
  await prisma.vendorApplication.createMany({
    data: [
      { id: 'ap1', business: 'ShopEasy Home Services', ownerName: 'Manish Gupta', email: 'manish@shopeasy.demo', phone: '+91 98100 55667', categoryId: 'c1', city: 'Delhi NCR', status: ApplicationStatus.PENDING, documents: ['GST certificate', 'Aadhaar', 'Insurance'], notes: '', submittedAt: new Date(Date.now() - 1 * 86400000) },
      { id: 'ap2', business: 'FixIt Fast Handyman', ownerName: 'Sandeep Verma', email: 'sandeep@fixitfast.demo', phone: '+91 98200 77889', categoryId: 'c2', city: 'Mumbai', status: ApplicationStatus.UNDER_REVIEW, documents: ['PAN', 'Aadhaar'], notes: 'Awaiting police verification', submittedAt: new Date(Date.now() - 3 * 86400000) },
      { id: 'ap3', business: 'Bloom & Co. Florists', ownerName: 'Tara Menon', email: 'tara@bloomco.demo', phone: '+91 98860 44556', categoryId: 'c7', city: 'Bengaluru', status: ApplicationStatus.PENDING, documents: ['GST certificate', 'Aadhaar'], notes: '', submittedAt: new Date(Date.now() - 4 * 86400000) },
      { id: 'ap4', business: 'Pixel Perfect Studios', ownerName: 'Aditya Bose', email: 'aditya@pixelperfect.demo', phone: '+91 99490 33445', categoryId: 'c6', city: 'Hyderabad', status: ApplicationStatus.APPROVED, documents: ['GST certificate', 'Portfolio'], notes: 'Strong portfolio', submittedAt: new Date(Date.now() - 10 * 86400000) },
    ],
  });

  /* ------------------------------ Notifications ---------------------------- */
  await prisma.notification.createMany({
    data: [
      { userId: 'u1', kind: NotificationKind.BOOKING, title: 'Booking confirmed', body: 'SparkleHome confirmed your deep clean for 3 days from now.', href: '/customer/bookings/b1', channels: [NotificationChannel.IN_APP], createdAt: new Date(Date.now() - 3600000) },
      { userId: 'u1', kind: NotificationKind.PAYMENT, title: 'Payment received', body: '₹2,948 paid via UPI. Invoice is ready.', href: '/customer/payments', channels: [NotificationChannel.IN_APP], createdAt: new Date(Date.now() - 7200000) },
      { userId: 'u1', kind: NotificationKind.PROMO, title: '15% off festive cleaning', body: 'Use FESTIVE15 before 30 November.', href: '/offers', channels: [NotificationChannel.IN_APP], createdAt: new Date(Date.now() - 86400000) },
      { userId: 'u2', kind: NotificationKind.BOOKING, title: 'New booking SRV-23981', body: 'Aarav Mehta booked Deep Home Cleaning (3 BHK).', href: '/vendor/bookings', channels: [NotificationChannel.IN_APP], createdAt: new Date(Date.now() - 3600000) },
      { userId: 'u2', kind: NotificationKind.PAYMENT, title: 'Payout PO-2026-1841 paid', body: '₹18,400 transferred to HDFC •••• 4821.', href: '/vendor/payouts', channels: [NotificationChannel.IN_APP], createdAt: new Date(Date.now() - 2 * 86400000) },
      { userId: 'u3', kind: NotificationKind.SYSTEM, title: '2 vendor applications need review', body: 'ShopEasy and Bloom & Co. are waiting.', href: '/admin/applications', channels: [NotificationChannel.IN_APP], createdAt: new Date(Date.now() - 1800000) },
    ],
  });

  /* --------------------------------- Favorites ----------------------------- */
  await prisma.favorite.createMany({
    data: [
      { userId: 'u1', serviceId: 's13' },
      { userId: 'u1', serviceId: 's4' },
      { userId: 'u1', vendorId: 'v1' },
    ],
  });

  /* ------------------------------ Conversations ---------------------------- */
  const conversation = await prisma.conversation.create({
    data: { id: 'cv1', customerId: 'u1', vendorId: 'v1', bookingId: 'b1' },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: conversation.id, senderId: 'u1', body: 'Hi! Could the team bring eco-friendly supplies?', createdAt: new Date(Date.now() - 5400000) },
      { conversationId: conversation.id, senderId: 'u2', body: 'Absolutely — we use plant-based cleaners by default. See you at 10 AM!', createdAt: new Date(Date.now() - 5000000) },
    ],
  });

  /* ------------------------------- Support tickets ------------------------- */
  const ticket = await prisma.supportTicket.create({
    data: { id: 'tk1', ref: 'TS-4821', userId: 'u1', subject: 'Invoice GST details', category: 'Billing', status: TicketStatus.OPEN, priority: 'medium' },
  });
  await prisma.ticketMessage.createMany({
    data: [
      { ticketId: ticket.id, from: 'customer', body: 'Could you add my company GSTIN to the last invoice?', createdAt: new Date(Date.now() - 86400000) },
      { ticketId: ticket.id, from: 'support', body: 'Sure — please share the GSTIN and we will reissue it within 24 hours.', createdAt: new Date(Date.now() - 80000000) },
    ],
  });

  /* --------------------------------- CMS pages ----------------------------- */
  const cmsPages = [
    { id: 'pg1', slug: 'about-servora', title: 'About Servora', excerpt: 'Local services deserve a better marketplace.', status: CmsStatus.PUBLISHED },
    { id: 'pg2', slug: 'refund-policy', title: 'Refund Policy', excerpt: 'Clear rules for cancellations and refunds.', status: CmsStatus.PUBLISHED },
    { id: 'pg3', slug: 'trust-and-safety', title: 'Trust & Safety', excerpt: 'How we verify every professional.', status: CmsStatus.IN_REVIEW },
    { id: 'pg4', slug: 'festive-cleaning-guide', title: 'Festive Cleaning Guide', excerpt: 'A room-by-room plan for Diwali.', status: CmsStatus.DRAFT },
    { id: 'pg5', slug: 'vendor-handbook', title: 'Vendor Handbook', excerpt: 'Everything a new partner needs.', status: CmsStatus.SCHEDULED },
  ];
  for (const page of cmsPages) {
    await prisma.cmsPage.create({
      data: {
        ...page,
        body: `# ${page.title}\n\nThis is seeded editorial content for the Servora ${page.title.toLowerCase()} page. Update it from the admin CMS.`,
        seoTitle: `${page.title} · Servora`,
        seoDescription: page.excerpt,
        authorId: 'u3',
        publishedAt: page.status === CmsStatus.PUBLISHED ? new Date(Date.now() - 5 * 86400000) : null,
      },
    });
  }

  /* -------------------------------- Audit log ------------------------------ */
  const auditSeeds = [
    { actorId: 'u3', actorName: 'Aisha Khan', actorRole: 'ADMIN', action: 'Approved vendor application', entity: 'Application', entityId: 'ap4', severity: 'INFO' as const, minutesAgo: 2 },
    { actorId: 'u3', actorName: 'Aisha Khan', actorRole: 'ADMIN', action: 'Updated global commission from 12% to 12.5%', entity: 'Commission rule', entityId: 'RULE-GLOBAL-01', severity: 'REVIEW' as const, minutesAgo: 18 },
    { actorId: 'u3', actorName: 'Aisha Khan', actorRole: 'ADMIN', action: 'Suspended vendor account', entity: 'Vendor', entityId: 'v8', severity: 'CRITICAL' as const, minutesAgo: 60 },
    { actorId: 'u3', actorName: 'Aisha Khan', actorRole: 'ADMIN', action: 'Published CMS page: Refund Policy', entity: 'CMS page', entityId: 'pg2', severity: 'INFO' as const, minutesAgo: 1440 },
    { actorId: 'u3', actorName: 'Aisha Khan', actorRole: 'ADMIN', action: 'Enabled two-factor authentication for admin role', entity: 'Security', entityId: 'role-admin', severity: 'ROUTINE' as const, minutesAgo: 2880 },
  ];
  for (const log of auditSeeds) {
    await prisma.auditLog.create({
      data: {
        actorId: log.actorId,
        actorName: log.actorName,
        actorRole: log.actorRole,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        ip: '103.21.44.18',
        userAgent: 'Mozilla/5.0 (seed)',
        severity: log.severity,
        createdAt: new Date(Date.now() - log.minutesAgo * 60000),
        metadata: {},
      },
    });
  }

  /* ------------------------------- Settings -------------------------------- */
  const settings: Record<string, unknown> = {
    platformName: 'Servora',
    tagline: 'Local services, minus the hassle.',
    supportEmail: 'support@servora.in',
    supportPhone: '+91 80 4000 1234',
    commissionRate: 12.5,
    payoutCycle: 'weekly',
    minPayoutPaise: 50000,
    bookingHoldMinutes: 20,
    cancellationWindowHours: 24,
    gstNumber: '29AABCS1429B1ZX',
    maintenanceMode: false,
    autoApproveVendors: false,
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.platformSetting.create({ data: { key, value: value as never, updatedById: 'u3' } });
  }

  /* --------------------- Concurrency safety constraints --------------------- */
  // Overlap guards: a staff member cannot be double-booked, and a staff-less
  // service (vendor-level booking) cannot overlap itself. Enforcement is split
  // into two partial constraints because staffId is optional.
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS btree_gist;');
    await prisma.$executeRawUnsafe('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS booking_no_overlap;');
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_staff_no_overlap') THEN
          ALTER TABLE bookings ADD CONSTRAINT booking_staff_no_overlap
          EXCLUDE USING gist ("staffId" WITH =, tsrange("startsAt", "endsAt") WITH &&)
          WHERE (status IN ('PENDING_APPROVAL', 'CONFIRMED', 'IN_PROGRESS') AND "staffId" IS NOT NULL);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_vendor_no_overlap') THEN
          ALTER TABLE bookings ADD CONSTRAINT booking_vendor_no_overlap
          EXCLUDE USING gist ("vendorId" WITH =, tsrange("startsAt", "endsAt") WITH &&)
          WHERE (status IN ('PENDING_APPROVAL', 'CONFIRMED', 'IN_PROGRESS') AND "staffId" IS NULL);
        END IF;
      END $$;
    `);
    console.log('🛡️  Booking exclusion constraints installed (staff + vendor level)');
  } catch (error) {
    console.warn('⚠️  Could not install the exclusion constraints (non-fatal):', (error as Error).message);
  }

  console.log('✅ Seed complete');
  console.log('   Demo logins (password: demo1234)');
  console.log('   customer@servora.demo · vendor@servora.demo · admin@servora.demo');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
