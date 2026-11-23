import {useEffect, useRef} from 'react';
import {Link} from 'react-router';
import {NAV_ITEMS} from './nav';

/**
 * Full-screen menu built on <dialog>: focus is trapped and restored by the
 * browser, Escape closes it, and the page behind becomes inert.
 */
export function MobileNavigation({open, onClose}: {open: boolean; onClose: () => void}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      id="mobile-nav"
      className="sheet sheet--full"
      aria-label="Menu"
      onClose={onClose}
    >
      <div className="wrap flex h-full flex-col">
        <div className="flex items-center justify-between" style={{height: 'var(--header-h)'}}>
          <span className="wordmark">Morning Rebel</span>
          <button
            type="button"
            className="icon-btn -mr-2"
            onClick={onClose}
            aria-label="Close menu"
            // Inside a modal <dialog>, autofocus is how the HTML spec sets initial focus.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav aria-label="Mobile" className="mt-10 flex-1">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item, i) => (
              <li key={item.to} className="enter-fade" style={{'--i': i - 5} as React.CSSProperties}>
                <Link
                  to={item.to}
                  onClick={onClose}
                  className="block py-3 font-display text-[2.6rem] leading-none"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="pb-8 font-display text-lg text-[var(--text-soft)]">
          For the ritual. Not the hype.
        </p>
      </div>
    </dialog>
  );
}
