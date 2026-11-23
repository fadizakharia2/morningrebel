import {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';

interface CartUIValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Politely announces cart changes to screen readers. */
  announce: (message: string) => void;
  message: string;
  /** Increments on each successful add, used for the header count bump. */
  addTick: number;
  notifyAdded: () => void;
}

const CartUIContext = createContext<CartUIValue | null>(null);

export function CartUIProvider({children}: {children: React.ReactNode}) {
  const [isOpen, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [addTick, setAddTick] = useState(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((text: string) => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    // Clearing first makes repeated identical messages re-announce.
    setMessage('');
    requestAnimationFrame(() => setMessage(text));
    clearTimer.current = setTimeout(() => setMessage(''), 6000);
  }, []);

  const value = useMemo<CartUIValue>(
    () => ({
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      announce,
      message,
      addTick,
      notifyAdded: () => setAddTick((t) => t + 1),
    }),
    [isOpen, announce, message, addTick],
  );

  return (
    <CartUIContext.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {message}
      </div>
    </CartUIContext.Provider>
  );
}

export function useCartUI() {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error('useCartUI must be used inside CartUIProvider');
  return ctx;
}
