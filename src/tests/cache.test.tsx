import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useComponentCache } from '../hooks/useComponentCache';
import { useMemo, useCallback } from 'react';
import React from 'react';

// Mock component for testing
const TestComponent: React.FC<{ value: number }> = ({ value }) => {
  return <div data-testid="test-component">{value}</div>;
};

describe('Cache System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useComponentCache', () => {
    it('should store and retrieve cached values', () => {
      const { result } = renderHook(() => useComponentCache({ maxSize: 5, ttl: 1000 }));
      
      act(() => {
        result.current.set('key1', 'value1');
      });
      
      expect(result.current.get('key1')).toBe('value1');
      expect(result.current.has('key1')).toBe(true);
    });

    it('should respect maxSize limit with LRU eviction', () => {
      const { result } = renderHook(() => useComponentCache({ maxSize: 2, ttl: 1000 }));
      
      act(() => {
        result.current.set('key1', 'value1');
        result.current.set('key2', 'value2');
        result.current.set('key3', 'value3'); // Should evict key1
      });
      
      expect(result.current.has('key1')).toBe(false);
      expect(result.current.has('key2')).toBe(true);
      expect(result.current.has('key3')).toBe(true);
    });

    it('should handle TTL expiration', async () => {
      const { result } = renderHook(() => useComponentCache({ maxSize: 5, ttl: 50 }));
      
      act(() => {
        result.current.set('key1', 'value1');
      });
      
      expect(result.current.get('key1')).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(result.current.get('key1')).toBeUndefined();
    });

    it('should provide cache statistics', () => {
      const { result } = renderHook(() => useComponentCache({ maxSize: 5, ttl: 1000 }));
      
      act(() => {
        result.current.set('key1', 'value1');
        result.current.get('key1'); // hit
        result.current.get('key2'); // miss
      });
      
      const stats = result.current.getStats();
      expect(stats.size).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should clear cache', () => {
      const { result } = renderHook(() => useComponentCache({ maxSize: 5, ttl: 1000 }));
      
      act(() => {
        result.current.set('key1', 'value1');
        result.current.set('key2', 'value2');
      });
      
      expect(result.current.getStats().size).toBe(2);
      
      act(() => {
        result.current.clear();
      });
      
      expect(result.current.getStats().size).toBe(0);
    });
  });

  describe('useComputationCache (simulated)', () => {
    it('should cache computation results', () => {
      const expensiveComputation = vi.fn((x: number) => x * 2);
      
      const { result } = renderHook(() => {
        const cache = useComponentCache<number>({ maxSize: 5, ttl: 1000 });
        
        return useCallback((input: number) => {
           const key = `computation_${input}`;
           const cached = cache.get(key);
           
           if (cached !== undefined) {
             return cached;
           }
          
          const computed = expensiveComputation(input);
          cache.set(key, computed);
          return computed;
        }, [cache]);
      });
      
      // First call should execute computation
      const result1 = result.current(5);
      expect(result1).toBe(10);
      expect(expensiveComputation).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      const result2 = result.current(5);
      expect(result2).toBe(10);
      expect(expensiveComputation).toHaveBeenCalledTimes(1);
      
      // Different input should execute computation again
      const result3 = result.current(3);
      expect(result3).toBe(6);
      expect(expensiveComputation).toHaveBeenCalledTimes(2);
    });

    it('should handle string-based caching', () => {
      const computation = vi.fn((str: string) => str.toUpperCase());
      
      const { result } = renderHook(() => {
        const cache = useComponentCache<string>({ maxSize: 5, ttl: 1000 });
        
        return useCallback((input: string) => {
           const key = `string_${input}`;
           const cached = cache.get(key);
           
           if (cached !== undefined) {
             return cached;
           }
          
          const computed = computation(input);
          cache.set(key, computed);
          return computed;
        }, [cache]);
      });
      
      const result1 = result.current('hello');
      expect(result1).toBe('HELLO');
      expect(computation).toHaveBeenCalledTimes(1);
      
      // Same input should use cache
      const result2 = result.current('hello');
      expect(result2).toBe('HELLO');
      expect(computation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Memoization (simulated)', () => {
    it('should cache component-like data', () => {
      const { result } = renderHook(() => {
        const cache = useComponentCache<{ type: string; props: any }>({ maxSize: 5, ttl: 1000 });
        
        return useCallback((componentType: string, props: any) => {
           const key = `${componentType}_${JSON.stringify(props)}`;
           const cached = cache.get(key);
           
           if (cached !== undefined) {
             return cached;
           }
          
          const componentData = { type: componentType, props };
          cache.set(key, componentData);
          return componentData;
        }, [cache]);
      });
      
      const component1 = result.current('TestComponent', { value: 1 });
      expect(component1).toEqual({ type: 'TestComponent', props: { value: 1 } });
      
      // Same props should return cached data
      const component2 = result.current('TestComponent', { value: 1 });
      expect(component1).toBe(component2);
      
      // Different props should return new data
      const component3 = result.current('TestComponent', { value: 2 });
      expect(component3).not.toBe(component1);
      expect(component3).toEqual({ type: 'TestComponent', props: { value: 2 } });
    });

    it('should handle complex component props', () => {
      const { result } = renderHook(() => {
        const cache = useComponentCache<string>({ maxSize: 5, ttl: 1000 });
        
        return useCallback((props: { value: number; label: string }) => {
           const key = `component_${props.value}_${props.label}`;
           const cached = cache.get(key);
           
           if (cached !== undefined) {
             return cached;
           }
          
          const rendered = `${props.label}: ${props.value}`;
          cache.set(key, rendered);
          return rendered;
        }, [cache]);
      });
      
      const result1 = result.current({ value: 1, label: 'Count' });
      expect(result1).toBe('Count: 1');
      
      // Same props should return cached result
      const result2 = result.current({ value: 1, label: 'Count' });
      expect(result1).toBe(result2);
      
      // Different props should return new result
      const result3 = result.current({ value: 1, label: 'Number' });
      expect(result3).not.toBe(result1);
      expect(result3).toBe('Number: 1');
    });
  });

  describe('Cache Performance', () => {
    it('should handle large number of cache operations efficiently', () => {
      const { result } = renderHook(() => useComponentCache({ maxSize: 1000, ttl: 5000 }));
      
      const startTime = performance.now();
      
      act(() => {
        // Perform many cache operations
        for (let i = 0; i < 1000; i++) {
          result.current.set(`key${i}`, `value${i}`);
        }
        
        for (let i = 0; i < 1000; i++) {
          result.current.get(`key${i}`);
        }
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
      
      const stats = result.current.getStats();
      expect(stats.size).toBe(1000);
      expect(stats.hits).toBe(1000);
    });

    it('should cleanup expired entries efficiently', async () => {
      const { result } = renderHook(() => useComponentCache({ maxSize: 100, ttl: 50 }));
      
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.set(`key${i}`, `value${i}`);
        }
      });
      
      expect(result.current.getStats().size).toBe(50);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Access cache to trigger cleanup
      act(() => {
        result.current.get('nonexistent');
      });
      
      expect(result.current.getStats().size).toBe(0);
    });
  });
});