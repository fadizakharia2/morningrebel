import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';
import {analyticsCspSources} from '~/lib/security';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {env} = context;
  const extra = analyticsCspSources(env);
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: env.PUBLIC_STORE_DOMAIN,
    },
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      // Shopify Customer Privacy API / consent banner
      'https://cdn.shopify.com/shopifycloud/',
      ...extra.script,
    ],
    imgSrc: ["'self'", 'data:', 'https://cdn.shopify.com', ...extra.img],
    fontSrc: ["'self'"],
    connectSrc: [...extra.connect],
    frameSrc: [...extra.frame],
    objectSrc: ["'none'"],
    formAction: [
      "'self'",
      ...(env.PUBLIC_CHECKOUT_DOMAIN ? [`https://${env.PUBLIC_CHECKOUT_DOMAIN}`] : []),
    ],
    upgradeInsecureRequests: new URL(request.url).protocol === 'https:',
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(
          '[morning-rebel] render error',
          error instanceof Error ? error.message : 'unknown',
        );
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
