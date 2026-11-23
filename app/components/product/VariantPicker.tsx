import {useId} from 'react';
import type {Product} from '~/lib/catalog/types';
import {optionValueState, visibleOptions} from '~/lib/variants';

/**
 * Native radio groups (keyboard arrows, screen-reader semantics for free).
 * Sold-out values stay selectable so the customer sees the state, but the
 * add-to-cart control is disabled for them.
 */
export function VariantPicker({
  product,
  selected,
  onSelect,
  compact = false,
}: {
  product: Product;
  selected: Record<string, string>;
  onSelect: (name: string, value: string) => void;
  compact?: boolean;
}) {
  const baseId = useId();
  const options = visibleOptions(product);
  if (options.length === 0) return null;
  return (
    <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-5'}`}>
      {options.map((option) => (
        <fieldset key={option.name}>
          <legend className="label mb-2">
            {option.name}
            <span className="sr-only">: {selected[option.name]}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const state = optionValueState(product, selected, option.name, value);
              if (!state.exists) return null;
              const id = `${baseId}-${option.name}-${value}`.replace(/\s+/g, '-');
              return (
                <label key={value} htmlFor={id} className="option-chip" data-unavailable={!state.available}>
                  <input
                    id={id}
                    type="radio"
                    name={`${baseId}-${option.name}`}
                    value={value}
                    checked={selected[option.name] === value}
                    onChange={() => onSelect(option.name, value)}
                  />
                  {value}
                  {!state.available ? <span className="sr-only"> (sold out)</span> : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
