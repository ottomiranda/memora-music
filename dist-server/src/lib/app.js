import { initializeAuth } from '@/server/auth/options';
import { initializeI18n } from '@/lib/i18n';
export async function initializeApp(config) {
    try {
        // Inicializa o logger apenas em ambiente server-side
        if (typeof window === 'undefined') {
            const { initializeLogging } = await import('@/server/logging/pino');
            await initializeLogging({
                level: config.debug ? 'debug' : 'info',
                environment: config.environment
            });
        }
        // Inicializa autenticação se habilitada
        if (config.features.auth) {
            await initializeAuth();
        }
        // Inicializa i18n
        await initializeI18n({
            defaultLocale: config.i18n.defaultLocale,
            locales: config.i18n.locales,
            loadPath: config.i18n.loadPath
        });
        // Inicializa Sentry se habilitado
        if (config.features.sentry) {
            const { initializeSentry } = await import('@/lib/sentry');
            await initializeSentry({
                environment: config.environment,
                release: config.version,
                debug: config.debug
            });
        }
        // Inicializa analytics se habilitado
        if (config.features.analytics) {
            const { initializeAnalytics } = await import('@/lib/analytics');
            await initializeAnalytics();
        }
        // Configura interceptors globais para requisições API
        const { setupApiInterceptors } = await import('@/lib/api');
        setupApiInterceptors({
            baseUrl: config.api.baseUrl,
            version: config.api.version,
            timeout: config.api.timeout
        });
    }
    catch (error) {
        const appError = {
            code: 'INITIALIZATION_ERROR',
            message: error instanceof Error ? error.message : 'Failed to initialize app dependencies',
            stack: error instanceof Error ? error.stack : undefined
        };
        // Se o logger já estiver inicializado, usa ele
        if (typeof window !== 'undefined' && window.console) {
            console.error('[App] Initialization error:', appError);
        }
        throw appError;
    }
}
//# sourceMappingURL=app.js.map