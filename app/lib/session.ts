import type {HydrogenSession} from '@shopify/hydrogen';
import {
  createCookieSessionStorage,
  type SessionStorage,
  type Session,
} from 'react-router';

/**
 * Signed, HttpOnly cookie session (Shopify's supported Hydrogen pattern).
 * It stores no personal or payment data; only the fixture cart in local dev.
 */
export class AppSession implements HydrogenSession {
  public isPending = false;

  #sessionStorage;
  #session;

  constructor(sessionStorage: SessionStorage, session: Session) {
    this.#sessionStorage = sessionStorage;
    this.#session = session;
  }

  static async init(
    request: Request,
    secrets: string[],
    {secure}: {secure: boolean} = {secure: true},
  ) {
    const storage = createCookieSessionStorage({
      cookie: {
        // __Host- prefix requires Secure + Path=/ and no Domain, preventing
        // subdomain cookie injection. Plain name is used on http://localhost.
        name: secure ? '__Host-mr_session' : 'mr_session',
        httpOnly: true,
        secure,
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        secrets,
      },
    });

    const session = await storage
      .getSession(request.headers.get('Cookie'))
      .catch(() => storage.getSession());

    return new this(storage, session);
  }

  get has() {
    return this.#session.has;
  }

  get get() {
    return this.#session.get;
  }

  get flash() {
    return this.#session.flash;
  }

  get unset() {
    this.isPending = true;
    return this.#session.unset;
  }

  get set() {
    this.isPending = true;
    return this.#session.set;
  }

  destroy() {
    return this.#sessionStorage.destroySession(this.#session);
  }

  commit() {
    this.isPending = false;
    return this.#sessionStorage.commitSession(this.#session);
  }
}
