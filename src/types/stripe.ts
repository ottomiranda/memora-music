import { Stripe } from '@stripe/stripe-js';

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, string>;
  active: boolean;
  price?: StripePrice;
}

export interface StripePrice {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
  };
  metadata?: Record<string, string>;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  defaultPaymentMethod?: string;
  subscriptions?: StripeSubscription[];
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  items: {
    id: string;
    priceId: string;
    quantity: number;
  }[];
  metadata?: Record<string, string>;
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'sepa_debit' | 'ideal' | 'bancontact';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  clientSecret: string;
  paymentMethodId?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  paymentStatus: 'paid' | 'unpaid';
  url?: string;
  customer?: string;
  subscription?: string;
  paymentIntent?: string;
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

export interface StripeError {
  type: 'api_error' | 'card_error' | 'validation_error';
  code?: string;
  message: string;
  decline_code?: string;
}

export interface StripeElements {
  create: (type: string, options?: Record<string, unknown>) => Promise<Stripe.Element>;
  getElement: (type: string) => Stripe.Element | null;
}

export interface StripeFormData {
  name?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  paymentMethod?: string;
  saveCard?: boolean;
}