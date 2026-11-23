import type {Route} from './+types/[sitemap.xml]';
import {getStorefrontData} from '~/lib/catalog/catalog.server';

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** The storefront has exactly three commercial URLs; list them directly. */
export async function loader({request, context}: Route.LoaderArgs) {
  const origin = context.env.PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const data = await getStorefrontData({storefront: context.storefront, env: context.env, request});
  const paths = ['/', ...[data.medium, data.dark].filter(Boolean).map((p) => `/products/${p!.handle}`)];
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(new URL(path, origin).toString())}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  return new Response(body, {
    headers: {'Content-Type': 'application/xml', 'Cache-Control': `max-age=${60 * 60 * 6}`},
  });
}
