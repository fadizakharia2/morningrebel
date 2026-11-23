import type {Route} from './+types/account.authorize';
import {redirectToShopifyAccount} from '~/lib/standard-routes.server';

export function loader({context, request}: Route.LoaderArgs) {
  return redirectToShopifyAccount(context.env, request);
}
