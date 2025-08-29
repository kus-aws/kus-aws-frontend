import { useRef, useCallback } from 'react';

interface PerformanceMetrics {
  startTime: number;
  firstChunkTime?: number;
  lastChunkTime?: number;
  totalChunks: number;
  totalChars: number;
  averageChunkSize: number;
  streamingDuration: number;
  charsPerSecond: number;
}

export function usePerformance() {
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  const chunkTimesRef = useRef<number[]>([]);

  const startStreaming = useCallback(() => {
    metricsRef.current = {
      startTime: performance.now(),
      totalChunks: 0,
      totalChars: 0,
      averageChunkSize: 0,
      streamingDuration: 0,
      charsPerSecond: 0
    };
    chunkTimesRef.current = [];
  }, []);

  const recordChunk = useCallback((chunk: string) => {
    if (!metricsRef.current) return;

    const now = performance.now();
    const chunkSize = chunk.length;
    
    metricsRef.current.totalChunks++;
    metricsRef.current.totalChars += chunkSize;
    metricsRef.current.averageChunkSize = metricsRef.current.totalChars / metricsRef.current.totalChunks;
    
    if (!metricsRef.current.firstChunkTime) {
      metricsRef.current.firstChunkTime = now;
    }
    
    metricsRef.current.lastChunkTime = now;
    chunkTimesRef.current.push(now);
  }, []);

  const endStreaming = useCallback(() => {
    if (!metricsRef.current) return;

    const now = performance.now();
    metricsRef.current.streamingDuration = now - metricsRef.current.startTime;
    
    if (metricsRef.current.streamingDuration > 0) {
      metricsRef.current.charsPerSecond = 
        (metricsRef.current.totalChars / metricsRef.current.streamingDuration) * 1000;
    }

    // 성능 메트릭 로깅 (개발 환경에서만)
    if (import.meta.env.DEV) {
      console.log('📊 스트리밍 성능 메트릭:', {
        총_응답시간: `${(metricsRef.current.streamingDuration / 1000).toFixed(2)}초`,
        총_문자수: metricsRef.current.totalChars,
        총_청크수: metricsRef.current.totalChunks,
        평균_청크크기: metricsRef.current.averageChunkSize.toFixed(1),
        초당_문자수: metricsRef.current.charsPerSecond.toFixed(1),
        첫_청크_지연: metricsRef.current.firstChunkTime 
          ? `${((metricsRef.current.firstChunkTime - metricsRef.current.startTime) / 1000).toFixed(2)}초`
          : 'N/A'
      });
    }

    // 성능 데이터를 분석 서비스로 전송 (선택사항)
    if (metricsRef.current.totalChars > 100) { // 의미있는 응답만
      try {
        // 여기에 성능 분석 서비스 호출을 추가할 수 있습니다
        // analytics.track('streaming_performance', metricsRef.current);
      } catch (error) {
        console.warn('성능 메트릭 전송 실패:', error);
      }
    }
  }, []);

  const getMetrics = useCallback(() => metricsRef.current, []);

  const reset = useCallback(() => {
    metricsRef.current = null;
    chunkTimesRef.current = [];
  }, []);

  return {
    startStreaming,
    recordChunk,
    endStreaming,
    getMetrics,
    reset
  };
}
