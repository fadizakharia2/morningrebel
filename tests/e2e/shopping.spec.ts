import {expect, test, type Page} from '@playwright/test';

async function openFreshHome(page: Page) {
  await page.context().clearCookies();
  await page.goto('/');
  await expect(page.getByTestId('panel-medium')).toBeVisible();
  // Interactions before hydration fall back to plain links and forms (by
  // design), which these tests are not about. Wait for the app to boot.
  await page.waitForLoadState('networkidle');
}

test.describe('product loading', () => {
  test('homepage shows both roasts with purchase controls and the fixture notice', async ({page}) => {
    await openFreshHome(page);
    await expect(page.getByRole('heading', {level: 1})).toContainText(/your morning/i);
    await expect(page.getByTestId('panel-medium').getByRole('heading', {name: 'Medium Roast'})).toBeVisible();
    await expect(page.getByTestId('panel-dark').getByRole('heading', {name: 'Dark Roast'})).toBeVisible();
    await expect(page.getByTestId('add-medium')).toBeEnabled();
    await expect(page.getByTestId('dev-banner')).toBeVisible();
    // Fixture mode never prints a made-up price.
    await expect(page.getByTestId('price').first()).toHaveText('Price from Shopify');
  });

  test('product page renders with breadcrumbs and structured data', async ({page}) => {
    await page.goto('/products/medium-roast');
    await expect(page.getByRole('heading', {level: 1})).toContainText('Medium Roast');
    await expect(page.getByRole('navigation', {name: 'Breadcrumb'})).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('BreadcrumbList'))).toBe(true);
  });

  test('unknown products return 404', async ({page}) => {
    const res = await page.goto('/products/not-a-roast');
    expect(res?.status()).toBe(404);
  });
});

test.describe('variant selection and sold-out behaviour', () => {
  test('selecting a sold-out variant disables purchase', async ({page}) => {
    await page.goto('/products/dark-roast');
    const add = page.getByTestId('pdp-add');
    await expect(add).toBeEnabled();
    await page.getByRole('radio', {name: /Sold-out test variant/}).check();
    await expect(add).toBeDisabled();
    await expect(add).toHaveAccessibleName(/^Sold out\s*, Dark Roast$/);
    await expect(page.getByTestId('availability').first()).toHaveText(/Sold out/);
    await page.getByRole('radio', {name: 'Standard'}).check();
    await expect(add).toBeEnabled();
  });

  test('the server refuses a sold-out variant even if the UI is bypassed', async ({request}) => {
    const res = await request.post('/cart', {
      headers: {origin: 'http://localhost:3000'},
      form: {
        cartFormInput: JSON.stringify({
          action: 'LinesAdd',
          inputs: {lines: [{merchandiseId: 'gid://shopify/ProductVariant/9100000003', quantity: 1}]},
        }),
      },
    });
    const body = await res.text();
    expect(body).toMatch(/sold out/i);
  });
});

test.describe('cart', () => {
  test('add, update quantity, remove', async ({page}) => {
    await openFreshHome(page);
    await page.getByTestId('add-medium').click();
    const drawer = page.getByTestId('cart-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByTestId('cart-line')).toHaveCount(1);
    await expect(drawer.getByTestId('line-qty')).toHaveText('1');
    await expect(page.getByTestId('cart-count')).toHaveText('1');

    await drawer.getByRole('button', {name: /Increase quantity of Medium Roast/}).click();
    await expect(drawer.getByTestId('line-qty')).toHaveText('2');
    await expect(page.getByTestId('cart-count')).toHaveText('2');

    await drawer.getByRole('button', {name: /Decrease quantity of Medium Roast/}).click();
    await expect(drawer.getByTestId('line-qty')).toHaveText('1');

    await drawer.getByRole('button', {name: /Remove Medium Roast/}).click();
    await expect(drawer.getByTestId('cart-empty')).toBeVisible();
  });

  test('cross-sell suggests the other roast and never adds on its own', async ({page}) => {
    await openFreshHome(page);
    await page.getByTestId('add-medium').click();
    const drawer = page.getByTestId('cart-drawer');
    await expect(drawer.getByTestId('cross-sell')).toContainText('Dark Roast');
    await expect(drawer.getByTestId('cart-line')).toHaveCount(1);
    await drawer.getByTestId('cross-sell').getByRole('button', {name: /Add/}).click();
    await expect(drawer.getByTestId('cart-line')).toHaveCount(2);
    await expect(drawer.getByTestId('cross-sell')).toHaveCount(0);
  });

  test('the Duo adds one of each roast', async ({page}) => {
    await openFreshHome(page);
    await page.locator('#duo').getByTestId('duo-add').click();
    const drawer = page.getByTestId('cart-drawer');
    await expect(drawer.getByTestId('cart-line')).toHaveCount(2);
    await expect(page.getByTestId('cart-count')).toHaveText('2');
  });

  test('prices shown in the cart come from the same source as the product panel', async ({page}) => {
    await openFreshHome(page);
    const panelPrice = await page.getByTestId('panel-dark').getByTestId('price').first().textContent();
    await page.getByTestId('add-dark').click();
    // Wait for the server-confirmed line, not the optimistic one.
    const line = page.getByTestId('cart-drawer').locator('[data-testid="cart-line"]:not([data-optimistic])');
    await expect(line).toHaveCount(1);
    const linePrice = await line.getByTestId('line-total').textContent();
    expect(linePrice?.trim()).toBe(panelPrice?.trim());
  });

  test('cart persists across reloads (session cookie)', async ({page}) => {
    await openFreshHome(page);
    await page.getByTestId('add-dark').click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await page.reload();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('Escape closes the drawer and returns focus', async ({page}) => {
    await openFreshHome(page);
    await page.getByTestId('cart-toggle').click();
    await expect(page.getByTestId('cart-drawer')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('cart-drawer')).toBeHidden();
    await expect(page.getByTestId('cart-toggle')).toBeFocused();
  });
});

test.describe('checkout hand-off', () => {
  test('checkout links to the cart checkoutUrl', async ({page}) => {
    await openFreshHome(page);
    await page.getByTestId('add-medium').click();
    const checkout = page.getByTestId('checkout');
    // In fixture mode the URL is the local stand-in; with Shopify it is cart.checkoutUrl (https).
    await expect(checkout).toHaveAttribute('href', '/dev/checkout');
    await checkout.click();
    await expect(page.getByTestId('dev-checkout')).toBeVisible();
  });
});

test.describe('request security and error states', () => {
  test('cross-site cart mutations are rejected', async ({request}) => {
    const res = await request.post('/cart', {
      headers: {origin: 'https://evil.example'},
      form: {cartFormInput: '{}'},
    });
    expect(res.status()).toBe(403);
  });

  test('malformed variant ids get a 400 with a friendly message', async ({request}) => {
    const res = await request.post('/cart', {
      headers: {origin: 'http://localhost:3000'},
      form: {
        cartFormInput: JSON.stringify({
          action: 'LinesAdd',
          inputs: {lines: [{merchandiseId: 'gid://shopify/Product/1', quantity: 1}]},
        }),
      },
    });
    expect(res.status()).toBe(400);
    expect(await res.text()).toContain('not valid');
  });

  test('responses carry security headers and a CSP', async ({request}) => {
    const res = await request.get('/');
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });
});
