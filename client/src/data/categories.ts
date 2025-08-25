import { MajorCategory } from "@shared/schema";

export const majorCategories: MajorCategory[] = [
  {
    id: "computer-science",
    emoji: "💻",
    name: "컴퓨터공학",
    description: "프로그래밍, 알고리즘, 데이터구조",
    subCategories: [
      {
        id: "programming",
        name: "프로그래밍",
        description: "각종 프로그래밍 언어와 개발 기법",
        sampleQuestions: [
          "Python에서 리스트와 튜플의 차이점은?",
          "재귀함수의 작동원리를 설명해주세요",
          "객체지향 프로그래밍의 4대 특징은?"
        ]
      },
      {
        id: "algorithms",
        name: "알고리즘",
        description: "자료구조와 알고리즘 문제 해결",
        sampleQuestions: [
          "버블정렬의 시간복잡도는?",
          "이진탐색트리의 특징을 설명해주세요",
          "동적계획법이 무엇인지 알려주세요"
        ]
      },
      {
        id: "database",
        name: "데이터베이스",
        description: "데이터베이스 설계와 SQL",
        sampleQuestions: [
          "정규화가 무엇인지 설명해주세요",
          "JOIN의 종류와 차이점은?",
          "인덱스의 역할과 장단점은?"
        ]
      },
      {
        id: "network",
        name: "네트워크",
        description: "컴퓨터 네트워크와 통신",
        sampleQuestions: [
          "OSI 7계층 모델을 설명해주세요",
          "TCP와 UDP의 차이점은?",
          "HTTP와 HTTPS의 차이점은?"
        ]
      }
    ]
  },
  {
    id: "mathematics",
    emoji: "📐",
    name: "수학",
    description: "미적분, 선형대수, 통계학",
    subCategories: [
      {
        id: "calculus",
        name: "미적분학",
        description: "극한, 미분, 적분",
        sampleQuestions: [
          "미분의 기본 공식들을 알려주세요",
          "적분의 기하학적 의미는?",
          "연쇄법칙이 무엇인지 설명해주세요"
        ]
      },
      {
        id: "linear-algebra",
        name: "선형대수",
        description: "벡터, 행렬, 고유값",
        sampleQuestions: [
          "행렬의 곱셈 방법을 알려주세요",
          "고유값과 고유벡터란?",
          "벡터의 내적과 외적의 차이는?"
        ]
      },
      {
        id: "statistics",
        name: "통계학",
        description: "확률, 분포, 추론",
        sampleQuestions: [
          "중심극한정리를 설명해주세요",
          "신뢰구간이 무엇인지 알려주세요",
          "정규분포의 특징은?"
        ]
      }
    ]
  },
  {
    id: "economics",
    emoji: "📈",
    name: "경제학",
    description: "미시경제, 거시경제, 계량경제",
    subCategories: [
      {
        id: "microeconomics",
        name: "미시경제학",
        description: "개별 경제주체의 행동",
        sampleQuestions: [
          "수요의 법칙이 무엇인지 설명해주세요",
          "탄력성의 개념을 알려주세요",
          "완전경쟁시장의 특징은?"
        ]
      },
      {
        id: "macroeconomics",
        name: "거시경제학",
        description: "국가 전체의 경제 현상",
        sampleQuestions: [
          "GDP가 무엇인지 설명해주세요",
          "인플레이션의 원인은?",
          "통화정책과 재정정책의 차이는?"
        ]
      },
      {
        id: "econometrics",
        name: "계량경제학",
        description: "경제 현상의 통계적 분석",
        sampleQuestions: [
          "회귀분석이 무엇인지 알려주세요",
          "다중공선성 문제란?",
          "시계열 데이터의 특징은?"
        ]
      }
    ]
  },
  {
    id: "physics",
    emoji: "⚛️",
    name: "물리학",
    description: "역학, 전자기학, 양자물리",
    subCategories: [
      {
        id: "mechanics",
        name: "역학",
        description: "운동과 힘의 법칙",
        sampleQuestions: [
          "뉴턴의 제1법칙을 설명해주세요",
          "운동량 보존 법칙이란?",
          "등속원운동의 특징은?"
        ]
      },
      {
        id: "electromagnetics",
        name: "전자기학",
        description: "전기와 자기 현상",
        sampleQuestions: [
          "쿨롱의 법칙을 설명해주세요",
          "전기장과 자기장의 차이는?",
          "패러데이 법칙이 무엇인지 알려주세요"
        ]
      },
      {
        id: "quantum",
        name: "양자물리",
        description: "미시세계의 물리 현상",
        sampleQuestions: [
          "플랑크 상수의 의미는?",
          "불확정성 원리를 설명해주세요",
          "파동-입자 이중성이란?"
        ]
      }
    ]
  },
  {
    id: "chemistry",
    emoji: "🧪",
    name: "화학",
    description: "유기화학, 무기화학, 분석화학",
    subCategories: [
      {
        id: "organic",
        name: "유기화학",
        description: "탄소 화합물의 화학",
        sampleQuestions: [
          "작용기가 무엇인지 설명해주세요",
          "이성질체의 종류는?",
          "치환반응과 첨가반응의 차이는?"
        ]
      },
      {
        id: "inorganic",
        name: "무기화학",
        description: "무기 화합물의 화학",
        sampleQuestions: [
          "주기율표의 주기성을 설명해주세요",
          "이온결합과 공유결합의 차이는?",
          "산화-환원 반응이란?"
        ]
      },
      {
        id: "analytical",
        name: "분석화학",
        description: "물질의 정성·정량 분석",
        sampleQuestions: [
          "크로마토그래피의 원리는?",
          "적정의 종류를 알려주세요",
          "분광법의 기본 원리는?"
        ]
      }
    ]
  },
  {
    id: "biology",
    emoji: "🧬",
    name: "생물학",
    description: "분자생물학, 유전학, 생태학",
    subCategories: [
      {
        id: "molecular",
        name: "분자생물학",
        description: "세포와 분자 수준의 생명현상",
        sampleQuestions: [
          "DNA 복제 과정을 설명해주세요",
          "단백질 합성 과정은?",
          "효소의 작용 원리를 알려주세요"
        ]
      },
      {
        id: "genetics",
        name: "유전학",
        description: "유전 현상과 유전자",
        sampleQuestions: [
          "멘델의 법칙을 설명해주세요",
          "돌연변이의 종류는?",
          "유전자 발현 조절이란?"
        ]
      },
      {
        id: "ecology",
        name: "생태학",
        description: "생물과 환경의 상호작용",
        sampleQuestions: [
          "생태계의 구성요소는?",
          "먹이사슬과 먹이그물의 차이는?",
          "생물다양성이 중요한 이유는?"
        ]
      }
    ]
  },
  {
    id: "literature",
    emoji: "📚",
    name: "문학",
    description: "현대문학, 고전문학, 비평이론",
    subCategories: [
      {
        id: "modern",
        name: "현대문학",
        description: "20세기 이후의 문학",
        sampleQuestions: [
          "모더니즘 문학의 특징은?",
          "의식의 흐름 기법이란?",
          "포스트모더니즘과 모더니즘의 차이는?"
        ]
      },
      {
        id: "classical",
        name: "고전문학",
        description: "전통 문학과 고전 작품",
        sampleQuestions: [
          "판소리의 특징을 설명해주세요",
          "한시의 형식과 특징은?",
          "고전소설의 주요 갈래는?"
        ]
      },
      {
        id: "theory",
        name: "문학이론",
        description: "문학 비평과 이론",
        sampleQuestions: [
          "형식주의 비평이란?",
          "신비평의 특징을 알려주세요",
          "해체주의 비평의 핵심은?"
        ]
      }
    ]
  },
  {
    id: "history",
    emoji: "📜",
    name: "역사",
    description: "한국사, 세계사, 문화사",
    subCategories: [
      {
        id: "korean",
        name: "한국사",
        description: "한국의 역사와 문화",
        sampleQuestions: [
          "고구려의 영토 확장 과정은?",
          "조선의 과거제도를 설명해주세요",
          "일제강점기의 저항운동은?"
        ]
      },
      {
        id: "world",
        name: "세계사",
        description: "세계 각국의 역사",
        sampleQuestions: [
          "르네상스의 특징은?",
          "산업혁명의 영향을 알려주세요",
          "두 차례 세계대전의 원인은?"
        ]
      },
      {
        id: "cultural",
        name: "문화사",
        description: "인류의 문화와 사상",
        sampleQuestions: [
          "불교 전래의 역사적 의미는?",
          "계몽사상의 핵심 내용은?",
          "종교개혁의 배경과 결과는?"
        ]
      }
    ]
  }
];

export const getMajorCategoryById = (id: string): MajorCategory | undefined => {
  if (!id || typeof id !== 'string') {
    console.warn('Invalid major category ID:', id);
    return undefined;
  }
  return majorCategories.find(category => category.id === id);
};

export const getSubCategoryById = (majorId: string, subId: string) => {
  if (!majorId || !subId || typeof majorId !== 'string' || typeof subId !== 'string') {
    console.warn('Invalid category IDs:', { majorId, subId });
    return undefined;
  }
  
  const major = getMajorCategoryById(majorId);
  if (!major) {
    console.warn('Major category not found:', majorId);
    return undefined;
  }
  
  return major.subCategories.find(sub => sub.id === subId);
};