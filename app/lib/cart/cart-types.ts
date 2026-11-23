import type {ImageData, Money} from '~/lib/catalog/types';

export interface CartLine {
  id: string;
  quantity: number;
  isOptimistic?: boolean;
  cost: {
    totalAmount: Money;
    amountPerQuantity: Money;
  };
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    price: Money;
    image?: ImageData | null;
    selectedOptions: Array<{name: string; value: string}>;
    product: {id?: string; handle: string; title: string; vendor?: string};
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  isOptimistic?: boolean;
  lines: {nodes: CartLine[]};
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
  };
  attributes?: Array<{key: string; value?: string | null}>;
}

export interface CartActionResult {
  cart: Cart | null;
  errors?: Array<{message: string}>;
  warnings?: Array<{message: string}>;
  userErrors?: Array<{message: string}>;
}
