'use client';
// /admin — the "Skill AI x Claude" shelf shown above the community posts.
// Add / edit / hide / delete skills, replace the cover (pick, drag or paste + 1:1 crop) and reorder by dragging.
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { adminApi as api } from '../../lib/admin-api';
import AdminLightbox from './AdminLightbox';
import CoverField from './CoverField';

interface Skill {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string | null;
  status: 'published' | 'hidden';
  sortOrder: number | null;
}

const ERRORS: Record<string, string> = {
  title: 'Bạn chưa nhập tiêu đề.',
  url: 'Link chưa đúng. Link cần bắt đầu bằng https://',
  status: 'Trạng thái không hợp lệ.',
  not_found: 'Skill này không còn tồn tại.',
  ids: 'Thứ tự gửi lên không hợp lệ.',
  bad_json: 'Dữ liệu gửi lên không hợp lệ.',
  image_type: 'File này không phải ảnh JPG, PNG hoặc WebP.',
  image_too_large: 'Ảnh quá nặng. Hãy chọn ảnh khác.',
  network: 'Mất kết nối. Hãy thử lại.',
};
const errorText = (code?: string) => (code && ERRORS[code]) || 'Có lỗi xảy ra. Hãy thử lại.';

function SkillForm({ editing, onSaved, onCancel }: { editing: Skill | null; onSaved: (message: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [url, setUrl] = useState(editing?.url ?? '');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData();
    form.set('title', title);
    form.set('description', description);
    form.set('url', url);
    if (imageBlob) form.set('image', imageBlob, 'image');
    const { status, data } = await api(editing ? `skills/${editing.id}` : 'skills', { method: 'POST', body: form });
    setBusy(false);
    if (status === 200 || status === 201) return onSaved(editing ? 'Đã lưu skill.' : 'Đã thêm skill.');
    setError(errorText(data.code));
  };

  return (
    <form className="adm-card adm-form" onSubmit={(e) => void submit(e)}>
      <h2>{editing ? 'Sửa skill' : 'Thêm skill'}</h2>
      <CoverField
        initialUrl={editing?.image ?? null}
        onChange={setImageBlob}
        hint="Ảnh bìa không bắt buộc. Bấm, kéo ảnh vào ô hoặc dán (⌘V) rồi cắt vuông 1:1 — để trống thì hàng skill dùng icon."
      />
      <label className="adm-field">
        <span>Tiêu đề</span>
        <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="adm-field">
        <span>Mô tả ngắn <em>(không bắt buộc)</em></span>
        <input maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="adm-field">
        <span>Link skill</span>
        <input required type="url" inputMode="url" placeholder="https://github.com/…" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      {error && <p className="adm-error" role="alert">{error}</p>}
      <div className="adm-row">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Đang lưu…' : editing ? 'Lưu skill' : 'Thêm skill'}
        </button>
        {editing && <button type="button" className="adm-btn adm-btn--ghost" disabled={busy} onClick={onCancel}>Huỷ</button>}
      </div>
    </form>
  );
}

export default function SkillsAdmin({ onSignedOut }: { onSignedOut: () => void }) {
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { status, data } = await api('skills');
    if (status === 401) return onSignedOut();
    if (status !== 200) return setError(errorText(data.code));
    setSkills(data.items);
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

  const persistOrder = (next: Skill[]) => {
    setSkills(next);
    void act(
      api('skills/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((s) => s.id) }),
      }),
      'Đã lưu thứ tự skill.',
    );
  };

  const dropOn = (targetId: string) => {
    const fromId = dragId;
    setDragId(null);
    setOverId(null);
    if (!fromId || fromId === targetId || !skills) return;
    const next = [...skills];
    const from = next.findIndex((s) => s.id === fromId);
    const to = next.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
  };

  const moveBy = (index: number, delta: number) => {
    if (!skills) return;
    const to = index + delta;
    if (to < 0 || to >= skills.length) return;
    const next = [...skills];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
  };

  const toggle = (skill: Skill) => {
    const form = new FormData();
    form.set('status', skill.status === 'hidden' ? 'published' : 'hidden');
    void act(api(`skills/${skill.id}`, { method: 'POST', body: form }), skill.status === 'hidden' ? 'Đã hiện lại skill.' : 'Đã ẩn skill.');
  };

  const remove = (skill: Skill) => {
    if (!window.confirm(`Xoá hẳn skill "${skill.title}"? Không thể khôi phục.`)) return;
    if (editing?.id === skill.id) setEditing(null);
    void act(api(`skills/${skill.id}`, { method: 'DELETE' }), 'Đã xoá skill.');
  };

  return (
    <section>
      <h2>Skill AI x Claude</h2>
      <p className="adm-muted">
        Ô này hiện trên trang Cộng đồng, ngay trên các thẻ tài liệu. Kéo ảnh vào ô ảnh bìa để thay (cắt 1:1), kéo thẻ trong danh sách để đổi thứ tự.
      </p>

      <div aria-live="polite">
        {notice && <p className="adm-notice">{notice}</p>}
        {error && <p className="adm-error">{error}</p>}
      </div>

      <SkillForm
        key={`new-skill-${formKey}`}
        editing={null}
        onCancel={() => {}}
        onSaved={(message) => {
          setFormKey((k) => k + 1);
          setNotice(message);
          setError('');
          void load();
        }}
      />

      {editing && (
        <AdminLightbox label="Sửa skill" onClose={() => setEditing(null)}>
          <SkillForm
            key={editing.id}
            editing={editing}
            onCancel={() => setEditing(null)}
            onSaved={(message) => {
              setEditing(null);
              setNotice(message);
              setError('');
              void load();
            }}
          />
        </AdminLightbox>
      )}

      {skills === null && <p className="adm-muted">Đang tải…</p>}
      {skills?.length === 0 && <p className="adm-muted">Chưa có skill nào.</p>}
      <ul className="adm-list">
        {skills?.map((skill, i) => (
          <li
            key={skill.id}
            className={`adm-item${dragId === skill.id ? ' is-dragging' : ''}${overId === skill.id ? ' is-over' : ''}`}
            draggable
            onDragStart={(e) => {
              setDragId(skill.id);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', skill.id);
            }}
            onDragEnd={() => { setDragId(null); setOverId(null); }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (overId !== skill.id) setOverId(skill.id);
            }}
            onDragLeave={() => setOverId((v) => (v === skill.id ? null : v))}
            onDrop={(e) => { e.preventDefault(); dropOn(skill.id); }}
          >
            <span className="adm-item__handle" aria-hidden="true">⠿</span>
            {skill.image ? (
              <img src={skill.image} alt="" loading="lazy" draggable={false} />
            ) : (
              <span className="adm-item__noimg" aria-hidden="true">◇</span>
            )}
            <div className="adm-item__body">
              <strong>{skill.title}</strong>
              <a href={skill.url} target="_blank" rel="noopener noreferrer">{skill.url}</a>
              {skill.description && <span className="adm-muted">{skill.description}</span>}
              <span className={`adm-badge${skill.status === 'published' ? ' is-live' : ''}`}>{skill.status === 'published' ? 'Đang hiện trên web' : 'Đã ẩn'}</span>
              <div className="adm-row">
                <button type="button" className="adm-btn adm-btn--small adm-btn--move" onClick={() => moveBy(i, -1)} disabled={i === 0} aria-label={`Đưa “${skill.title}” lên`}>↑</button>
                <button type="button" className="adm-btn adm-btn--small adm-btn--move" onClick={() => moveBy(i, 1)} disabled={i === skills.length - 1} aria-label={`Đưa “${skill.title}” xuống`}>↓</button>
                <button type="button" className="adm-btn adm-btn--small" onClick={() => setEditing(skill)}>Sửa</button>
                <button type="button" className="adm-btn adm-btn--small" onClick={() => toggle(skill)}>{skill.status === 'hidden' ? 'Hiện lại' : 'Ẩn'}</button>
                <button type="button" className="adm-btn adm-btn--small adm-btn--danger" onClick={() => remove(skill)}>Xoá</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
