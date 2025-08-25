import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Eye, 
  Type, 
  Volume2, 
  Contrast, 
  MousePointer,
  Keyboard,
  X 
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const { preferences, updatePreferences } = useUserStore();
  const [announcement, setAnnouncement] = useState<string | null>(null);

  const announceChange = (message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(null), 3000);
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    updatePreferences({ fontSize: size });
    announceChange(`글꼴 크기가 ${size === 'small' ? '작게' : size === 'medium' ? '보통' : '크게'}로 변경되었습니다.`);
  };

  const handleHighContrastToggle = (enabled: boolean) => {
    updatePreferences({ highContrast: enabled });
    announceChange(`고대비 모드가 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
  };

  const handleReducedMotionToggle = (enabled: boolean) => {
    updatePreferences({ reducedMotion: enabled });
    announceChange(`애니메이션 효과가 ${enabled ? '감소' : '복원'}되었습니다.`);
  };

  const handleAutoCompleteToggle = (enabled: boolean) => {
    updatePreferences({ autoComplete: enabled });
    announceChange(`자동 완성이 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Screen Reader Announcements */}
      {announcement && (
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
          data-testid="accessibility-announcement"
        >
          {announcement}
        </div>
      )}

      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-describedby="accessibility-description"
        data-testid="accessibility-panel"
      >
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <CardTitle id="accessibility-title">접근성 설정</CardTitle>
              </div>
              <button
                className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-300"
                onClick={onClose}
                aria-label="접근성 설정 패널 닫기"
                data-testid="close-accessibility"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p id="accessibility-description" className="text-sm text-gray-600 dark:text-gray-400">
              화면 읽기 프로그램, 키보드 네비게이션 및 시각적 접근성을 개선하는 설정을 조정하세요.
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-8">
            {/* Visual Settings */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>시각적 설정</span>
              </h3>

              <div className="space-y-6">
                {/* Font Size */}
                <div>
                  <Label className="text-sm font-medium mb-3 block flex items-center space-x-2">
                    <Type className="w-4 h-4" />
                    <span>글꼴 크기</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                          preferences.fontSize === size 
                            ? 'bg-primary text-white' 
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleFontSizeChange(size)}
                        data-testid={`font-size-${size}`}
                        aria-pressed={preferences.fontSize === size}
                      >
                        {size === 'small' && '작게'}
                        {size === 'medium' && '보통'}
                        {size === 'large' && '크게'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="high-contrast" className="flex items-center space-x-2 cursor-pointer">
                    <Contrast className="w-4 h-4" />
                    <span>고대비 모드</span>
                  </Label>
                  <Switch
                    id="high-contrast"
                    checked={preferences.highContrast}
                    onCheckedChange={handleHighContrastToggle}
                    data-testid="high-contrast-toggle"
                    aria-describedby="high-contrast-desc"
                  />
                </div>
                <p id="high-contrast-desc" className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                  텍스트와 배경 간의 대비를 높여 가독성을 향상시킵니다.
                </p>
              </div>
            </section>

            {/* Motion & Animation */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <MousePointer className="w-5 h-5" />
                <span>모션 및 애니메이션</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reduced-motion" className="flex items-center space-x-2 cursor-pointer">
                    <span>애니메이션 효과 감소</span>
                  </Label>
                  <Switch
                    id="reduced-motion"
                    checked={preferences.reducedMotion}
                    onCheckedChange={handleReducedMotionToggle}
                    data-testid="reduced-motion-toggle"
                    aria-describedby="reduced-motion-desc"
                  />
                </div>
                <p id="reduced-motion-desc" className="text-xs text-gray-600 dark:text-gray-400 ml-0">
                  움직임에 민감하신 분들을 위해 애니메이션을 최소화합니다.
                </p>
              </div>
            </section>

            {/* Input & Navigation */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Keyboard className="w-5 h-5" />
                <span>입력 및 탐색</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-complete" className="flex items-center space-x-2 cursor-pointer">
                    <span>자동 완성</span>
                  </Label>
                  <Switch
                    id="auto-complete"
                    checked={preferences.autoComplete}
                    onCheckedChange={handleAutoCompleteToggle}
                    data-testid="auto-complete-toggle"
                    aria-describedby="auto-complete-desc"
                  />
                </div>
                <p id="auto-complete-desc" className="text-xs text-gray-600 dark:text-gray-400 ml-0">
                  질문 입력 시 관련 키워드를 자동으로 제안합니다.
                </p>
              </div>
            </section>

            {/* Keyboard Shortcuts Info */}
            <section>
              <h3 className="text-lg font-semibold mb-4">키보드 단축키</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>메시지 전송:</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span>줄바꿈:</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift + Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span>빠른 전송:</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl + Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span>입력창 포커스:</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl + K</kbd>
                </div>
                <div className="flex justify-between">
                  <span>대화 초기화:</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl + L</kbd>
                </div>
                <div className="flex justify-between">
                  <span>테마 변경:</span>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl + D</kbd>
                </div>
              </div>
            </section>

            {/* Reset Button */}
            <div className="pt-4 border-t">
              <button
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors duration-300"
                onClick={() => {
                  updatePreferences({
                    fontSize: 'medium',
                    highContrast: false,
                    reducedMotion: false,
                    autoComplete: true,
                  });
                  announceChange('모든 접근성 설정이 기본값으로 복원되었습니다.');
                }}
                data-testid="reset-accessibility"
              >
                설정 초기화
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}