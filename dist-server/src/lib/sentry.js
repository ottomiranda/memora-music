import { logger } from '@/lib/logger';
import { getEnvVar } from '@/lib/env';
let sentryInstance;
const noopTransaction = {
    setStatus: () => noopTransaction,
    finish: () => { }
};
async function loadSentry() {
    if (sentryInstance !== undefined) {
        return sentryInstance;
    }
    try {
        const moduleName = '@sentry/react';
        sentryInstance = (await import(/* @vite-ignore */ moduleName));
    }
    catch (error) {
        sentryInstance = null;
        logger.warn({
            msg: 'Sentry module not available, skipping instrumentation',
            error: error instanceof Error ? error.message : error
        });
    }
    return sentryInstance;
}
function getSentry() {
    return sentryInstance ?? null;
}
function getSentryDsn() {
    return getEnvVar('NEXT_PUBLIC_SENTRY_DSN') ?? getEnvVar('VITE_SENTRY_DSN');
}
function hasSentryConfig() {
    return Boolean(getSentryDsn());
}
export async function initializeSentry(config) {
    try {
        const dsn = getSentryDsn();
        if (!dsn) {
            logger.warn({
                msg: 'Sentry DSN not found, skipping initialization'
            });
            return;
        }
        const Sentry = await loadSentry();
        if (!Sentry) {
            return;
        }
        const integrations = [];
        if (typeof Sentry.BrowserTracing === 'function') {
            integrations.push(new Sentry.BrowserTracing({
                tracePropagationTargets: ['localhost', /^https:\/\/[^/]*\.memora\.music/]
            }));
        }
        if (typeof Sentry.Replay === 'function') {
            integrations.push(new Sentry.Replay());
        }
        Sentry.init({
            dsn,
            environment: config.environment,
            release: config.release,
            debug: config.debug,
            tracesSampleRate: 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            integrations
        });
        logger.info({
            msg: 'Sentry initialized successfully',
            environment: config.environment,
            release: config.release
        });
    }
    catch (error) {
        const appError = {
            code: 'SENTRY_INITIALIZATION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to initialize Sentry',
            stack: error instanceof Error ? error.stack : undefined
        };
        logger.error({
            msg: 'Failed to initialize Sentry',
            error: appError
        });
        throw appError;
    }
}
export function captureError(error) {
    if (!hasSentryConfig()) {
        return;
    }
    const Sentry = getSentry();
    if (!Sentry) {
        return;
    }
    const appError = error instanceof Error
        ? {
            code: error.name,
            message: error.message,
            stack: error.stack
        }
        : error;
    Sentry.captureException(error, {
        extra: {
            code: appError.code,
            details: appError.details
        }
    });
    logger.error({
        msg: 'Error captured by Sentry',
        error: appError
    });
}
export function setUser(user) {
    if (!hasSentryConfig()) {
        return;
    }
    const Sentry = getSentry();
    if (!Sentry) {
        return;
    }
    Sentry.setUser(user);
    logger.debug({
        msg: 'Sentry user context updated',
        userId: user.id
    });
}
export function setTag(key, value) {
    if (!hasSentryConfig()) {
        return;
    }
    const Sentry = getSentry();
    if (!Sentry) {
        return;
    }
    Sentry.setTag(key, value);
}
export function setExtra(key, value) {
    if (!hasSentryConfig()) {
        return;
    }
    const Sentry = getSentry();
    if (!Sentry) {
        return;
    }
    Sentry.setExtra(key, value);
}
export function startTransaction(name, op) {
    if (!hasSentryConfig()) {
        return noopTransaction;
    }
    const Sentry = getSentry();
    if (!Sentry) {
        return noopTransaction;
    }
    return Sentry.startTransaction({
        name,
        op
    });
}
export function configureScope(callback) {
    if (!hasSentryConfig()) {
        return;
    }
    const Sentry = getSentry();
    if (!Sentry) {
        return;
    }
    Sentry.configureScope(callback);
}
//# sourceMappingURL=sentry.js.map