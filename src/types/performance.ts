export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  category: 'network' | 'rendering' | 'resources' | 'interaction' | 'custom';
  timestamp: number;
  labels?: Record<string, string>;
}

export interface PerformanceOptions {
  sampleRate?: number;
  reportingInterval?: number;
  minSampleSize?: number;
  maxBufferSize?: number;
  onReport?: (metrics: PerformanceMetric[]) => void;
}

export interface GTagEvent {
  event_category?: string;
  event_label?: string;
  value?: number;
  non_interaction?: boolean;
  [key: string]: unknown;
}

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set',
      action: string,
      params?: GTagEvent
    ) => void;
  }
}