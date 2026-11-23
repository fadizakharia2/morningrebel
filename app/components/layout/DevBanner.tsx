/** Always visible while development fixtures are active. Never rendered with real Shopify data. */
export function DevBanner() {
  return (
    <div
      className="dev-banner fixed bottom-3 left-3 z-[55] max-w-[min(26rem,calc(100vw-1.5rem))] rounded-lg px-3 py-2 shadow-lg"
      role="note"
      data-testid="dev-banner"
    >
      Development fixtures: no Shopify store connected. Prices, facts and images are placeholders.
    </div>
  );
}
