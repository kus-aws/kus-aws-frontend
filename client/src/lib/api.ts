// src/lib/api.ts
export const BASE = (import.meta.env.NEXT_PUBLIC_BACKEND_BASE || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function mustBase() {
  if (!BASE) throw new Error('백엔드 주소 미설정: .env(또는 Vercel env)의 NEXT_PUBLIC_BACKEND_BASE를 확인하세요.');
}

export async function health() {
  mustBase();
  const r = await fetch(`${BASE}/health`, { credentials: 'omit' });
  // 백엔드가 "ok" (문자열) 반환 → JSON 아닐 수 있으니 방어
  try { return await r.json(); } catch { return 'ok'; }
}

type ChatResp = { aiResponse: string; conversationId: string; suggestions?: string[] | null };

function isChatResp(x: any): x is ChatResp {
  return x && typeof x.aiResponse === 'string' && typeof x.conversationId === 'string';
}

export async function chat(body: {
  userQuestion: string; major: string; subField: string;
  conversationId?: string; followupMode?: 'never' | 'single' | 'multi'; suggestCount?: number;
}): Promise<ChatResp> {
  mustBase();
  const r = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit',
  });
  
  if (!r.ok) {
    console.error(`[chat] HTTP ${r.status} ${r.statusText}`);
    const errorText = await r.text().catch(() => 'No error text');
    console.error('[chat] Error response:', errorText);
    return { 
      aiResponse: `죄송합니다. 서버 오류가 발생했습니다 (${r.status}). 잠시 후 다시 시도해주세요.`, 
      conversationId: body.conversationId ?? 'unknown', 
      suggestions: [] 
    };
  }
  
  const j = await r.json().catch(() => null);
  if (!isChatResp(j)) {
    console.warn('[chat] invalid shape:', j);
    return { aiResponse: '죄송합니다. 일시적인 오류가 발생했습니다.', conversationId: body.conversationId ?? 'unknown', suggestions: [] };
  }
  if (!Array.isArray(j.suggestions)) j.suggestions = [];
  return j;
}

export async function fetchSuggestions(body: {
  conversationId: string; major: string; subField: string; suggestCount: number;
}): Promise<string[]> {
  mustBase();
  const r = await fetch(`${BASE}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit',
  });
  const j = await r.json().catch(() => ({ suggestions: [] }));
  return Array.isArray(j?.suggestions) ? j.suggestions : [];
}

// 유틸: 백엔드 사용 전 점검용
export async function ensureBackend() {
  console.log('[BASE from env]', import.meta.env.NEXT_PUBLIC_BACKEND_BASE);
  console.log('[BASE after norm]', BASE);
  if (!BASE) throw new Error('백엔드 주소 미설정: .env(또는 Vercel env)의 NEXT_PUBLIC_BACKEND_BASE를 확인하세요.');
  try {
    const h = await health();
    console.log('[health ok]', h);
  } catch (e) {
    console.warn('⚠️ Backend health check failed:', e);
  }
}

// Legacy compatibility exports
export const api = {
  health,
  chat,
  faq: async (subField: string) => ({ faqs: [] }), // Placeholder
};

export default { health, chat, fetchSuggestions, ensureBackend };