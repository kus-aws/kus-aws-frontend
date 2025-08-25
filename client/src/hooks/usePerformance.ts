import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentMountTime: number;
  renderCount: number;
  lastRenderTime: number;
}

export function usePerformance(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    componentMountTime: performance.now(),
    renderCount: 0,
    lastRenderTime: performance.now(),
  });

  useEffect(() => {
    metricsRef.current.renderCount++;
    metricsRef.current.lastRenderTime = performance.now();
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      const { componentMountTime, renderCount, lastRenderTime } = metricsRef.current;
      const totalTime = lastRenderTime - componentMountTime;
      
      console.log(`[Performance] ${componentName}:`, {
        renderCount,
        totalTime: `${totalTime.toFixed(2)}ms`,
        averageRenderTime: `${(totalTime / renderCount).toFixed(2)}ms`,
      });
    }
  });

  const getMetrics = () => metricsRef.current;
  
  const resetMetrics = () => {
    metricsRef.current = {
      componentMountTime: performance.now(),
      renderCount: 0,
      lastRenderTime: performance.now(),
    };
  };

  return {
    getMetrics,
    resetMetrics,
  };
}
