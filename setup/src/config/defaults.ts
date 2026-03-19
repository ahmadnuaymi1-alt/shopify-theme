/**
 * Default values for all store configuration fields.
 *
 * Fields that are store-specific (tokens, URLs, names, addresses, etc.)
 * default to empty strings and must be provided per-store.
 */

import type { StoreConfig } from "./store-config.js";

type StoreConfigDefaults = Omit<StoreConfig, "businessAddress"> & {
  businessAddress: StoreConfig["businessAddress"];
};

export const defaults: StoreConfigDefaults = {
  // Store-specific — no sensible defaults
  shopifyClientId: "",
  shopifyClientSecret: "",
  shopifyStoreUrl: "",
  storeName: "",
  businessEntityName: "",
  brandNiche: "",
  businessAddress: {
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  },
  supportEmail: "",
  supportPhone: "",

  // Customer service
  customerServiceHours: "Monday to Friday, 9:00 AM to 5:00 PM (EST)",
  responseTime: "1 to 2 business days",

  // Shipping
  shippingRegions: "United States",
  orderCutoffTime: "5:00 PM EST",
  handlingTime: "1-2 business days",
  transitTime: "6-8 business days",
  estimatedDeliveryTime: "7-10 business days",
  carriers: "USPS, UPS, FedEx",

  // Returns & refunds
  returnWindow: "30 days",
  refundProcessingTime: "7 business days",
  restockingFee: "$0",

  // Payment
  paymentMethods:
    "Visa, MasterCard, American Express, Discover, Diners Club, PayPal, Apple Pay, Google Pay, Shop Pay",
  currency: "United States Dollars (USD)",

  // Legal
  governingLawState: "",

  // Playwright credentials
  shopifyAdminEmail: "",
  shopifyAdminPassword: "",

  // Optional — checkout customization
  checkoutButtonColor: "#2E7D32",
  checkoutLogoPath: "",
};
