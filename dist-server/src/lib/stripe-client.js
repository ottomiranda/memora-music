/**
 * Stripe Client Configuration
 * Frontend Stripe client setup for secure payment processing
 */
import { loadStripe } from '@stripe/stripe-js';
// Get Stripe publishable key from environment
// Use process.env for Node.js compatibility
const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
    console.warn('[STRIPE_CLIENT] VITE_STRIPE_PUBLISHABLE_KEY não encontrada nas variáveis de ambiente');
}
// Stripe instance promise
let stripePromise;
/**
 * Get Stripe instance
 * Lazy loading of Stripe client
 */
export const getStripe = () => {
    if (!stripePromise) {
        if (!stripePublishableKey) {
            console.error('[STRIPE_CLIENT] Chave pública do Stripe não configurada');
            return Promise.resolve(null);
        }
        stripePromise = loadStripe(stripePublishableKey);
    }
    return stripePromise;
};
/**
 * Stripe configuration constants
 */
export const STRIPE_CONFIG = {
    // Appearance customization for Stripe Elements
    appearance: {
        theme: 'stripe',
        variables: {
            colorPrimary: '#6366f1',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
        },
        rules: {
            '.Input': {
                border: '1px solid #d1d5db',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            },
            '.Input:focus': {
                border: '1px solid #6366f1',
                boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
            },
        },
    },
    // Payment element options
    paymentElementOptions: {
        layout: 'tabs',
        paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
    },
};
/**
 * Validate Stripe configuration
 */
export const validateStripeConfig = () => {
    if (!stripePublishableKey) {
        console.error('[STRIPE_CLIENT] Configuração do Stripe incompleta: chave pública ausente');
        return false;
    }
    if (!stripePublishableKey.startsWith('pk_')) {
        console.error('[STRIPE_CLIENT] Chave pública do Stripe inválida: deve começar com "pk_"');
        return false;
    }
    return true;
};
/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = () => {
    return Boolean(stripePublishableKey && validateStripeConfig());
};
export default getStripe;
//# sourceMappingURL=stripe-client.js.map