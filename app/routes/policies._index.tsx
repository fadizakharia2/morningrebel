import {Link} from 'react-router';
import type {Route} from './+types/policies._index';
import {useStorefront} from '~/lib/use-storefront';
import {SITE_NAME} from '~/lib/seo';

export const meta: Route.MetaFunction = () => [{title: `Policies | ${SITE_NAME}`}];

export default function Policies() {
  const {policies} = useStorefront();
  return (
    <main id="main" className="wrap pb-24" style={{paddingTop: 'calc(var(--header-h) + 3rem)'}}>
      <h1 className="display-l mb-10">Policies</h1>
      {policies.length > 0 ? (
        <ul className="flex flex-col gap-4 text-lg">
          {policies.map((policy) => (
            <li key={policy.handle}>
              <Link to={`/policies/${policy.handle}`} className="text-link">
                {policy.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lead">Store policies appear here once they are published in Shopify admin.</p>
      )}
    </main>
  );
}
