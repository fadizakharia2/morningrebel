/**
 * Storefront API queries. All product facts are read from Shopify: prices,
 * variants and availability from the product, verified supplier facts from
 * metafields in the `morning_rebel` namespace, ratings from the standard
 * `reviews` namespace that Shopify review apps write to.
 *
 * Metafields must have Storefront API access enabled on their definitions,
 * otherwise Shopify returns null. See docs/SHOPIFY_SETUP.md.
 */

export const MR_METAFIELD_IDENTIFIERS = [
  {namespace: 'morning_rebel', key: 'tasting_notes'},
  {namespace: 'morning_rebel', key: 'roast_summary'},
  {namespace: 'morning_rebel', key: 'ingredients'},
  {namespace: 'morning_rebel', key: 'mushroom_blend'},
  {namespace: 'morning_rebel', key: 'caffeine'},
  {namespace: 'morning_rebel', key: 'coffee_origin'},
  {namespace: 'morning_rebel', key: 'sourcing'},
  {namespace: 'morning_rebel', key: 'lab_report_url'},
  {namespace: 'morning_rebel', key: 'brewing_steps'},
  {namespace: 'morning_rebel', key: 'net_weight'},
  {namespace: 'reviews', key: 'rating'},
  {namespace: 'reviews', key: 'rating_count'},
] as const;

const VARIANT_FRAGMENT = `#graphql
  fragment MrVariant on ProductVariant {
    id
    title
    availableForSale
    sku
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    product {
      handle
      title
    }
  }
` as const;

export const MR_PRODUCT_FRAGMENT = `#graphql
  fragment MrProduct on Product {
    id
    handle
    title
    vendor
    description
    seo {
      title
      description
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    images(first: 8) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      optionValues {
        name
      }
    }
    variants(first: 50) {
      nodes {
        ...MrVariant
      }
    }
    sellingPlanGroups(first: 1) {
      nodes {
        name
      }
    }
    metafields(
      identifiers: [
        {namespace: "morning_rebel", key: "tasting_notes"}
        {namespace: "morning_rebel", key: "roast_summary"}
        {namespace: "morning_rebel", key: "ingredients"}
        {namespace: "morning_rebel", key: "mushroom_blend"}
        {namespace: "morning_rebel", key: "caffeine"}
        {namespace: "morning_rebel", key: "coffee_origin"}
        {namespace: "morning_rebel", key: "sourcing"}
        {namespace: "morning_rebel", key: "lab_report_url"}
        {namespace: "morning_rebel", key: "brewing_steps"}
        {namespace: "morning_rebel", key: "net_weight"}
        {namespace: "reviews", key: "rating"}
        {namespace: "reviews", key: "rating_count"}
      ]
    ) {
      namespace
      key
      type
      value
    }
  }
  ${VARIANT_FRAGMENT}
` as const;

export const STOREFRONT_QUERY = `#graphql
  query MrStorefront(
    $country: CountryCode
    $language: LanguageCode
    $mediumHandle: String!
    $darkHandle: String!
    $duoHandle: String!
    $includeDuo: Boolean!
  ) @inContext(country: $country, language: $language) {
    shop {
      name
      privacyPolicy {
        handle
        title
      }
      refundPolicy {
        handle
        title
      }
      shippingPolicy {
        handle
        title
      }
      termsOfService {
        handle
        title
      }
    }
    medium: product(handle: $mediumHandle) {
      ...MrProduct
    }
    dark: product(handle: $darkHandle) {
      ...MrProduct
    }
    duo: product(handle: $duoHandle) @include(if: $includeDuo) {
      ...MrProduct
    }
    faqs: metaobjects(type: "morning_rebel_faq", first: 20) {
      nodes {
        id
        fields {
          key
          value
        }
      }
    }
  }
  ${MR_PRODUCT_FRAGMENT}
` as const;
