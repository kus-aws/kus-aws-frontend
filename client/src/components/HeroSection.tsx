

export default function HeroSection() {
  return (
    <section id="home" className="bg-gradient-to-br from-blue-50 to-cyan-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6">
            AI와 함께<br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              전공 공부하기
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto">
            복잡한 전공 과목도 AI 챗봇과 함께라면 쉽고 재미있게!<br />
            언제 어디서나 궁금한 것을 물어보고 즉시 답변을 받아보세요.
          </p>
        </div>
      </div>
    </section>
  );
}
