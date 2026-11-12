# Servora

Servora is a marketplace for local home services. A customer finds a service, picks a time slot, pays, and
leaves a review. A vendor gets a portal to actually run their business: services, staff, a weekly calendar,
earnings, payouts. An admin gets a console to keep an eye on the whole marketplace: vendors, bookings,
transactions, refunds, disputes, commissions, coupons, audit logs.

I built all of it myself. The customer site, the vendor portal, the admin console, and the NestJS API
behind them.

## First, this is a demo

I'm not running a real business here. It's a project I built to show what I can do end to end, and I'd
rather say that upfront than have someone sign up expecting a cleaner to show up.

So, a few honest notes:

- Payments go through Razorpay in **test mode**. No money moves. If you don't add Razorpay keys, there's a
  built-in mock gateway so the flow still works. The storefront asks the API to create the order and verify
  the signature, so the key secret never ships to the browser.
- The vendors, bookings, reviews and everything else you'll see are seeded demo data.
- Without SMTP / MSG91 keys, emails and SMS get logged to the console instead of being sent.

## What's in the repo

Two apps:

- `src/` — the React front end. The customer site, the vendor portal and the admin console all live in here.
- `server/` — the NestJS API. Postgres, Prisma, Redis, Razorpay, auth, tests.

The front end ships with the demo data built in, so it runs on its own with no database and no API. That was
deliberate: I wanted anyone to clone this and see the whole product in one command. The API in `server/` is
the real version of the same domain, with the database and the transactions where they belong.

The one exception is payments: the booking flow calls `POST /api/payments/checkout/order` and
`POST /api/payments/checkout/verify` so Razorpay orders are created and verified on the server. If the API is
not running, checkout falls back to Razorpay's amount-only mode and the booking is marked "verification
pending" instead of pretending it was reconciled.

## Running the front end

```bash
npm install
npm run dev
```

It opens on http://localhost:5173.

Two things worth trying while you're in there:

- **The theme button in the header.** Three themes: light green (default, the one I actually use), white,
  and black. Your choice is remembered.
- **The location button** on the login page, on search, or in the booking flow. It asks the browser for your
  location, matches you to the nearest city, and filters vendors by distance. The radius starts at 5 km and
  you can change it to 1, 2, 10 or 25 km.

## Running the API too

You'll need Docker for Postgres, Redis and MailHog.

```bash
docker compose up -d
```

```bash
cd server
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run start:dev
```

Then:

- `http://localhost:4000/api` — the API
- `http://localhost:4000/docs` — Swagger. Every endpoint is documented, and you can authorise with a token
  from `POST /api/auth/login` and click through the requests.
- `http://localhost:4000/health` — liveness plus a check on Postgres and Redis.

If your Postgres isn't on 5432, update `DATABASE_URL` in `server/.env`. The `CORS_ORIGINS` value already
allows the front end on 5173.

## Razorpay, end to end

The flow is the real one — no amount is trusted from the browser in the verified path.

1. `POST /api/payments/checkout/order` on the API creates the Razorpay order with the **key secret**
   (server-side only) and returns `{ orderId, keyId, amountPaise }`.
2. The browser opens Razorpay Checkout with that `order_id`.
3. Razorpay calls back with `razorpay_payment_id`, `razorpay_order_id` and `razorpay_signature`.
4. `POST /api/payments/checkout/verify` recomputes the HMAC, then reads the order and payment back from
   Razorpay to confirm the amount, currency and captured status. Only then is the booking shown as
   "Razorpay verified".

Credentials live in `server/.env`, never in the front end:

```env
RAZORPAY_KEY_ID=rzp_test_xx
RAZORPAY_KEY_SECRET=xx
RAZORPAY_WEBHOOK_SECRET=xxx
RAZORPAY_CURRENCY=INR
```

The front end only needs the publishable key id:

```env
VITE_API_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=rzp_test_xx
```

For webhooks, open **Razorpay Dashboard → Settings → Webhooks** and add:

- URL: `https://<your-api-host>/api/payments/webhook`
- Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`
- Events: `payment.captured`, `payment.failed`, `refund.processed`

Without the webhook secret the endpoint rejects every event, so set it even if you only use checkout.

> Rotate any key that has been pasted into a chat, issue tracker or commit. Test keys are free to rotate.

### Notes that save you a bad afternoon

- `VITE_*` values are baked in at build time. Changing `VITE_API_URL` means redeploying the front end.
- Keep `ENABLE_STOREFRONT_CHECKOUT=true` only while the demo creates bookings in local state. Once the
  storefront posts real bookings to the API, create orders from the booking (`POST /api/payments/orders`)
  and turn this off so amounts can't be chosen by the browser.
- Use managed Postgres + Redis. The local `docker-compose.yml` is for development only.
- Set `COOKIE_SECURE=true` and a `COOKIE_DOMAIN` that matches the API host in production.
- Free tiers sleep. A cold start makes the first payment request slower; the client times out at 7s and falls
  back to unverified checkout, so use a paid instance for demos you care about.


## The bits I put the most work into

**Two people can't book the same slot.** A booking is created inside a SERIALIZABLE transaction, and there
are also Postgres exclusion constraints on the table. The transaction is the main defence and the constraints
are the backstop, so even two requests landing in the same millisecond can't both win. Serialization failures
(`P2034`) are retried automatically. I wrote a test that fires four bookings at one staff member in parallel
and asserts exactly three succeed.

**The money is split properly.** Razorpay orders are created on the server, the signature is verified with a
constant time comparison, and every booking is split between the platform and the vendor using that vendor's
commission rate (12.5% by default, per-vendor overridable). Refunds, payout batches and a ledger are all in
the schema. All amounts in the API are integers in paise, never floats.

**Refresh tokens actually rotate.** The access token is a JWT, the refresh token is an opaque random string
stored as a SHA-256 hash. Using a refresh token rotates it, and reusing an old one is detected and kills the
whole session. Passwords are bcrypt. Everything is behind role-based guards for customer / vendor / admin.

**Slots are calculated, not faked.** Availability is computed from the vendor's weekly rules, time off,
the service duration and any buffer between jobs, in IST, and it subtracts what's already booked.

## Tests

```bash
cd server
npm test          # vitest — money, time, refs, availability logic
npm run test:e2e  # playwright — API flows, needs the server running
```

## Config

`server/.env.example` has every variable with a comment above it. The ones you'd actually touch are
`DATABASE_URL`, `REDIS_URL`, the JWT secrets, and the Razorpay / SMTP / MSG91 keys. Leave the integration
keys blank and you get the mock gateway and console logging, which is how I run it locally.

## Why I built it this way

I wanted a project with real problems in it. Anyone can build a booking form. The interesting part is what
happens when two people submit it at once, or when a refund has to land in the same ledger the payout batch
reads from. So the front end is polished on purpose and so is the backend, and the backend is where I spent
the time on correctness rather than features.

The front end deliberately uses seeded data so the demo stays instant and works offline. Payments are the
only server round-trip: order creation and signature verification. If I were shipping this for real, wiring
the rest of the React app to the API would be the next step, replacing the seeded stores with fetches and
the realtime bits with a socket.

## Contact

Kuldeep Yadav

- Email: kuldeepinfo30@gmail.com
- GitHub: [@kuldeepinfo30-cmyk](https://github.com/kuldeepinfo30-cmyk)
- LinkedIn: [kuldeep-yadav](https://www.linkedin.com/in/kuldeep-yadav-159146445/)
- UPI: `kuldeepyada2805@okicici`

It's a demo build, so please don't reuse or resell it.
