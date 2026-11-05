'use client';
// /admin: sign in with a code sent to the owner's Gmail, then add, edit, hide or delete Community posts.
// Vietnamese only, because only the owner uses it. Security lives on the server (functions/_lib/admin-auth.ts).
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { communityPath } from '../../i18n/config';
import { adminApi as api } from '../../lib/admin-api';
import AdminLightbox from './AdminLightbox';
import CoverField from './CoverField';
import SkillsAdmin from './SkillsAdmin';

interface Post {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  status: 'published' | 'hidden';
  createdAt: number;
  sortOrder: number | null;
}

const ERRORS: Record<string, string> = {
  wrong: 'Mã không đúng hoặc đã hết hạn.',
  locked: 'Đăng nhập đang tạm khoá vì nhập sai nhiều lần. Hãy thử lại sau.',
  cooldown: 'Vừa gửi mã xong. Đợi một chút rồi gửi lại.',
  too_many: 'Đã gửi quá nhiều mã trong 1 giờ. Hãy thử lại sau.',
  email_failed: 'Chưa gửi được email. Hãy thử lại sau ít phút.',
  title: 'Bạn chưa nhập tiêu đề.',
  url: 'Link chưa đúng. Link cần bắt đầu bằng https://',
  image: 'Bạn chưa chọn ảnh.',
  image_type: 'File này không phải ảnh JPG, PNG hoặc WebP.',
  image_too_large: 'Ảnh quá nặng. Hãy chọn ảnh khác.',
  date: 'Ngày đăng chưa đúng.',
  ids: 'Thứ tự gửi lên không hợp lệ.',
  bad_json: 'Dữ liệu gửi lên không hợp lệ.',
  not_found: 'Bài này không còn tồn tại.',
};
const errorText = (code?: string) => (code && ERRORS[code]) || 'Có lỗi xảy ra. Hãy thử lại.';

/** `2026-11-05` for <input type="date">, from the stored unix milliseconds (local calendar day). */
const toDateValue = (ms?: number) => {
  const d = new Date(ms ?? Date.now());
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};


function Login({ onDone }: { onDone: () => void }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const send = async () => {
    setBusy(true);
    setError('');
    const { status, data } = await api('login/request', { method: 'POST' });
    setBusy(false);
    if (status === 200) {
      setSent(true);
      setCode('');
      setWait(60);
      requestAnimationFrame(() => input.current?.focus());
      return;
    }
    if (data.code === 'cooldown') {
      setSent(true);
      setWait(Number(data.retryAfter) || 60);
    }
    setError(errorText(data.code));
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { status, data } = await api('login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, remember }),
    });
    setBusy(false);
    if (status === 200) return onDone();
    setCode('');
    setError(errorText(data.code));
    input.current?.focus();
  };

  return (
    <main className="adm adm--login">
      <div className="adm-card">
        <img src="/media/brand/logo.png" alt="Drafty Lab" width="44" height="44" className="adm-logo" />
        <h1>Quản trị Cộng đồng</h1>
        {!sent ? (
          <>
            <p className="adm-muted">Bấm nút để nhận mã đăng nhập 6 số qua Gmail của bạn.</p>
            <button type="button" className="adm-btn adm-btn--primary" disabled={busy} onClick={() => void send()}>
              {busy ? 'Đang gửi…' : 'Gửi mã về Gmail'}
            </button>
          </>
        ) : (
          <form onSubmit={(e) => void verify(e)}>
            <p className="adm-muted">Mở Gmail và nhập mã vừa nhận. Mã dùng được trong 10 phút.</p>
            <label className="adm-field">
              <span>Mã 6 số</span>
              <input
                ref={input}
                className="adm-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Ghi nhớ thiết bị này 90 ngày. Bỏ chọn nếu đây là máy dùng chung.</span>
            </label>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={busy || code.length !== 6}>
              {busy ? 'Đang kiểm tra…' : 'Đăng nhập'}
            </button>
            <button type="button" className="adm-btn adm-btn--ghost" disabled={busy || wait > 0} onClick={() => void send()}>
              {wait > 0 ? `Gửi lại mã sau ${wait} giây` : 'Gửi lại mã'}
            </button>
          </form>
        )}
        {error && <p className="adm-error" role="alert">{error}</p>}
      </div>
    </main>
  );
}

function PostForm({ editing, onSaved, onCancel }: { editing: Post | null; onSaved: (message: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [url, setUrl] = useState(editing?.url ?? '');
  const [date, setDate] = useState(toDateValue(editing?.createdAt));
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!editing && !imageBlob) return setError(errorText('image'));
    setBusy(true);
    const form = new FormData();
    form.set('title', title);
    form.set('description', description);
    form.set('url', url);
    // Noon local time on purpose: midnight in Vietnam can still be "yesterday" in another timezone.
    // Editing without touching the date keeps the original timestamp; a new post dated today uses the
    // real clock so two posts on the same day still have a stable newest-first order.
    const stamp = editing
      ? (date !== toDateValue(editing.createdAt) ? new Date(`${date}T12:00:00`).getTime() : NaN)
      : (date === toDateValue() ? Date.now() : new Date(`${date}T12:00:00`).getTime());
    if (Number.isFinite(stamp)) form.set('createdAt', String(stamp));
    if (imageBlob) form.set('image', imageBlob, 'image');
    const { status, data } = await api(editing ? `posts/${editing.id}` : 'posts', { method: 'POST', body: form });
    setBusy(false);
    if (status === 200 || status === 201) return onSaved(editing ? 'Đã lưu thay đổi.' : 'Đã đăng lên trang Cộng đồng.');
    setError(errorText(data.code));
  };

  return (
    <form className="adm-card adm-form" onSubmit={(e) => void submit(e)}>
      <h2>{editing ? 'Sửa bài' : 'Thêm tài liệu mới'}</h2>
      <CoverField initialUrl={editing?.image ?? null} onChange={setImageBlob} />
      <label className="adm-field">
        <span>Tiêu đề</span>
        <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="adm-field">
        <span>Mô tả ngắn <em>(không bắt buộc)</em></span>
        <input maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="adm-field">
        <span>Link tài liệu</span>
        <input required type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="adm-field">
        <span>Ngày đăng <em>(ngày hiện trên thẻ)</em></span>
        <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      {error && <p className="adm-error" role="alert">{error}</p>}
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Đăng bài'}
        </button>
        {editing && <button type="button" className="adm-btn adm-btn--ghost" disabled={busy} onClick={onCancel}>Huỷ</button>}
      </div>
    </form>
  );
}

function Dashboard({ onSignedOut }: { onSignedOut: () => void }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [limit, setLimit] = useState(3);
  const [editing, setEditing] = useState<Post | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [devices, setDevices] = useState<number | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  useEffect(() => {
    void api('devices').then(({ status, data }) => {
      if (status === 200) setDevices(data.count);
    });
  }, []);

  const load = useCallback(async () => {
    const { status, data } = await api('posts');
    if (status === 401) return onSignedOut();
    if (status !== 200) return setError(errorText(data.code));
    setPosts(data.items);
    setLimit(data.publicLimit);
  }, [onSignedOut]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (run: Promise<{ status: number; data: Record<string, any> }>, message: string) => {
    setNotice('');
    setError('');
    const { status, data } = await run;
    if (status === 401) return onSignedOut();
    if (status !== 200) return setError(errorText(data.code));
    setNotice(message);
    void load();
  };

  const toggle = (post: Post) => {
    const form = new FormData();
    form.set('status', post.status === 'hidden' ? 'published' : 'hidden');
    void act(api(`posts/${post.id}`, { method: 'POST', body: form }), post.status === 'hidden' ? 'Đã hiện lại bài.' : 'Đã ẩn bài.');
  };
  const remove = (post: Post) => {
    if (!window.confirm(`Xoá hẳn bài "${post.title}"? Không thể khôi phục.`)) return;
    if (editing?.id === post.id) setEditing(null);
    void act(api(`posts/${post.id}`, { method: 'DELETE' }), 'Đã xoá bài.');
  };
  const signOut = async () => {
    await api('logout', { method: 'POST' });
    onSignedOut();
  };

  // Order of the cards on the public page: dragging writes the whole list, then reloads it.
  const persistOrder = (next: Post[]) => {
    setPosts(next);
    void act(
      api('posts/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      }),
      'Đã lưu thứ tự hiển thị.',
    );
  };

  const dropOn = (targetId: string) => {
    const fromId = dragId;
    setDragId(null);
    setOverId(null);
    if (!fromId || fromId === targetId || !posts) return;
    const next = [...posts];
    const from = next.findIndex((p) => p.id === fromId);
    const to = next.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
  };

  const moveBy = (index: number, delta: number) => {
    if (!posts) return;
    const to = index + delta;
    if (to < 0 || to >= posts.length) return;
    const next = [...posts];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
  };

  const revokeAll = async () => {
    if (!window.confirm('Đăng xuất tất cả thiết bị, kể cả máy này? Lần sau cần nhập mã mới từ Gmail. Bài đăng không bị ảnh hưởng.')) return;
    const { status, data } = await api('devices/revoke-all', { method: 'POST' });
    if (status === 200) return onSignedOut();
    setError(errorText(data.code));
  };

  // The public page shows the newest published posts only; tell the owner which ones those are.
  const live = new Set((posts ?? []).filter((p) => p.status === 'published').slice(0, limit).map((p) => p.id));
  const badge = (p: Post) => (p.status === 'hidden' ? 'Đã ẩn' : live.has(p.id) ? 'Đang hiện trên web' : 'Đã lưu, chưa hiện');

  return (
    <main className="adm">
      <header className="adm-top">
        <h1>Quản trị Cộng đồng</h1>
        <div className="adm-row">
          <a className="adm-btn adm-btn--ghost" href={communityPath('vi')} target="_blank" rel="noopener">Xem trang</a>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={() => void signOut()}>Đăng xuất</button>
        </div>
      </header>

      <PostForm
        key={`new-${formKey}`}
        editing={null}
        onCancel={() => {}}
        onSaved={(message) => {
          setFormKey((k) => k + 1);
          setError('');
          setNotice(message);
          void load();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {editing && (
        <AdminLightbox label="Sửa bài" onClose={() => setEditing(null)}>
          <PostForm
            key={editing.id}
            editing={editing}
            onCancel={() => setEditing(null)}
            onSaved={(message) => {
              setEditing(null);
              setError('');
              setNotice(message);
              void load();
            }}
          />
        </AdminLightbox>
      )}

      <div aria-live="polite">
        {notice && <p className="adm-notice">{notice}</p>}
        {error && <p className="adm-error">{error}</p>}
      </div>

      <section>
        <h2>Bài đã đăng</h2>
        <p className="adm-muted">
          Trang Cộng đồng hiện {limit} thẻ đầu (4 thẻ trên điện thoại), rồi tới nút “Xem thêm tài liệu” để mở toàn bộ.
          Kéo thẻ bên dưới — hoặc dùng nút ↑ ↓ — để chọn thứ tự hiển thị.
        </p>
        {posts === null && <p className="adm-muted">Đang tải…</p>}
        {posts?.length === 0 && <p className="adm-muted">Chưa có bài nào.</p>}
        <ul className="adm-list">
          {posts?.map((p, i) => (
            <li
              key={p.id}
              className={`adm-item${dragId === p.id ? ' is-dragging' : ''}${overId === p.id ? ' is-over' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragId(p.id);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', p.id);
              }}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (overId !== p.id) setOverId(p.id);
              }}
              onDragLeave={() => setOverId((v) => (v === p.id ? null : v))}
              onDrop={(e) => { e.preventDefault(); dropOn(p.id); }}
            >
              <span className="adm-item__handle" aria-hidden="true">⠿</span>
              <img src={p.image} alt="" loading="lazy" draggable={false} />
              <div className="adm-item__body">
                <strong>{p.title}</strong>
                <a href={p.url} target="_blank" rel="noopener noreferrer">{p.url}</a>
                <span className={`adm-badge${live.has(p.id) ? ' is-live' : ''}`}>{badge(p)} · {new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                <div className="adm-row">
                  <button type="button" className="adm-btn adm-btn--small adm-btn--move" onClick={() => moveBy(i, -1)} disabled={i === 0} aria-label={`Đưa “${p.title}” lên`}>↑</button>
                  <button type="button" className="adm-btn adm-btn--small adm-btn--move" onClick={() => moveBy(i, 1)} disabled={i === posts.length - 1} aria-label={`Đưa “${p.title}” xuống`}>↓</button>
                  <button type="button" className="adm-btn adm-btn--small" onClick={() => setEditing(p)}>Sửa</button>
                  <button type="button" className="adm-btn adm-btn--small" onClick={() => toggle(p)}>{p.status === 'hidden' ? 'Hiện lại' : 'Ẩn'}</button>
                  <button type="button" className="adm-btn adm-btn--small adm-btn--danger" onClick={() => remove(p)}>Xoá</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <SkillsAdmin onSignedOut={onSignedOut} />

      <section className="adm-card adm-danger">
        <h2>Thiết bị đã đăng nhập</h2>
        <p className="adm-muted">
          {devices === null ? 'Đang kiểm tra…' : `Đang có ${devices} phiên đăng nhập còn hiệu lực.`} Nếu mất điện thoại hoặc thấy email báo đăng nhập lạ, hãy bấm nút này.
        </p>
        <button type="button" className="adm-btn adm-btn--alarm" onClick={() => void revokeAll()}>Đăng xuất tất cả thiết bị</button>
      </section>
    </main>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    void api('session').then(({ status, data }) => {
      if (status === 200) setAuthed(!!data.authed);
      else setOffline(true);
    });
  }, []);

  const signedOut = useCallback(() => setAuthed(false), []);
  if (offline) return <main className="adm adm--login"><p className="adm-muted">Trang quản trị không khả dụng ở địa chỉ này.</p></main>;
  if (authed === null) return null;
  return authed ? <Dashboard onSignedOut={signedOut} /> : <Login onDone={() => setAuthed(true)} />;
}
