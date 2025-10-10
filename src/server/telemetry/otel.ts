import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { logger } from '../logging/pino';

interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  endpoint?: string;
  headers?: Record<string, string>;
  samplingRatio?: number;
}

interface TelemetryContext {
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
}

let sdk: NodeSDK | null = null;

/**
 * Inicializa o OpenTelemetry com configurações padrão e instrumentações comuns
 */
export async function initializeTelemetry(config: TelemetryConfig): Promise<void> {
  try {
    if (sdk) {
      logger.warn('OpenTelemetry já está inicializado');
      return;
    }

    const resource = resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment
    });

    const traceExporter = new OTLPTraceExporter({
      url: config.endpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      headers: config.headers,
    });

    const sampler = new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(config.samplingRatio ?? 1)
    });

    sdk = new NodeSDK({
      resource,
      spanProcessor: new BatchSpanProcessor(traceExporter),
      instrumentations: [],
      sampler
    });

    await sdk.start();
    logger.info('OpenTelemetry inicializado com sucesso', {
      serviceName: config.serviceName,
      environment: config.environment
    });

  } catch (error) {
    logger.error('Erro ao inicializar OpenTelemetry', { error });
    throw error;
  }
}

/**
 * Encerra o SDK do OpenTelemetry de forma limpa
 */
export async function shutdownTelemetry(): Promise<void> {
  try {
    if (!sdk) {
      logger.warn('OpenTelemetry não está inicializado');
      return;
    }

    await sdk.shutdown();
    sdk = null;
    logger.info('OpenTelemetry encerrado com sucesso');

  } catch (error) {
    logger.error('Erro ao encerrar OpenTelemetry', { error });
    throw error;
  }
}

/**
 * Extrai o contexto de telemetria atual
 */
export function getTelemetryContext(): TelemetryContext {
  // Implementação depende do contexto atual do OpenTelemetry
  // Retorna objeto vazio se não houver contexto
  return {};
}

/**
 * Verifica se o OpenTelemetry está inicializado
 */
export function isTelemetryInitialized(): boolean {
  return sdk !== null;
}
