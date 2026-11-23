import type {Route} from './+types/[robots.txt]';

export function loader({request, context}: Route.LoaderArgs) {
  const origin = context.env.PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const body = `User-agent: *
Disallow: /cart
Disallow: /dev/
Disallow: /*?variant=*

# Google AdsBot ignores wildcard groups unless named explicitly.
User-agent: adsbot-google
Disallow: /cart
Disallow: /dev/

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    status: 200,
    headers: {'Content-Type': 'text/plain', 'Cache-Control': `max-age=${60 * 60 * 24}`},
  });
}
