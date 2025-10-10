type LogPayload = string | {
  msg?: string;
  [key: string]: unknown;
};

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

function isObjectPayload(payload: LogPayload): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null;
}

function log(level: LogLevel, ...args: unknown[]): void {
  const consoleMethod = level === 'fatal' ? 'error' : level;
  const [first, ...rest] = args as [LogPayload?, ...unknown[]];
  const prefix = '[Memora]';

  if (typeof first === 'string') {
    console[consoleMethod](`${prefix} ${first}`, ...rest);
    return;
  }

  if (isObjectPayload(first) && first.msg) {
    const { msg, ...details } = first;
    console[consoleMethod](`${prefix} ${msg}`, Object.keys(details).length ? details : undefined, ...rest);
    return;
  }

  if (first !== undefined) {
    console[consoleMethod](prefix, first, ...rest);
    return;
  }

  console[consoleMethod](prefix, ...rest);
}

export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
  fatal: (...args: unknown[]) => log('fatal', ...args)
};
