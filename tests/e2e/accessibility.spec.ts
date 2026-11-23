import {AxeBuilder} from '@axe-core/playwright';
import {expect, test} from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function scan(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({page})
    .withTags(WCAG_TAGS)
    // The fixed dev notice only exists in local fixture mode.
    .exclude('[data-testid="dev-banner"]')
    .analyze();
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }));
}

test.describe('automated WCAG 2.2 AA checks (axe)', () => {
  for (const path of ['/', '/products/medium-roast', '/products/dark-roast', '/cart']) {
    test(`no violations on ${path}`, async ({page}) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // Reveal scroll-triggered content so it is scanned in its final state.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);
      expect(await scan(page)).toEqual([]);
    });
  }

  test('no violations with the cart drawer open', async ({page}) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.getByTestId('add-medium').click();
    await expect(page.getByTestId('cart-drawer').getByTestId('cart-line')).toHaveCount(1);
    await page.waitForTimeout(600);
    expect(await scan(page)).toEqual([]);
  });
});
