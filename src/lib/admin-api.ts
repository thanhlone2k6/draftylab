// One place for /admin fetch calls (AdminApp + SkillsAdmin).
export interface AdminResult {
  status: number;
  data: Record<string, any>;
}

export async function adminApi(path: string, init: RequestInit = {}): Promise<AdminResult> {
  try {
    const res = await fetch(`/api/admin/${path}`, init);
    return { status: res.status, data: await res.json() };
  } catch {
    return { status: 0, data: { ok: false, code: 'network' } };
  }
}
