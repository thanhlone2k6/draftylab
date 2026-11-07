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

export const leadSubject = (name: string, source?: LeadInput['source']) =>
  source === 'custom-skill'
    ? `[DFL2] Custom Skill request – ${oneLine(name, 80)}`
    : `[DFL2] New Lead – ${oneLine(name, 80)}`;

/** Plain-text email body with EVERYTHING the visitor entered. */
export function leadText(lead: LeadInput, meta: LeadMeta): string {
  if (lead.source === 'custom-skill') {
    return [
      'Có yêu cầu Custom Skill 500k mới từ website Drafty Lab (DFL2).',
      '',
      `Tên: ${oneLine(lead.name, 80)}`,
      `Liên hệ qua ${METHOD_LABEL[lead.method]}: ${oneLine(lead.contact, 120)}`,
      'Gói: Custom Skill Edit x Content — 500k VND / yêu cầu',
      `Ghi chú: ${lead.note ? '\n' + lead.note : '(không có)'}`,
      '',
      `Thời gian gửi: ${formatVN(meta.at)}`,
      `Mã lead: ${meta.id}`,
      `Nguồn: ${oneLine(meta.host, 100)}`,
      'Lead cũng được lưu trong Cloudflare D1 (bảng leads) để dự phòng.',
    ].join('\n');
  }
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

export interface WaitlistMeta {
  id: string;
  email: string;
  /** number shown to the visitor (48 head start included) */
  position: number;
  goal: number;
  locale: string;
  host: string;
  /** ms since epoch */
  at: number;
}

export const waitlistSubject = (position: number) => `[DFL2] Waitlist signup #${position}`;

export function waitlistText(meta: WaitlistMeta): string {
  return [
    'Có người mới đăng ký danh sách chờ cộng đồng Drafty Lab.',
    '',
    `Email: ${oneLine(meta.email, 254)}`,
    `Vị trí hiển thị: ${meta.position}/${meta.goal}`,
    `Ngôn ngữ: ${meta.locale}`,
    `Thời gian: ${formatVN(meta.at)}`,
    `Nguồn: ${oneLine(meta.host, 100)}`,
    `Mã: ${meta.id}`,
    '',
    'Trả lời email này để gửi thư cho người đăng ký.',
    'Email cũng được lưu trong Cloudflare D1 (bảng waitlist).',
  ].join('\n');
}

/** Confirmation mail to the visitor (owner, 2026-11-08 — the popup says "check your email", so one is sent). */
const WAITLIST_WELCOME: Record<string, { subject: string; lines: (m: WaitlistMeta) => string[] }> = {
  vi: {
    subject: 'Bạn đã vào danh sách chờ Drafty Lab',
    lines: (m) => [
      'Chào bạn,',
      '',
      `Mình đã nhận email ${m.email} và bạn đang ở vị trí ${m.position}/${m.goal} trong danh sách chờ cộng đồng Drafty Lab.`,
      'Khi đủ 100 người, mình mở nhóm chung để mọi người chia sẻ tài nguyên, skill và góp ý chéo cho nhau — mình sẽ gửi thư mời cho bạn.',
      '',
      'Nếu bạn không đăng ký, bạn bỏ qua email này là được.',
      '',
      '— Thành · Drafty Lab',
    ],
  },
  en: {
    subject: 'You’re on the Drafty Lab waitlist',
    lines: (m) => [
      'Hi,',
      '',
      `We got ${m.email} — you are number ${m.position}/${m.goal} on the Drafty Lab community waitlist.`,
      'When we reach 100 people, I open a shared group where everyone swaps resources, skills and feedback. I’ll send you the invite.',
      '',
      'If you did not sign up, just ignore this email.',
      '',
      '— Thanh · Drafty Lab',
    ],
  },
  fr: {
    subject: 'Vous êtes sur la liste d’attente Drafty Lab',
    lines: (m) => [
      'Bonjour,',
      '',
      `Nous avons bien reçu ${m.email} — vous êtes la personne n° ${m.position}/${m.goal} sur la liste d’attente de la communauté Drafty Lab.`,
      'À 100 personnes, j’ouvre un groupe commun pour partager ressources, skills et retours. Je vous enverrai l’invitation.',
      '',
      'Si vous n’avez rien demandé, ignorez simplement cet e-mail.',
      '',
      '— Thanh · Drafty Lab',
    ],
  },
  de: {
    subject: 'Sie stehen auf der Drafty-Lab-Warteliste',
    lines: (m) => [
      'Hallo,',
      '',
      `Wir haben ${m.email} erhalten — Sie sind Nummer ${m.position}/${m.goal} auf der Warteliste der Drafty-Lab-Community.`,
      'Bei 100 Personen öffne ich eine gemeinsame Gruppe für Materialien, Skills und Feedback. Die Einladung kommt per E-Mail.',
      '',
      'Wenn Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail einfach.',
      '',
      '— Thanh · Drafty Lab',
    ],
  },
  nl: {
    subject: 'Je staat op de wachtlijst van Drafty Lab',
    lines: (m) => [
      'Hoi,',
      '',
      `We hebben ${m.email} ontvangen — je bent nummer ${m.position}/${m.goal} op de wachtlijst van de Drafty Lab-community.`,
      'Bij 100 mensen open ik een gedeelde groep waar iedereen resources, skills en feedback deelt. De uitnodiging volgt per e-mail.',
      '',
      'Heb je je niet aangemeld? Dan kun je deze e-mail negeren.',
      '',
      '— Thanh · Drafty Lab',
    ],
  },
};

/**
 * Sends the visitor their own "you're on the list" mail. Returns whether it actually went out, so the
 * success popup never claims an email that Resend did not accept. Never throws, never logs the address.
 */
export async function notifyWaitlistWelcome(env: Env, meta: WaitlistMeta, doFetch: Fetch): Promise<boolean> {
  if ((env.LEAD_NOTIFY || 'none').toLowerCase() !== 'resend') return false;
  if (!env.RESEND_API_KEY || !env.LEAD_FROM_EMAIL) return false;
  const copy = WAITLIST_WELCOME[meta.locale] || WAITLIST_WELCOME.vi;
  try {
    const res = await doFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `dfl2-welcome-${meta.id}` },
      body: JSON.stringify({
        from: env.LEAD_FROM_EMAIL,
        to: [meta.email],
        subject: copy.subject,
        text: copy.lines(meta).join('\n'),
        ...(env.LEAD_TO_EMAIL ? { reply_to: env.LEAD_TO_EMAIL } : {}),
      }),
      // The signup response waits for this mail, so never let a stalled provider hang the request.
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Notifies the owner on every new waitlist signup so they can send the welcome mail themselves. */
export async function notifyWaitlistSignup(env: Env, meta: WaitlistMeta, doFetch: Fetch): Promise<NotifyResult> {
  const mode = (env.LEAD_NOTIFY || 'none').toLowerCase();
  try {
    if (mode === 'resend') {
      if (!env.RESEND_API_KEY || !env.LEAD_TO_EMAIL || !env.LEAD_FROM_EMAIL) return { status: 'skipped', ref: 'not-configured' };
      const res = await doFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `dfl2-waitlist-${meta.id}` },
        body: JSON.stringify({
          from: env.LEAD_FROM_EMAIL,
          to: [env.LEAD_TO_EMAIL],
          subject: waitlistSubject(meta.position),
          text: waitlistText(meta),
          // Reply goes straight to the person who just joined.
          reply_to: meta.email,
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
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `${waitlistSubject(meta.position)}\n\n${waitlistText(meta)}`, disable_web_page_preview: true }),
      });
      return res.ok ? { status: 'sent', ref: 'telegram' } : { status: 'failed', ref: `err:${res.status}` };
    }
    return { status: 'skipped', ref: 'none' };
  } catch {
    return { status: 'failed', ref: 'err:network' };
  }
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
          subject: leadSubject(lead.name, lead.source),
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
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `${leadSubject(lead.name, lead.source)}\n\n${leadText(lead, meta)}`, disable_web_page_preview: true }),
      });
      return res.ok ? { status: 'sent', ref: 'telegram' } : { status: 'failed', ref: `err:${res.status}` };
    }
    return { status: 'skipped', ref: 'none' };
  } catch {
    return { status: 'failed', ref: 'err:network' };
  }
}
