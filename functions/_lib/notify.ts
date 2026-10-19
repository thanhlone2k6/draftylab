// Lead notifications. Storage in D1 is the source of truth; a failed notification never loses a lead.
import type { Env } from './env';
import type { LeadInput } from '../../src/lib/lead-schema';

export type Fetch = typeof fetch;
export interface LeadMeta {
  id: string;
  host: string;
  /** ms since epoch */
  at: number;
}
export interface NotifyResult {
  status: 'sent' | 'failed' | 'skipped';
  /** provider message id (e.g. Resend) or `err:<http status>` — never personal data */
  ref: string;
}

const LINE_BREAKS = new RegExp("[\\r\\n\\u2028\\u2029]+", "g");
const oneLine = (s: string, max = 200) => s.replace(LINE_BREAKS, " ").trim().slice(0, max);

const METHOD_LABEL = { phone: 'Zalo / Phone', email: 'Email', instagram: 'Instagram', other: 'Khác / Other' } as const;

/** "17/10/2026 15:50 (GMT+7)" — Vietnam time, independent of the Worker's locale. */
export function formatVN(ms: number): string {
  const d = new Date(ms + 7 * 3600_000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} (GMT+7)`;
}

export const leadSubject = (name: string) => `[DFL2] New Lead – ${oneLine(name, 80)}`;

/** Plain-text email body with EVERYTHING the visitor entered. */
export function leadText(lead: LeadInput, meta: LeadMeta): string {
  return [
    'Có yêu cầu Quick Call in 10 Min mới từ website Drafty Lab (DFL2).',
    '',
    `Tên: ${oneLine(lead.name, 80)}`,
    `Liên hệ qua ${METHOD_LABEL[lead.method]}: ${oneLine(lead.contact, 120)}`,
    `Lĩnh vực kinh doanh: ${lead.industry}`,
    `Dịch vụ quan tâm: ${lead.needs.join(', ')}`,
    `Hiện trạng triển khai content: ${lead.team}`,
    `Ngân sách dự kiến: ${lead.budget || '(không chọn)'}`,
    `Ghi chú: ${lead.note ? '\n' + lead.note : '(không có)'}`,
    '',
    `Thời gian gửi: ${formatVN(meta.at)}`,
    `Mã lead: ${meta.id}`,
    `Nguồn: ${oneLine(meta.host, 100)}`,
    'Lead cũng được lưu trong Cloudflare D1 (bảng leads) để dự phòng.',
  ].join('\n');
}

/** Never throws, never logs the lead content. */
export async function notifyLead(env: Env, lead: LeadInput, meta: LeadMeta, doFetch: Fetch): Promise<NotifyResult> {
  const mode = (env.LEAD_NOTIFY || 'none').toLowerCase();
  try {
    if (mode === 'resend') {
      if (!env.RESEND_API_KEY || !env.LEAD_TO_EMAIL || !env.LEAD_FROM_EMAIL) return { status: 'skipped', ref: 'not-configured' };
      const res = await doFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `dfl2-lead-${meta.id}` },
        body: JSON.stringify({
          from: env.LEAD_FROM_EMAIL,
          to: [env.LEAD_TO_EMAIL],
          subject: leadSubject(lead.name),
          text: leadText(lead, meta),
          // Replying to the notification writes straight to the customer when they left an email address.
          ...(lead.method === 'email' ? { reply_to: lead.contact } : {}),
        }),
      });
      if (!res.ok) return { status: 'failed', ref: `err:${res.status}` };
      const data = (await res.json().catch(() => ({}))) as { id?: string };
      return { status: 'sent', ref: typeof data.id === 'string' ? data.id.slice(0, 64) : 'sent' };
    }
    if (mode === 'telegram') {
      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return { status: 'skipped', ref: 'not-configured' };
      const res = await doFetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `${leadSubject(lead.name)}\n\n${leadText(lead, meta)}`, disable_web_page_preview: true }),
      });
      return res.ok ? { status: 'sent', ref: 'telegram' } : { status: 'failed', ref: `err:${res.status}` };
    }
    return { status: 'skipped', ref: 'none' };
  } catch {
    return { status: 'failed', ref: 'err:network' };
  }
}
