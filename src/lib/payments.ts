/**
 * Razorpay Checkout for the Servora storefront.
 *
 * The happy path is fully server-assisted:
 *   1. the browser asks `POST /api/payments/checkout/order` for an order — the
 *      key *secret* stays on the server and never enters this bundle;
 *   2. Razorpay Checkout opens against that `order_id`;
 *   3. the signed callback is verified by `POST /api/payments/checkout/verify`
 *      before we treat the booking as paid.
 *
 * The demo is also designed to run without the API (`npm run dev` alone), so if
 * the server is unreachable we fall back to Razorpay's amount-only checkout.
 * That fallback cannot verify signatures, so the booking is labelled as
 * unverified instead of pretending it was reconciled.
 */

import { ApiError, ApiUnavailable, apiRequest } from './api';

const FALLBACK_KEY_ID = 'rzp_test_TzAZRn9g78xI05';

/** Publishable key only — this is safe to ship to the browser. */
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || FALLBACK_KEY_ID;

export const RAZORPAY_TEST_MODE = RAZORPAY_KEY_ID.startsWith('rzp_test_');

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayOptions {
  amountPaise: number;
  receipt: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: string;
}

export interface PaymentResult {
  paymentId: string;
  orderId?: string;
  signature?: string;
  verified: boolean;
  amountPaise: number;
  method?: string | null;
  status?: string;
  mock: boolean;
  fallback: boolean;
}

interface CheckoutOrder {
  orderId: string;
  keyId: string | null;
  amountPaise: number;
  currency: string;
  receipt: string;
  mock: boolean;
}

interface VerifyResponse {
  verified: boolean;
  mock: boolean;
  orderId: string;
  paymentId: string;
  amountPaise?: number | null;
  method?: string | null;
  status?: string;
}

/** Thrown when the customer closes Razorpay Checkout without paying. */
export class PaymentCancelled extends Error {
  constructor() {
    super('Payment cancelled.');
    this.name = 'PaymentCancelled';
  }
}

/** Thrown when Razorpay redirected back but the server rejected the signature. */
export class PaymentVerificationError extends Error {
  constructor(message = 'We could not verify this payment. No amount was captured.') {
    super(message);
    this.name = 'PaymentVerificationError';
  }
}

interface RazorpayCheckoutInstance {
  open: () => void;
  on: (event: string, handler: (payload: { error?: { description?: string } }) => void) => void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loader: Promise<void> | null = null;

/** Injects Razorpay's checkout script once and resolves when `window.Razorpay` is ready. */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve() : reject(new Error('Payment gateway did not load.')));
    script.onerror = () => {
      loader = null;
      reject(new Error('Could not reach the payment gateway. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });

  return loader;
}

/** Warm the checkout script while the customer is still on the payment step. */
export function preloadRazorpay(): void {
  loadCheckout().catch(() => undefined);
}

async function createCheckoutOrder(options: RazorpayOptions): Promise<CheckoutOrder | null> {
  try {
    return await apiRequest<CheckoutOrder>('/api/payments/checkout/order', {
      method: 'POST',
      body: {
        amountPaise: Math.round(options.amountPaise),
        receipt: options.receipt,
        description: options.description,
        notes: options.notes,
      },
      timeoutMs: 7_000,
    });
  } catch (error) {
    // No API running? Keep the standalone demo usable. A 4xx (disabled,
    // throttled, invalid amount) is a real answer and should surface.
    //
    // 404/405 usually means VITE_API_URL is unset and the static host answered
    // `/api/...` with its SPA fallback, so treat those as "no API" too.
    if (error instanceof ApiUnavailable) return null;
    if (error instanceof ApiError && [404, 405, 502, 503, 504].includes(error.status)) return null;
    throw error;
  }
}

/**
 * Opens Razorpay Checkout and resolves once the payment is captured and, when
 * the API is reachable, signature-verified server-side.
 */
export async function payWithRazorpay(options: RazorpayOptions): Promise<PaymentResult> {
  await loadCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Payment gateway is unavailable right now.');

  const serverOrder = await createCheckoutOrder(options);
  const useServerOrder = Boolean(serverOrder && !serverOrder.mock && serverOrder.keyId);
  const key = useServerOrder ? serverOrder!.keyId! : RAZORPAY_KEY_ID;

  if (!key) {
    throw new Error('Razorpay is not configured. Add VITE_RAZORPAY_KEY_ID or start the API.');
  }

  return new Promise<PaymentResult>((resolve, reject) => {
    const checkout = new Razorpay({
      key,
      ...(useServerOrder ? { order_id: serverOrder!.orderId } : { amount: Math.round(options.amountPaise) }),
      currency: 'INR',
      name: 'Servora',
      description: options.description,
      prefill: options.prefill ?? {},
      notes: options.notes ?? {},
      theme: { color: '#0f766e' },
      handler: async (response: RazorpaySuccess) => {
        if (!useServerOrder) {
          resolve({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            verified: false,
            amountPaise: Math.round(options.amountPaise),
            mock: false,
            fallback: true,
          });
          return;
        }

        if (!response.razorpay_signature) {
          reject(new PaymentVerificationError('Razorpay did not return a payment signature.'));
          return;
        }

        try {
          const verified = await apiRequest<VerifyResponse>('/api/payments/checkout/verify', {
            method: 'POST',
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
          });
          resolve({
            paymentId: verified.paymentId || response.razorpay_payment_id,
            orderId: verified.orderId || response.razorpay_order_id,
            signature: response.razorpay_signature,
            verified: Boolean(verified.verified),
            amountPaise: verified.amountPaise ?? Math.round(options.amountPaise),
            method: verified.method,
            status: verified.status,
            mock: Boolean(verified.mock),
            fallback: false,
          });
        } catch (error) {
          reject(
            error instanceof ApiError
              ? new PaymentVerificationError(error.message)
              : new PaymentVerificationError(),
          );
        }
      },
      modal: { ondismiss: () => reject(new PaymentCancelled()) },
    });

    checkout.on('payment.failed', (payload) =>
      reject(new Error(payload?.error?.description ?? 'The payment did not go through.')),
    );

    checkout.open();
  });
}
