import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/policies.$handle';
import {fixturesEnabled} from '~/lib/catalog/catalog.server';
import {sanitizeMerchantHtml} from '~/lib/sanitize.server';
import {absoluteUrl, pageMeta, SITE_NAME} from '~/lib/seo';

const POLICY_FIELDS = {
  'privacy-policy': 'privacyPolicy',
  'shipping-policy': 'shippingPolicy',
  'terms-of-service': 'termsOfService',
  'refund-policy': 'refundPolicy',
} as const;

type PolicyHandle = keyof typeof POLICY_FIELDS;

export const meta: Route.MetaFunction = ({data}) =>
  data
    ? pageMeta({
        title: `${data.policy.title} | ${SITE_NAME}`,
        description: `${data.policy.title} for ${SITE_NAME}.`,
        url: data.canonical,
      })
    : [{title: `Policy | ${SITE_NAME}`}];

export async function loader({params, context, request}: Route.LoaderArgs) {
  const handle = params.handle as PolicyHandle;
  if (!(handle in POLICY_FIELDS) || fixturesEnabled(context.env, request)) {
    throw new Response('Not found', {status: 404});
  }
  const field = POLICY_FIELDS[handle];
  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: field === 'privacyPolicy',
      shippingPolicy: field === 'shippingPolicy',
      termsOfService: field === 'termsOfService',
      refundPolicy: field === 'refundPolicy',
      language: context.storefront.i18n?.language,
    },
    cache: context.storefront.CacheLong(),
  });
  const policy = data.shop?.[field];
  if (!policy) throw new Response('Not found', {status: 404});

  const siteUrl = context.env.PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return {
    policy: {title: policy.title, body: sanitizeMerchantHtml(policy.body)},
    canonical: absoluteUrl(siteUrl, `/policies/${handle}`),
  };
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();
  return (
    <main id="main" className="wrap pb-24" style={{paddingTop: 'calc(var(--header-h) + 3rem)'}}>
      <p className="mb-6 text-sm">
        <Link to="/" className="text-link">Back to the roasts</Link>
      </p>
      <h1 className="display-l mb-10 max-w-[18ch]">{policy.title}</h1>
      <div
        className="prose-mr max-w-[68ch]"
        // Sanitised server-side with an allowlist (sanitize.server.ts).
        dangerouslySetInnerHTML={{__html: policy.body}}
      />
    </main>
  );
}

// https://shopify.dev/docs/api/storefront/latest/objects/Shop
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;
