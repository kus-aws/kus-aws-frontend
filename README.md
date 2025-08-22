# kus-aws-frontend

Vite + React + TypeScript 기반의 프론트엔드 리포지토리입니다. 샘플 UI에는 백엔드의 `/health`, `/api/v1/echo`를 호출하는 버튼이 포함되어 있습니다.

## 요구사항
- Node.js ≥ 18 (LTS 권장)
- npm ≥ 9

## 빠른 시작
1) 의존성 설치

```
npm i
```

2) 환경 변수 설정
- `.env.example`를 복사하여 `.env` 생성
- 기본 값 예시:
```
VITE_API_BASE_URL=http://localhost:8000
```

3) 개발 서버 실행
```
npm run dev
```

## 스크립트
- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run preview`: 빌드 산출물 미리보기
- `npm run lint`: ESLint 실행

## 환경변수
- `VITE_API_BASE_URL`: 백엔드 베이스 URL (예: `http://localhost:8000`)

## 프로젝트 구조(요약)
```
kus-aws-frontend/
├─ public/
├─ src/
│  ├─ App.tsx        # 샘플 UI (/health, /api/v1/echo 호출 버튼)
│  ├─ main.tsx
│  └─ ...
├─ index.html
├─ package.json
└─ README.md
```

## 백엔드 연동 노트
- 로컬 기본 포트는 8000으로 가정합니다. FastAPI 서버가 8000에서 동작하도록 맞춰주세요.
- CORS는 백엔드에서 데모용으로 `*` 허용되어 있습니다. 운영 시 특정 오리진으로 제한하세요.

## AWS 메모
- 리전: us-east-1
- Access Key 발급 금지 → EC2/Lambda는 역할(Role) 사용
  - EC2: `SafeInstanceProfileForUser-{username}`
  - Lambda: `SafeRoleForUser-{username}`
- S3 버킷 네이밍: username 접두 필수
