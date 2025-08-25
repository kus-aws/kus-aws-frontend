import { Menu, Settings } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);



  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => [
    { id: "home", label: "홈", testId: "nav-home" },
    { id: "categories", label: "전공별 학습", testId: "nav-categories" },
    { id: "how-to-use", label: "사용법", testId: "nav-how-to-use" }
  ], []);

  return (
    <header className="bg-white shadow-sm border-b border-border-light sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center"
              role="img"
              aria-label="StudyAI 로고"
            >
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-text-primary">StudyAI</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-text-primary hover:text-primary transition-colors duration-300 font-medium"
                data-testid={item.testId}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Theme and Accessibility Controls */}
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
            <button
              className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-300"
              onClick={() => setAccessibilityOpen(true)}
              aria-label="접근성 설정 열기"
              data-testid="accessibility-button"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>



          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-border-light">
            <button 
              onClick={() => {
                scrollToSection("home");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-text-primary hover:text-primary hover:bg-gray-50 rounded-md transition-colors duration-300 font-medium"
              data-testid="mobile-nav-home"
            >
              홈
            </button>
            <button 
              onClick={() => {
                scrollToSection("categories");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-text-primary hover:text-primary hover:bg-gray-50 rounded-md transition-colors duration-300 font-medium"
              data-testid="mobile-nav-categories"
            >
              전공별 학습
            </button>
            <button 
              onClick={() => {
                scrollToSection("how-to-use");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-text-primary hover:text-primary hover:bg-gray-50 rounded-md transition-colors duration-300 font-medium"
              data-testid="mobile-nav-how-to-use"
            >
              사용법
            </button>
            
            {/* Mobile Theme and Accessibility Controls */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-gray-600">테마</span>
                <ThemeToggle />
              </div>
              <button
                onClick={() => {
                  setAccessibilityOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors duration-300"
                data-testid="mobile-accessibility-button"
              >
                <Settings className="w-4 h-4 mr-2" />
                접근성 설정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Panel */}
      <AccessibilityPanel 
        isOpen={accessibilityOpen} 
        onClose={() => setAccessibilityOpen(false)} 
      />
    </header>
  );
}
