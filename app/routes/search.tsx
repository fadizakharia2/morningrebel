import {redirectToRoasts} from '~/lib/standard-routes.server';

export function loader() {
  return redirectToRoasts();
}
