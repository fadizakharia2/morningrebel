import {useIsFixture} from '~/lib/use-storefront';

/**
 * Shows a verified fact, or — only in fixture mode — a visible marker that the
 * fact is still to be supplied. In production a missing fact renders nothing.
 */
export function Pending({label = 'Awaiting verified supplier data'}: {label?: string}) {
  const isFixture = useIsFixture();
  if (!isFixture) return null;
  return (
    <span className="pending" data-testid="pending-fact">
      {label}
    </span>
  );
}

export function FactRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  const isFixture = useIsFixture();
  const has = Boolean(value) || Boolean(children);
  if (!has && !isFixture) return null;
  return (
    <div className="grid grid-cols-[minmax(7rem,9rem)_1fr] gap-4 border-t hairline py-3 first:border-t-0">
      <dt className="label pt-0.5">{label}</dt>
      <dd className="text-[0.95rem]">{has ? (children ?? value) : <Pending />}</dd>
    </div>
  );
}

export function TastingNotes({notes}: {notes: string[]}) {
  if (notes.length === 0) return <Pending label="Tasting notes: awaiting verified data" />;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="Tasting notes">
      {notes.map((note, i) => (
        <li key={note} className="font-display text-lg italic">
          {note}
          {i < notes.length - 1 ? <span aria-hidden="true" className="ml-3 not-italic text-[var(--text-soft)]">/</span> : null}
        </li>
      ))}
    </ul>
  );
}
