import { logger } from '@/lib/logger';
import { getEnvVar } from '@/lib/env';
class Analytics {
    initialized = false;
    queue = [];
    userProperties = {};
    async initialize() {
        try {
            // Carrega script do Google Analytics
            await this.loadGoogleAnalytics();
            // Inicializa outros serviços de analytics se necessário
            await this.initializeCustomAnalytics();
            // Processa eventos na fila
            this.processQueue();
            this.initialized = true;
            logger.info({
                msg: 'Analytics initialized successfully'
            });
        }
        catch (error) {
            logger.error({
                msg: 'Failed to initialize analytics',
                error
            });
            throw error;
        }
    }
    async loadGoogleAnalytics() {
        const gtagId = getEnvVar('NEXT_PUBLIC_GA_ID') ??
            getEnvVar('NEXT_PUBLIC_GA_MEASUREMENT_ID') ??
            getEnvVar('VITE_GA_ID');
        if (!gtagId)
            return;
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
        script.async = true;
        document.head.appendChild(script);
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args) => {
            window.dataLayer.push(args);
        };
        window.gtag('js', new Date());
        window.gtag('config', gtagId);
    }
    async initializeCustomAnalytics() {
        // Implementar inicialização de outros serviços de analytics
    }
    processQueue() {
        while (this.queue.length > 0) {
            const event = this.queue.shift();
            if (event) {
                this.trackEvent(event);
            }
        }
    }
    setUserProperties(properties) {
        this.userProperties = {
            ...this.userProperties,
            ...properties
        };
        if (window.gtag) {
            window.gtag('set', 'user_properties', this.userProperties);
        }
        logger.debug({
            msg: 'User properties updated',
            properties: this.userProperties
        });
    }
    trackEvent(event) {
        if (!this.initialized) {
            this.queue.push(event);
            return;
        }
        if (window.gtag) {
            window.gtag('event', event.action, {
                event_category: event.category,
                event_label: event.label,
                value: event.value,
                ...this.userProperties
            });
        }
        logger.debug({
            msg: 'Analytics event tracked',
            event
        });
    }
    trackPageView(pageView) {
        if (!this.initialized) {
            return;
        }
        if (window.gtag) {
            window.gtag('event', 'page_view', {
                page_path: pageView.path,
                page_title: pageView.title,
                page_referrer: pageView.referrer
            });
        }
        logger.debug({
            msg: 'Page view tracked',
            pageView
        });
    }
    trackError(error) {
        this.trackEvent({
            type: 'error',
            category: 'Error',
            action: error.name,
            label: error.message,
            payload: {
                stack: error.stack
            },
            timestamp: Date.now()
        });
    }
    trackPerformance(metrics) {
        metrics.forEach(metric => {
            this.trackEvent({
                type: 'performance',
                category: 'Performance',
                action: metric.name,
                value: metric.duration,
                payload: {
                    entryType: metric.entryType,
                    startTime: metric.startTime
                },
                timestamp: Date.now()
            });
        });
    }
}
export const analytics = new Analytics();
export async function initializeAnalytics() {
    await analytics.initialize();
}
//# sourceMappingURL=analytics.js.map