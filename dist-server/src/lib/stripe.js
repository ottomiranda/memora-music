import { loadStripe } from '@stripe/stripe-js';
import { getEnvVar } from '@/lib/env';
const publishableKey = getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY') ??
    getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY') ??
    '';
const secretKey = getEnvVar('STRIPE_SECRET_KEY') ?? '';
const webhookSecret = getEnvVar('STRIPE_WEBHOOK_SECRET') ?? '';
function resolveAppUrl() {
    const envUrl = getEnvVar('NEXT_PUBLIC_APP_URL') ??
        getEnvVar('VITE_APP_URL');
    if (envUrl) {
        return envUrl.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, '');
    }
    return 'http://localhost:3000';
}
const appUrl = resolveAppUrl();
const config = {
    publishableKey,
    secretKey,
    webhookSecret,
    successUrl: `${appUrl}/payment/success`,
    cancelUrl: `${appUrl}/payment/cancel`
};
let stripePromise = null;
export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(config.publishableKey);
    }
    return stripePromise;
};
export const createPaymentIntent = async (amount, currency = 'usd', metadata) => {
    try {
        const response = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount, currency, metadata }),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
};
export const createCheckoutSession = async (priceId, customerId, metadata) => {
    try {
        const response = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ priceId, customerId, metadata }),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
};
export const getCustomerPaymentMethods = async (customerId) => {
    try {
        const response = await fetch(`/api/stripe/payment-methods/${customerId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
    }
};
export const updateCustomer = async (customerId, data) => {
    try {
        const response = await fetch(`/api/stripe/customers/${customerId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const responseData = await response.json();
        return responseData;
    }
    catch (error) {
        console.error('Error updating customer:', error);
        throw error;
    }
};
export const getProducts = async (active = true) => {
    try {
        const response = await fetch(`/api/stripe/products?active=${active}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};
export const getPrices = async (productId, active = true) => {
    try {
        const response = await fetch(`/api/stripe/prices?productId=${productId}&active=${active}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error fetching prices:', error);
        throw error;
    }
};
export const handlePaymentError = (error) => {
    if (error instanceof Error) {
        return {
            type: 'api_error',
            message: error.message,
            code: 'unknown_error'
        };
    }
    return {
        type: 'api_error',
        message: 'An unknown error occurred',
        code: 'unknown_error'
    };
};
export const validatePaymentForm = (data) => {
    const errors = [];
    if (!data.name) {
        errors.push('Name is required');
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Valid email is required');
    }
    if (!data.paymentMethodId) {
        errors.push('Payment method is required');
    }
    return errors;
};
//# sourceMappingURL=stripe.js.map