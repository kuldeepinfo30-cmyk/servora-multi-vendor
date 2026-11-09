import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
  mock: boolean;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly keyId?: string;
  private readonly keySecret?: string;
  private readonly webhookSecret?: string;

  constructor(private readonly config: ConfigService) {
    this.keyId = config.get<string>('RAZORPAY_KEY_ID') || undefined;
    this.keySecret = config.get<string>('RAZORPAY_KEY_SECRET') || undefined;
    this.webhookSecret = config.get<string>('RAZORPAY_WEBHOOK_SECRET') || undefined;
  }

  get configured() {
    return Boolean(this.keyId && this.keySecret);
  }

  get publicKey() {
    return this.keyId ?? null;
  }

  private authHeader() {
    return `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;
  }

  async createOrder(input: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<RazorpayOrder> {
    if (!this.configured) {
      return {
        id: `order_mock_${randomBytes(8).toString('hex')}`,
        amount: input.amountPaise,
        currency: this.config.get('RAZORPAY_CURRENCY') ?? 'INR',
        receipt: input.receipt,
        status: 'created',
        mock: true,
      };
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.authHeader() },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: this.config.get('RAZORPAY_CURRENCY') ?? 'INR',
        receipt: input.receipt,
        notes: input.notes ?? {},
        payment_capture: 1,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Razorpay order failed: ${response.status} ${body}`);
      throw new Error('Payment gateway is unavailable. Please try again.');
    }
    const order = (await response.json()) as RazorpayOrder;
    return { ...order, mock: false };
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (!this.configured) return true; // mock orders carry no real signature
    if (!this.keySecret) return false;
    const expected = createHmac('sha256', this.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    return safeEqual(expected, signature);
  }

  verifyWebhook(rawBody: Buffer | string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = createHmac('sha256', this.webhookSecret).update(body).digest('hex');
    return safeEqual(expected, signature);
  }

  async refund(paymentId: string, amountPaise: number, notes?: Record<string, string>) {
    if (!this.configured) {
      return { id: `rfnd_mock_${randomBytes(6).toString('hex')}`, status: 'processed', mock: true };
    }
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.authHeader() },
      body: JSON.stringify({ amount: amountPaise, notes: notes ?? {}, speed: 'normal' }),
    });
    if (!response.ok) {
      throw new Error(`Razorpay refund failed: ${await response.text()}`);
    }
    return { ...(await response.json()), mock: false };
  }
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
