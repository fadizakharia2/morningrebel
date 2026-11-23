import {describe, expect, it} from 'vitest';
import {analyticsCspSources, applySecurityHeaders, isSameOriginMutation} from '~/lib/security';
import {sanitizeMerchantHtml} from '~/lib/sanitize.server';
import {sanitizePixelConfig} from '~/components/analytics/ThirdPartyPixels';

const post = (headers: Record<string, string>) =>
  new Request('https://shop.example/cart', {method: 'POST', headers});

describe('CSRF origin check', () => {
  it('allows same-origin posts', () => {
    expect(isSameOriginMutation(post({origin: 'https://shop.example'}))).toBe(true);
  });
  it('blocks cross-site posts', () => {
    expect(isSameOriginMutation(post({origin: 'https://evil.example'}))).toBe(false);
    expect(isSameOriginMutation(post({origin: 'https://shop.example', 'sec-fetch-site': 'cross-site'}))).toBe(false);
    expect(isSameOriginMutation(post({}))).toBe(false);
  });
  it('always allows GET', () => {
    expect(isSameOriginMutation(new Request('https://shop.example/'))).toBe(true);
  });
});

describe('security headers', () => {
  it('sets hardening headers, HSTS on https', () => {
    const res = applySecurityHeaders(new Response('ok'), new Request('https://shop.example/'));
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=');
  });
  it('wraps immutable redirect responses', () => {
    const res = applySecurityHeaders(Response.redirect('https://shop.example/x', 302), new Request('https://shop.example/'));
    expect(res.status).toBe(302);
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });
  it('opens CSP to analytics hosts only when an ID is configured', () => {
    expect(analyticsCspSources({} as Env).script).toEqual([]);
    expect(analyticsCspSources({PUBLIC_META_PIXEL_ID: '123456'} as Env).script).toContain('https://connect.facebook.net');
  });
});

describe('merchant HTML sanitising', () => {
  it('strips scripts, handlers and javascript: urls', () => {
    const out = sanitizeMerchantHtml('<p onclick="x()">Hi<script>alert(1)</script></p><a href="javascript:alert(1)">x</a><iframe src="//e"></iframe>');
    expect(out).not.toMatch(/script|onclick|javascript:|iframe/i);
    expect(out).toContain('<p>Hi</p>');
  });
});

describe('pixel config', () => {
  it('keeps only well-formed tracking ids', () => {
    expect(sanitizePixelConfig({ga4: 'G-ABC123', meta: '<x>', tiktok: 'C12345ABCDE6789'})).toEqual({ga4: 'G-ABC123', tiktok: 'C12345ABCDE6789'});
  });
});
