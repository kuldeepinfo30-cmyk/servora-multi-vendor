/**
 * Real-world details this demo build surfaces about its creator.
 *
 * Fields left as an empty string are simply not rendered anywhere, so the UI
 * never shows placeholder or made-up data.
 */
export interface OwnerProfile {
  name: string;
  role: string;
  bio: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  upi: string;
  bank: {
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch: string;
  };
}

export const OWNER: OwnerProfile = {
  name: 'Kuldeep Yadav',
  role: 'Founder & Full-stack Developer',
  bio: 'I designed and built Servora end to end — the customer website, the vendor portal, the admin console and the NestJS API with the booking engine and payment flow behind it.',
  email: 'kuldeepinfo30@gmail.com',
  phone: '',
  github: 'https://github.com/kuldeepinfo30-cmyk',
  linkedin: 'https://www.linkedin.com/in/kuldeep-yadav-159146445/',
  upi: 'kuldeepyada2805@okicici',
  bank: {
    accountHolder: 'Kuldeep Yadav',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    branch: '',
  },
};

/** Every headline capability this demo actually implements. */
export const DEMO_FEATURES = [
  'Customer website, vendor portal and admin console',
  'Email + password auth with role-based access control',
  'Real-time availability, slot locking and conflict-safe bookings',
  'Razorpay payment gateway in test mode — UPI, cards and net banking',
  'Automatic commission split and vendor payouts',
  'Email, SMS and in-app notifications',
  'Live location tracking with a kilometre radius filter',
  'Three themes — light green, white and black',
];
