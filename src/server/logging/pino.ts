import pino from 'pino';
import { AppError } from '@/types/app';

interface LogContext {
  [key: string]: unknown;
}

interface LogOptions {
  level?: pino.LevelWithSilent;
  redact?: string[];
  timestamp?: boolean;
  base?: Record<string, unknown>;
  messageKey?: string;
  formatters?: {
    level?: (label: string, number: number) => object;
    bindings?: (bindings: pino.Bindings) => object;
    log?: (object: object) => object;
  };
}

interface LogMessage {
  msg: string;
  error?: AppError | Error;
  context?: LogContext;
  [key: string]: unknown;
}

interface Logger extends pino.Logger {
  debug(msg: LogMessage): void;
  info(msg: LogMessage): void;
  warn(msg: LogMessage): void;
  error(msg: LogMessage): void;
  fatal(msg: LogMessage): void;
}

const defaultOptions: LogOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'cookie',
    '*.password',
    '*.token',
    '*.access_token',
    '*.refresh_token',
    '*.authorization',
    '*.cookie'
  ],
  timestamp: true,
  messageKey: 'msg',
  formatters: {
    level: (label) => ({ level: label }),
    bindings: () => ({}),
    log: (obj) => {
      // Formatar erros de forma consistente
      if (obj.error instanceof Error) {
        const error = obj.error;
        obj.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error as AppError).code ? { code: (error as AppError).code } : {},
          ...(error as AppError).details ? { details: (error as AppError).details } : {}
        };
      }
      return obj;
    }
  },
  base: {
    env: process.env.NODE_ENV,
    service: 'memora-music'
  }
};

// Criar instância do logger com opções customizadas
export const logger: Logger = pino(defaultOptions) as Logger;

// Função auxiliar para criar um logger com contexto
export function createContextLogger(context: LogContext): Logger {
  return logger.child({ context }) as Logger;
}

// Função auxiliar para criar um logger com nível customizado
export function createLevelLogger(level: pino.LevelWithSilent): Logger {
  return logger.child({ level }) as Logger;
}

// Função auxiliar para criar um logger com opções customizadas
export function createCustomLogger(options: Partial<LogOptions>): Logger {
  return pino({ ...defaultOptions, ...options }) as Logger;
}

// Função auxiliar para formatar erro para log
export function formatError(error: Error | AppError): object {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as AppError).code ? { code: (error as AppError).code } : {},
      ...(error as AppError).details ? { details: (error as AppError).details } : {}
    };
  }
  return error;
}

// Exportar tipos para uso em outros módulos
export type { Logger, LogContext, LogOptions, LogMessage };

interface LoggingConfig {
  level?: pino.LevelWithSilent;
  environment?: string;
}

export async function initializeLogging(config: LoggingConfig = {}): Promise<void> {
  try {
    const options: LogOptions = {
      ...defaultOptions,
      level: config.level || defaultOptions.level,
      base: {
        ...defaultOptions.base,
        env: config.environment || process.env.NODE_ENV
      }
    };

    // Recria o logger com as novas opções
    Object.assign(logger, pino(options));

    logger.info({
      msg: 'Logging initialized successfully',
      level: options.level,
      environment: config.environment || process.env.NODE_ENV
    });
  } catch (error) {
    console.error('[Logging] Failed to initialize:', error);
    throw error;
  }
}