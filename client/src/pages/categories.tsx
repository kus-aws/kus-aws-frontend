import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { majorCategories, getMajorCategoryById } from "@/data/categories";
import { MajorCategory } from "@shared/schema";

export default function Categories() {
  const [, params] = useRoute("/categories/:majorId");
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<MajorCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  useEffect(() => {
    if (params?.majorId) {
      const category = getMajorCategoryById(params.majorId);
      setSelectedCategory(category || null);
    }
  }, [params?.majorId]);

  const handleSubCategorySelect = (subId: string) => {
    setSelectedSubCategory(subId);
  };

  const handleStartChat = () => {
    if (selectedCategory && selectedSubCategory) {
      setLocation(`/chat/${selectedCategory.id}/${selectedSubCategory}`);
    }
  };

  const handleBackToHome = () => {
    setLocation("/");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setLocation("/");
  };

  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToHome}
              className="mb-4"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
            <h1 className="text-3xl font-bold text-text-primary">
              전공을 선택해주세요
            </h1>
            <p className="text-gray-600 mt-2">
              학습하고 싶은 전공 분야를 선택하여 AI 튜터와 대화를 시작하세요.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {majorCategories.map((category) => (
              <Card
                key={category.id}
                className="bg-white border border-border-light shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
                onClick={() => setLocation(`/categories/${category.id}`)}
                data-testid={`card-major-${category.id}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.emoji}
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {category.description}
                  </p>
                  <div className="text-xs text-primary font-medium">
                    {category.subCategories.length}개 세부 분야
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToCategories}
            className="mb-4"
            data-testid="button-back-categories"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            전공 목록으로 돌아가기
          </Button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="text-4xl">{selectedCategory.emoji}</div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                {selectedCategory.name}
              </h1>
              <p className="text-gray-600">
                {selectedCategory.description}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-text-primary mb-4">
            세부 분야를 선택해주세요
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {selectedCategory.subCategories.map((subCategory) => (
            <Card
              key={subCategory.id}
              className={`bg-white border-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer ${
                selectedSubCategory === subCategory.id
                  ? "border-primary bg-blue-50"
                  : "border-border-light"
              }`}
              onClick={() => handleSubCategorySelect(subCategory.id)}
              data-testid={`card-sub-${subCategory.id}`}
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {subCategory.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {subCategory.description}
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">예시 질문:</p>
                  {subCategory.sampleQuestions.slice(0, 2).map((question, index) => (
                    <p key={index} className="text-xs text-gray-500">
                      • {question}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedSubCategory && (
          <div className="text-center">
            <Button
              onClick={handleStartChat}
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              data-testid="button-start-chat"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              AI 튜터와 대화 시작하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}