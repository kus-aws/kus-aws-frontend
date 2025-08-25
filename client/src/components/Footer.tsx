export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold text-text-primary">StudyAI</span>
          </div>
          
          {/* Copyright */}
          <p className="text-gray-600 text-sm mb-2">
            © 2025 kus-aws-ai team 3. All rights reserved.
          </p>
          
          {/* Development Team */}
          <p className="text-gray-500 text-xs">
            Developed with by 유동남, 우성종, 유시온, 이정윤, 조여정
          </p>
        </div>
      </div>
    </footer>
  );
}
