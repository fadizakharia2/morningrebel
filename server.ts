import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';
import {applySecurityHeaders, isSameOriginMutation} from '~/lib/security';

/**
 * Oxygen worker entry (module format).
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      if (!isSameOriginMutation(request)) {
        return applySecurityHeaders(
          new Response('Forbidden', {status: 403}),
          request,
        );
      }

      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      const handleRequest = createRequestHandler({
        build: serverBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
        poweredByHeader: false,
      });

      let response = await handleRequest(request);

      if (hydrogenContext.session.isPending) {
        response.headers.append(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404 && !hydrogenContext.commerce.isFixture) {
        // Shopify admin URL redirects (Online Store > Navigation > URL redirects).
        response = await storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return applySecurityHeaders(response, request);
    } catch (error) {
      // Log the error class and message only; never request bodies or cookies.
      console.error(
        '[morning-rebel] unhandled',
        error instanceof Error ? `${error.name}: ${error.message}` : 'unknown',
      );
      return applySecurityHeaders(
        new Response('Something went wrong. Please try again.', {status: 500}),
        request,
      );
    }
  },
};
