/**
 * Stripe Server Configuration
 * Backend Stripe server setup for secure payment processing
 */
import Stripe from 'stripe';
import { z } from 'zod';
// Environment variables validation
const stripeEnvSchema = z.object({
    STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY é obrigatória'),
    STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET é obrigatória'),
    STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'STRIPE_PUBLISHABLE_KEY é obrigatória'),
});
// Validate environment variables
const validateStripeEnv = () => {
    try {
        return stripeEnvSchema.parse({
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
            STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
        });
    }
    catch (error) {
        console.error('[STRIPE_SERVER] Erro na validação das variáveis de ambiente:', error);
        throw new Error('Configuração do Stripe incompleta');
    }
};
// Initialize Stripe with secret key
let stripeInstance = null;
/**
 * Get Stripe server instance
 * Lazy initialization with validation
 */
export const getStripeServer = () => {
    if (!stripeInstance) {
        const env = validateStripeEnv();
        if (!env.STRIPE_SECRET_KEY.startsWith('sk_')) {
            throw new Error('STRIPE_SECRET_KEY inválida: deve começar com "sk_"');
        }
        stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
            // Use SDK default API version; avoids invalid or future date strings
            typescript: true,
            telemetry: false, // Disable telemetry for privacy
        });
        console.log('[STRIPE_SERVER] Stripe inicializado com sucesso');
    }
    return stripeInstance;
};
/**
 * Stripe webhook signature verification
 */
export const verifyWebhookSignature = (payload, signature) => {
    const env = validateStripeEnv();
    const stripe = getStripeServer();
    try {
        return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    }
    catch (error) {
        console.error('[STRIPE_SERVER] Erro na verificação do webhook:', error);
        throw new Error('Assinatura do webhook inválida');
    }
};
/**
 * Create Payment Intent
 */
export const createPaymentIntent = async (params) => {
    const stripe = getStripeServer();
    const { amount, currency = 'brl', customerId, metadata = {} } = params;
    // Validate amount
    if (amount < 50) { // Minimum 50 cents
        throw new Error('Valor mínimo de pagamento é R$ 0,50');
    }
    if (amount > 99999999) { // Maximum ~R$ 999,999.99
        throw new Error('Valor máximo de pagamento é R$ 999.999,99');
    }
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            customer: customerId,
            metadata: {
                ...metadata,
                created_at: new Date().toISOString(),
                source: 'memora_music',
            },
            automatic_payment_methods: {
                enabled: true,
            },
            // Enable payment method options
            payment_method_options: {
                card: {
                    capture_method: 'automatic',
                },
            },
        });
        console.log('[STRIPE_SERVER] Payment Intent criado:', paymentIntent.id);
        return paymentIntent;
    }
    catch (error) {
        console.error('[STRIPE_SERVER] Erro ao criar Payment Intent:', error);
        throw error;
    }
};
/**
 * Confirm Payment Intent
 */
export const confirmPaymentIntent = async (paymentIntentId) => {
    const stripe = getStripeServer();
    try {
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
        console.log('[STRIPE_SERVER] Payment Intent confirmado:', paymentIntentId);
        return paymentIntent;
    }
    catch (error) {
        console.error('[STRIPE_SERVER] Erro ao confirmar Payment Intent:', error);
        throw error;
    }
};
/**
 * Retrieve Payment Intent
 */
export const retrievePaymentIntent = async (paymentIntentId) => {
    const stripe = getStripeServer();
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent;
    }
    catch (error) {
        console.error('[STRIPE_SERVER] Erro ao recuperar Payment Intent:', error);
        throw error;
    }
};
/**
 * Create or retrieve Stripe customer
 */
export const createOrRetrieveCustomer = async (params) => {
    const stripe = getStripeServer();
    const { email, name, userId } = params;
    try {
        // First, try to find existing customer by email
        const existingCustomers = await stripe.customers.list({
            email,
            limit: 1,
        });
        if (existingCustomers.data.length > 0) {
            const customer = existingCustomers.data[0];
            console.log('[STRIPE_SERVER] Cliente existente encontrado:', customer.id);
            return customer;
        }
        // Create new customer
        const customer = await stripe.customers.create({
            email,
            name,
            metadata: {
                user_id: userId,
                created_at: new Date().toISOString(),
                source: 'memora_music',
            },
        });
        console.log('[STRIPE_SERVER] Novo cliente criado:', customer.id);
        return customer;
    }
    catch (error) {
        console.error('[STRIPE_SERVER] Erro ao criar/recuperar cliente:', error);
        throw error;
    }
};
/**
 * Stripe configuration constants
 */
export const STRIPE_CONFIG = {
    // Supported currencies
    SUPPORTED_CURRENCIES: ['brl', 'usd'],
    // Payment amounts (in cents)
    MIN_AMOUNT: 50, // R$ 0.50
    MAX_AMOUNT: 99999999, // R$ 999,999.99
    // Default currency
    DEFAULT_CURRENCY: 'brl',
    // Webhook events we handle
    WEBHOOK_EVENTS: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'customer.created',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
    ],
};
/**
 * Check Stripe connection
 */
export const testStripeConnection = async () => {
    try {
        const stripe = getStripeServer();
        // Test connection by retrieving account info
        const account = await stripe.accounts.retrieve();
        console.log('[STRIPE_SERVER] Conexão testada com sucesso. Account ID:', account.id);
        return true;
    }
    catch (error) {
        console.error('[STRIPE_SERVER] Erro ao testar conexão:', error);
        return false;
    }
};
export default getStripeServer;
//# sourceMappingURL=stripe-server.js.map