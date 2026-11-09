import { expect, test } from '@playwright/test';

const DEMO_EMAIL = process.env.E2E_EMAIL ?? 'customer@servora.demo';
const DEMO_PASSWORD = process.env.E2E_PASSWORD ?? 'demo1234';

test.describe('Servora API', () => {
  test('health endpoint reports status', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.status).toMatch(/ok|degraded/);
  });

  test('blocks unauthenticated access to protected routes', async ({ request }) => {
    const response = await request.get('/api/bookings');
    expect([401, 403]).toContain(response.status());
  });

  test('signs in a seeded demo account and reads the profile', async ({ request }) => {
    const login = await request.post('/api/auth/login', {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    expect(login.ok()).toBeTruthy();
    const { data } = await login.json();
    const token: string | undefined = data?.tokens?.accessToken;
    expect(token).toBeTruthy();

    const me = await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.ok()).toBeTruthy();
    const profile = await me.json();
    expect(profile.data.email).toBe(DEMO_EMAIL);
  });

  test('serves categories from the catalog', async ({ request }) => {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const categories = body.data ?? body;
    expect(Array.isArray(categories)).toBe(true);
  });
});
