import { useMemo, useRef, useCallback } from 'react';

// Interface para configuração do cache
interface CacheConfig {
  maxSize?: number;
  ttl?: number; // Time to live em milliseconds
}

// Interface para entrada do cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
}

// Hook para cache de componentes pesados
export function useComponentCache<T>(config: CacheConfig = {}) {
  const { maxSize = 50, ttl = 5 * 60 * 1000 } = config; // 5 minutos por padrão
  
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const accessOrder = useRef<string[]>([]);
  const stats = useRef({ hits: 0, misses: 0 });

  // Função para limpar entradas expiradas
  const cleanExpired = useCallback(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    cache.current.forEach((entry, key) => {
      if (now - entry.timestamp > ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      cache.current.delete(key);
      const index = accessOrder.current.indexOf(key);
      if (index > -1) {
        accessOrder.current.splice(index, 1);
      }
    });
  }, [ttl]);

  // Função para aplicar política LRU (Least Recently Used)
  const evictLRU = useCallback(() => {
    if (cache.current.size >= maxSize && accessOrder.current.length > 0) {
      const lruKey = accessOrder.current.shift();
      if (lruKey) {
        cache.current.delete(lruKey);
      }
    }
  }, [maxSize]);

  // Função para atualizar ordem de acesso
  const updateAccessOrder = useCallback((key: string) => {
    const index = accessOrder.current.indexOf(key);
    if (index > -1) {
      accessOrder.current.splice(index, 1);
    }
    accessOrder.current.push(key);
  }, []);

  // Função para obter item do cache
  const get = useCallback((key: string): T | undefined => {
    cleanExpired();
    
    const entry = cache.current.get(key);
    if (entry) {
      entry.accessCount++;
      updateAccessOrder(key);
      stats.current.hits++;
      return entry.data;
    }
    
    stats.current.misses++;
    return undefined;
  }, [cleanExpired, updateAccessOrder]);

  // Função para definir item no cache
  const set = useCallback((key: string, data: T): void => {
    cleanExpired();
    evictLRU();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1
    };

    cache.current.set(key, entry);
    updateAccessOrder(key);
  }, [cleanExpired, evictLRU, updateAccessOrder]);

  // Função para verificar se existe no cache
  const has = useCallback((key: string): boolean => {
    cleanExpired();
    return cache.current.has(key);
  }, [cleanExpired]);

  // Função para remover item do cache
  const remove = useCallback((key: string): boolean => {
    const deleted = cache.current.delete(key);
    if (deleted) {
      const index = accessOrder.current.indexOf(key);
      if (index > -1) {
        accessOrder.current.splice(index, 1);
      }
    }
    return deleted;
  }, []);

  // Função para limpar todo o cache
  const clear = useCallback(() => {
    cache.current.clear();
    accessOrder.current = [];
  }, []);

  // Função para obter estatísticas do cache
  const getStats = useCallback(() => {
    cleanExpired();
    const totalRequests = stats.current.hits + stats.current.misses;
    return {
      size: cache.current.size,
      maxSize,
      hits: stats.current.hits,
      misses: stats.current.misses,
      hitRate: totalRequests > 0 ? stats.current.hits / totalRequests : 0,
      oldestEntry: accessOrder.current[0] || null,
      newestEntry: accessOrder.current[accessOrder.current.length - 1] || null
    };
  }, [cleanExpired, maxSize]);

  return useMemo(() => ({
    get,
    set,
    has,
    remove,
    clear,
    getStats
  }), [get, set, has, remove, clear, getStats]);
}

// Hook específico para cache de resultados de computação pesada
export function useComputationCache<TArgs extends any[], TResult>(
  computeFn: (...args: TArgs) => TResult,
  keyFn: (...args: TArgs) => string,
  config?: CacheConfig
) {
  const cache = useComponentCache<TResult>(config);

  return useCallback((...args: TArgs): TResult => {
    const key = keyFn(...args);
    
    // Verifica se já existe no cache
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Computa o resultado e armazena no cache
    const result = computeFn(...args);
    cache.set(key, result);
    
    return result;
  }, [cache, computeFn, keyFn]);
}

// Hook para cache de componentes React com memoização
export function useMemoizedComponent<TProps>(
  Component: React.ComponentType<TProps>,
  keyFn: (props: TProps) => string,
  config?: CacheConfig
) {
  const cache = useComponentCache<React.ReactElement>(config);

  return useCallback((props: TProps): React.ReactElement => {
    const key = keyFn(props);
    
    // Verifica se já existe no cache
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Renderiza o componente e armazena no cache
    const element = <Component {...props} />;
    cache.set(key, element);
    
    return element;
  }, [cache, Component, keyFn]);
}