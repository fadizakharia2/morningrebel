// https://shopify.dev/docs/api/storefront/latest/objects/Cart
// Hydrogen's cart handler uses this fragment for cart.get() and every mutation.
export const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        title
        availableForSale
        price {
          ...Money
        }
        image {
          id
          url
          altText
          width
          height
        }
        selectedOptions {
          name
          value
        }
        product {
          id
          handle
          title
          vendor
        }
      }
    }
  }
  fragment CartApiQuery on Cart {
    id
    checkoutUrl
    totalQuantity
    updatedAt
    attributes {
      key
      value
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
    }
    lines(first: 50) {
      nodes {
        ...CartLine
      }
    }
  }
` as const;
