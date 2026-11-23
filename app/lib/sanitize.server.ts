import {FilterXSS} from 'xss';

/**
 * Merchant-authored HTML (Shopify pages and policies) is sanitised on the
 * server with an allowlist before it is rendered. Scripts, styles, iframes,
 * event handlers and non-http(s) URLs are removed.
 */
const filter = new FilterXSS({
  whiteList: {
    a: ['href', 'title', 'target', 'rel'],
    p: [],
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    ul: [],
    ol: [],
    li: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    blockquote: [],
    span: [],
    div: [],
    table: [],
    thead: [],
    tbody: [],
    tr: [],
    th: [],
    td: [],
    hr: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed', 'noscript'],
  onTagAttr(tag, name, value) {
    if (tag === 'a' && name === 'href') {
      const v = value.trim();
      if (/^(https?:|mailto:|\/(?!\/)|#)/i.test(v)) return `href="${v.replace(/"/g, '&quot;')}"`;
      return '';
    }
    if (tag === 'a' && name === 'target') return 'target="_blank"';
    if (tag === 'a' && name === 'rel') return 'rel="noopener noreferrer"';
    return undefined;
  },
});

export function sanitizeMerchantHtml(html: string): string {
  return filter.process(html ?? '');
}
