function isObjectPayload(payload) {
    return typeof payload === 'object' && payload !== null;
}
function log(level, ...args) {
    const consoleMethod = level === 'fatal' ? 'error' : level;
    const [first, ...rest] = args;
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
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
    fatal: (...args) => log('fatal', ...args)
};
//# sourceMappingURL=logger.js.map