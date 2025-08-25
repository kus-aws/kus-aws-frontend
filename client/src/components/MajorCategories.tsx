import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useMemo, useCallback } from "react";

const categories = [
  {
    id: "computer-science",
    emoji: "💻",
    name: "컴퓨터공학",
    description: "프로그래밍, 알고리즘, 데이터구조",
    questions: "1,234개 질문"
  },
  {
    id: "mathematics",
    emoji: "📐",
    name: "수학",
    description: "미적분, 선형대수, 통계학",
    questions: "987개 질문"
  },
  {
    id: "economics",
    emoji: "📈",
    name: "경제학",
    description: "미시경제, 거시경제, 계량경제",
    questions: "756개 질문"
  },
  {
    id: "physics",
    emoji: "⚛️",
    name: "물리학",
    description: "역학, 전자기학, 양자물리",
    questions: "654개 질문"
  },
  {
    id: "chemistry",
    emoji: "🧪",
    name: "화학",
    description: "유기화학, 무기화학, 분석화학",
    questions: "543개 질문"
  },
  {
    id: "biology",
    emoji: "🧬",
    name: "생물학",
    description: "분자생물학, 유전학, 생태학",
    questions: "432개 질문"
  },
  {
    id: "literature",
    emoji: "📚",
    name: "문학",
    description: "현대문학, 고전문학, 비평이론",
    questions: "321개 질문"
  },
  {
    id: "history",
    emoji: "📜",
    name: "역사",
    description: "한국사, 세계사, 문화사",
    questions: "298개 질문"
  }
];

export default function MajorCategories() {
  const [, setLocation] = useLocation();

  const handleCategorySelect = useCallback((categoryId: string) => {
    setLocation(`/categories/${categoryId}`);
  }, [setLocation]);

  // Memoize categories to prevent unnecessary re-renders
  const memoizedCategories = useMemo(() => categories, []);

  return (
    <section id="categories" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            전공별 AI 튜터
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            각 전공 분야의 전문 AI가 여러분의 학습을 도와드립니다. 궁금한 분야를 선택해보세요!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {memoizedCategories.map((category) => (
            <Card
              key={category.id}
              className="bg-white border border-border-light shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => handleCategorySelect(category.id)}
              data-testid={`card-category-${category.id}`}
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                  {category.emoji}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">
                  {category.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 line-clamp-2">
                  {category.description}
                </p>
                <div className="text-xs text-primary font-medium">
                  {category.questions}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
