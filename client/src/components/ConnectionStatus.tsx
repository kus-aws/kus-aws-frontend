import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { health } from '@/lib/api';
import { useOnline } from '@/hooks/useOnline';

export function ConnectionStatus() {
  const isOnline = useOnline();
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    const checkServerStatus = async () => {
      if (!isOnline) {
        setServerStatus('disconnected');
        return;
      }

      setServerStatus('checking');
      try {
        await health();
        setServerStatus('connected');
      } catch {
        setServerStatus('disconnected');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
        <WifiOff className="w-4 h-4" />
        <span>오프라인 상태입니다</span>
      </div>
    );
  }

  if (serverStatus === 'disconnected') {
    return (
      <div className="flex items-center space-x-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>서버 연결 중 문제가 발생했습니다</span>
      </div>
    );
  }

  if (serverStatus === 'checking') {
    return (
      <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
        <Wifi className="w-4 h-4 animate-pulse" />
        <span>연결 상태 확인 중...</span>
      </div>
    );
  }

  return null; // Connected state - don't show anything
}