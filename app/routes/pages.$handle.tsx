import {useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {fixturesEnabled, sanitizeHandle} from '~/lib/catalog/catalog.server';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {sanitizeMerchantHtml} from '~/lib/sanitize.server';
import {absoluteUrl, pageMeta, SITE_NAME} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data}) =>
  data
    ? pageMeta({
        title: data.page.seoTitle || `${data.page.title} | ${SITE_NAME}`,
        description: data.page.seoDescription || undefined,
        url: data.canonical,
      })
    : [{title: SITE_NAME}];

export async function loader({context, request, params}: Route.LoaderArgs) {
  const handle = sanitizeHandle(params.handle, '');
  if (!handle || fixturesEnabled(context.env, request)) {
    throw new Response('Not found', {status: 404});
  }
  const {page} = await context.storefront.query(PAGE_QUERY, {
    variables: {handle},
    cache: context.storefront.CacheLong(),
  });
  if (!page) throw new Response('Not found', {status: 404});
  redirectIfHandleIsLocalized(request, {handle, data: page});
  const siteUrl = context.env.PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return {
    page: {
      title: page.title,
      body: sanitizeMerchantHtml(page.body),
      seoTitle: page.seo?.title,
      seoDescription: page.seo?.description,
    },
    canonical: absoluteUrl(siteUrl, `/pages/${page.handle}`),
  };
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();
  return (
    <main id="main" className="wrap pb-24" style={{paddingTop: 'calc(var(--header-h) + 3rem)'}}>
      <h1 className="display-l mb-10 max-w-[18ch]">{page.title}</h1>
      <div className="prose-mr max-w-[68ch]" dangerouslySetInnerHTML={{__html: page.body}} />
    </main>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
