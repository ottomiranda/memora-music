import { AppError } from '@/types/app';
import { logger } from '@/lib/logger';
import { getEnvVar } from '@/lib/env';

interface SentryConfig {
  environment: string;
  release: string;
  debug?: boolean;
}

interface SentryUser {
  id: string;
  email?: string;
  role?: string;
}

interface SentryTransaction {
  setStatus(status: string): this;
  finish(endTimestamp?: number): void;
}

type SentryModule = {
  init(options: unknown): void;
  captureException(error: unknown, hint?: { extra?: Record<string, unknown> }): void;
  setUser(user: SentryUser): void;
  setTag(key: string, value: string): void;
  setExtra(key: string, value: unknown): void;
  startTransaction(context: { name: string; op: string }): SentryTransaction;
  configureScope(callback: (scope: unknown) => void): void;
  BrowserTracing?: new (...args: unknown[]) => unknown;
  Replay?: new (...args: unknown[]) => unknown;
};

let sentryInstance: SentryModule | null | undefined;

const noopTransaction: SentryTransaction = {
  setStatus: () => noopTransaction,
  finish: () => {}
};

async function loadSentry(): Promise<SentryModule | null> {
  if (sentryInstance !== undefined) {
    return sentryInstance;
  }

  try {
    const moduleName = '@sentry/react';
    sentryInstance = (await import(/* @vite-ignore */ moduleName)) as SentryModule;
  } catch (error) {
    sentryInstance = null;
    logger.warn({
      msg: 'Sentry module not available, skipping instrumentation',
      error: error instanceof Error ? error.message : error
    });
  }

  return sentryInstance;
}

function getSentry(): SentryModule | null {
  return sentryInstance ?? null;
}

function getSentryDsn(): string | undefined {
  return getEnvVar('NEXT_PUBLIC_SENTRY_DSN') ?? getEnvVar('VITE_SENTRY_DSN');
}

function hasSentryConfig(): boolean {
  return Boolean(getSentryDsn());
}

export async function initializeSentry(config: SentryConfig): Promise<void> {
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
      integrations.push(
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', /^https:\/\/[^/]*\.memora\.music/]
        })
      );
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
  } catch (error) {
    const appError: AppError = {
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

export function captureError(error: Error | AppError): void {
  if (!hasSentryConfig()) {
    return;
  }

  const Sentry = getSentry();
  if (!Sentry) {
    return;
  }

  const appError: AppError = error instanceof Error
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

export function setUser(user: SentryUser): void {
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

export function setTag(key: string, value: string): void {
  if (!hasSentryConfig()) {
    return;
  }

  const Sentry = getSentry();
  if (!Sentry) {
    return;
  }

  Sentry.setTag(key, value);
}

export function setExtra(key: string, value: unknown): void {
  if (!hasSentryConfig()) {
    return;
  }

  const Sentry = getSentry();
  if (!Sentry) {
    return;
  }

  Sentry.setExtra(key, value);
}

export function startTransaction(name: string, op: string): SentryTransaction {
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

export function configureScope(callback: (scope: unknown) => void): void {
  if (!hasSentryConfig()) {
    return;
  }

  const Sentry = getSentry();
  if (!Sentry) {
    return;
  }

  Sentry.configureScope(callback);
}
