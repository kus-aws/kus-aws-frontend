

const steps = [
  {
    number: 1,
    title: "전공 선택하기",
    description: "학습하고 싶은 전공 분야를 선택하세요. 각 분야별 전문 AI 튜터가 기다리고 있어요.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
    gradientFrom: "from-primary",
    gradientTo: "to-secondary",
    accentColor: "bg-accent"
  },
  {
    number: 2,
    title: "질문 입력하기",
    description: "궁금한 것이 있으면 자연스럽게 질문해보세요. 복잡한 문제도 쉽게 설명해드려요.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
    gradientFrom: "from-secondary",
    gradientTo: "to-primary",
    accentColor: "bg-accent"
  },
  {
    number: 3,
    title: "AI 답변 받기",
    description: "즉시 맞춤형 답변을 받아보세요. 이해할 때까지 계속 질문할 수 있어요.",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250",
    gradientFrom: "from-accent",
    gradientTo: "to-orange-500",
    accentColor: "bg-primary"
  }
];

export default function HowToUseSection() {

  return (
    <section id="how-to-use" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            사용법은 간단해요!
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            3단계만 거치면 바로 AI 튜터와 함께 공부할 수 있어요
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="text-center group">
              <div className="relative mb-8">
                <div className={`w-20 h-20 bg-gradient-to-br ${step.gradientFrom} ${step.gradientTo} rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <div 
                  className={`absolute -top-2 -right-2 w-6 h-6 ${step.accentColor} rounded-full animate-bounce`}
                  style={{ animationDelay: `${index * 0.5}s` }}
                ></div>
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                {step.description}
              </p>
              <img
                src={step.image}
                alt={step.title}
                className="rounded-lg shadow-md w-full h-48 object-cover"
                data-testid={`img-step-${step.number}`}
              />
            </div>
          ))}
        </div>


      </div>
    </section>
  );
}
