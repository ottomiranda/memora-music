import { z } from 'zod';
import { StripePaymentMethod, StripePaymentIntent } from './stripe';

export const PaymentMethodSchema = z.object({
  id: z.string(),
  type: z.enum(['card', 'sepa_debit', 'ideal', 'bancontact']),
  card: z.object({
    brand: z.string(),
    last4: z.string(),
    expMonth: z.number(),
    expYear: z.number(),
  }).optional(),
  billingDetails: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum([
    'pending',
    'processing',
    'succeeded',
    'failed',
    'canceled',
    'refunded'
  ]),
  paymentMethod: PaymentMethodSchema.optional(),
  metadata: z.record(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Payment = z.infer<typeof PaymentSchema>;

export interface PaymentFormData {
  name: string;
  email: string;
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

export interface PaymentFormProps {
  amount: number;
  currency?: string;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
  savedPaymentMethods?: PaymentMethod[];
}

export interface PaymentHistoryProps {
  payments: Payment[];
  loading?: boolean;
  error?: string;
  onRefund?: (payment: Payment) => Promise<void>;
}

export interface PaymentSummaryProps {
  payment: Payment;
  showRefundButton?: boolean;
  onRefund?: () => Promise<void>;
}

export interface PaymentMethodProps {
  paymentMethod: PaymentMethod;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

export interface PaymentError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaymentResponse {
  payment: Payment;
  clientSecret?: string;
  error?: PaymentError;
}

export interface PaymentStats {
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  refundedAmount: number;
  paymentsByStatus: Record<Payment['status'], number>;
  paymentsByDay: {
    date: string;
    amount: number;
    count: number;
  }[];
}

export interface PaymentFilter {
  status?: Payment['status'];
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PaymentUpdateInput {
  status?: Payment['status'];
  metadata?: Record<string, string>;
}