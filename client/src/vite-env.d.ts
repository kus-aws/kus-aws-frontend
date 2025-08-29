/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE: string
  readonly NEXT_PUBLIC_BACKEND_BASE: string
  readonly NEXT_PUBLIC_LAMBDA_URL: string
  readonly NEXT_PUBLIC_USE_LAMBDA_DIRECT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
