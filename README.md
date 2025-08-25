# kus-aws-frontend

Vite(React/TS) + Express(WS) + Drizzle 기반의 프런트엔드 애플리케이션(풀스택 개발 모드 포함)입니다.
프런트는 `client/`, 서버 런타임은 `server/`, 공용 타입/스키마는 `shared/`에 위치합니다.

## Requirements
- Node.js ≥ 18 (LTS 권장)
- npm ≥ 9
- (선택) PostgreSQL/Neon 등 연결 시 `DATABASE_URL`

## Scripts
- `npm run dev`: 개발 서버(Express + Vite 미들웨어) 실행
- `npm run dev:client`: 프런트만 Vite 개발 서버 실행 (root=`client/`)
- `npm run dev:server`: 서버만 개발 모드(tsx) 실행
- `npm run build`: 전체 빌드 (클라이언트 → `dist/public`, 서버 → `dist/index.js`)
- `npm run build:client`: 프런트만 빌드 (`client/dist`)
- `npm start`: 프로덕션 서버 실행(`node dist/index.js`)
- `npm run check`: 타입 체크
- `npm run db:push`: Drizzle 마이그레이션 푸시

## Quick Start (로컬)
1) 의존성 설치
```
npm i
```

2) (선택) 환경 변수 설정
- 프런트(`client/.env`):  
  ```
  VITE_API_BASE_URL=http://localhost:8000
  ```
  - Amplify Hosting 사용 시 API Gateway Invoke URL로 교체
- 서버(`.env`, 선택):  
  ```
  PORT=3000
  DATABASE_URL=postgres://...
  NODE_ENV=development
  SESSION_SECRET=replace-with-strong-secret
  ```
  - 실제 필요한 변수는 구현에 따라 다를 수 있습니다. DB/세션을 쓰지 않으면 생략 가능

3) 개발 실행 (풀스택)
```
npm run dev
```
- 또는 프런트만: `npm run dev:client`  
- 또는 서버만: `npm run dev:server`

## Build & Deploy
- 전체 빌드
```
npm run build
# 결과물: dist/public (정적 파일), dist/index.js (서버)
```

- 프로덕션 실행
```
npm start
```

- Amplify Hosting(수동 업로드)로 프런트만 배포하려면:
```
npm run build:client
# 업로드 대상: client/dist
```

## 디렉토리 구조
```
kus-aws-frontend/
├─ client/                 # Vite(React/TS) 클라이언트
│  ├─ index.html
│  ├─ src/
│  │  ├─ App.tsx
│  │  ├─ components/...
│  │  ├─ pages/...
│  │  ├─ services/api.ts
│  │  ├─ hooks/, lib/, stores/ ...
│  │  └─ index.css, main.tsx
│  ├─ vite.config.ts       # root=client 로 동작
│  └─ package.json         # (개발 스크립트는 상위에서 실행)
├─ server/                 # Express/WS 서버
│  ├─ index.ts
│  ├─ routes.ts
│  ├─ vite.ts              # Vite 미들웨어 연동
│  └─ db.ts, storage.ts    # DB/스토리지 연동(선택)
├─ shared/                 # 공용 스키마/타입
│  └─ schema.ts
├─ dist/                   # 빌드 산출물(서버 ESM 번들 + public 정적파일)
│  └─ public/
├─ drizzle.config.ts       # Drizzle 설정
├─ vite.config.ts          # 상위 vite 설정(root=client, alias 설정 포함)
├─ tsconfig.json
└─ package.json
```

## 경로 별칭 (Vite)
`vite.config.ts`에 다음 alias가 설정되어 있습니다.
- `@` → `client/src`
- `@shared` → `shared`
- `@assets` → `attached_assets` (존재 시)

사용 예:
```ts
import { something } from "@/lib/utils"
import { schema } from "@shared/schema"
```

## API 연동
- 프런트 기본 베이스 URL은 `VITE_API_BASE_URL` 환경변수로 주입
- 해커톤 권장 백엔드: API Gateway → Lambda
  - 프런트 `.env`:
    ```
    VITE_API_BASE_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
    ```

## 데이터/DB (선택)
- Drizzle 사용 시 `DATABASE_URL` 설정 후
```
npm run db:push
```
- Neon 등 서버리스 Postgres를 사용할 수 있습니다. 사용하지 않는다면 DB 관련 설정은 생략 가능합니다.

## 스타일/빌드
- Tailwind CSS 및 PostCSS 설정 포함
- 빌드시 클라이언트는 `dist/public`, 서버는 `dist/index.js`로 번들됩니다.

## AWS 메모
- 리전: us-east-1
- Access Key 발급 금지, 역할(Role) 사용
- Amplify Hosting(수동 업로드): `npm run build:client` 후 `client/dist` 업로드
- S3 버킷 네이밍: username 접두 필수 (예: `username-frontend-assets`)

## 트러블슈팅
- 포트 충돌 시:
  - 서버 `PORT` 변경 또는 프런트 Vite 개발 서버 포트 지정
- API CORS:
  - 백엔드(또는 API Gateway)에서 Origin을 Amplify 도메인으로 허용
