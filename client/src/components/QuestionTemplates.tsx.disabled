import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { getMajorCategoryById, getSubCategoryById } from '@/data/categories';

interface QuestionTemplatesProps {
  majorId: string;
  subId: string;
  onSelectTemplate: (question: string) => void;
}

const advancedTemplates = {
  'computer-science': {
    programming: [
      'Python에서 {개념}을 사용하여 {문제}를 해결하는 방법을 설명해주세요.',
      '{언어}에서 {알고리즘}을 구현하는 코드를 작성해주세요.',
      '{패턴}의 장단점과 실제 사용 사례를 알려주세요.',
      '이 코드의 시간복잡도를 분석하고 최적화 방법을 제안해주세요.',
    ],
    algorithms: [
      '{정렬 알고리즘}의 작동 원리를 단계별로 설명해주세요.',
      '동적 프로그래밍을 사용해서 {문제}를 해결하는 방법은?',
      '그래프에서 {탐색 방법}을 사용한 예제를 보여주세요.',
      '{자료구조}의 삽입, 삭제, 검색 연산의 시간복잡도는?',
    ],
    database: [
      'SQL에서 {조인 타입} 조인을 사용한 쿼리 예제를 작성해주세요.',
      '데이터베이스 정규화 {단계}의 목적과 과정을 설명해주세요.',
      '{인덱스 타입}의 특징과 언제 사용하는지 알려주세요.',
      'NoSQL과 관계형 데이터베이스의 차이점과 선택 기준은?',
    ],
    network: [
      '{프로토콜}의 작동 원리와 특징을 설명해주세요.',
      'OSI 7계층에서 {계층}의 역할과 프로토콜은?',
      '네트워크 보안에서 {보안 기법}의 원리를 알려주세요.',
      '{네트워크 문제}를 진단하고 해결하는 방법은?',
    ],
  },
  mathematics: {
    calculus: [
      '{함수}의 극한값을 구하는 과정을 단계별로 보여주세요.',
      '연쇄법칙을 사용해서 {복합함수}를 미분해주세요.',
      '{적분 방법}을 사용한 정적분 계산 예제를 보여주세요.',
      '실생활에서 {미적분 개념}이 어떻게 활용되는지 설명해주세요.',
    ],
    'linear-algebra': [
      '{행렬 연산}의 계산 과정과 의미를 설명해주세요.',
      '고유값과 고유벡터를 구하는 방법을 단계별로 보여주세요.',
      '벡터 공간에서 {개념}의 정의와 성질을 알려주세요.',
      '{변환}을 행렬로 표현하고 기하학적 의미를 설명해주세요.',
    ],
    statistics: [
      '{확률분포}의 특징과 실제 적용 사례를 알려주세요.',
      '가설검정에서 {검정 방법}을 사용하는 과정을 보여주세요.',
      '{회귀분석}의 가정과 결과 해석 방법을 설명해주세요.',
      '표본 크기가 {통계량}에 미치는 영향을 알려주세요.',
    ],
  },
  // Add more subjects as needed
};

export function QuestionTemplates({ majorId, subId, onSelectTemplate }: QuestionTemplatesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'basic' | 'advanced'>('basic');

  const major = getMajorCategoryById(majorId);
  const sub = getSubCategoryById(majorId, subId);

  if (!major || !sub) return null;

  const basicQuestions = sub.sampleQuestions;
  const advancedQuestions = advancedTemplates[majorId as keyof typeof advancedTemplates]?.[subId as any] || [];

  const handleQuestionClick = (question: string) => {
    onSelectTemplate(question);
  };

  return (
    <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">질문 템플릿</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800"
            data-testid="expand-templates"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isExpanded ? '접기' : '더보기'}
          </Button>
        </div>

        {/* Category Selector */}
        <div className="flex space-x-2 mb-3">
          <Button
            variant={selectedCategory === 'basic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('basic')}
            className="text-xs"
            data-testid="basic-questions"
          >
            기본 질문
          </Button>
          <Button
            variant={selectedCategory === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('advanced')}
            className="text-xs"
            data-testid="advanced-questions"
          >
            심화 질문
          </Button>
        </div>

        {/* Question List */}
        <div className="space-y-2">
          {selectedCategory === 'basic' ? (
            basicQuestions.slice(0, isExpanded ? undefined : 3).map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuestionClick(question)}
                className="w-full text-left justify-start h-auto p-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border-blue-200 dark:border-blue-700 text-gray-700 dark:text-gray-300"
                data-testid={`template-basic-${index}`}
              >
                <Badge variant="secondary" className="mr-2 text-xs">기본</Badge>
                <span className="text-sm">{question}</span>
              </Button>
            ))
          ) : (
            advancedQuestions.slice(0, isExpanded ? undefined : 3).map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuestionClick(question)}
                className="w-full text-left justify-start h-auto p-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border-blue-200 dark:border-blue-700 text-gray-700 dark:text-gray-300"
                data-testid={`template-advanced-${index}`}
              >
                <Badge variant="default" className="mr-2 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">심화</Badge>
                <span className="text-sm">{question}</span>
              </Button>
            ))
          )}
        </div>

        {/* Show more indicator */}
        {!isExpanded && (
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              {selectedCategory === 'basic' ? basicQuestions.length : advancedQuestions.length}개 템플릿 중 3개 표시
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}