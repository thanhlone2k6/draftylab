'use client';
// /admin cover/photo field: click to pick, drag from Finder, or paste (⌘V). Every photo goes through the
// 1:1 cropper before upload, so what the admin previews is exactly what the card shows.
import { useCallback, useEffect, useRef, useState } from 'react';
import ImageCropper from './ImageCropper';

interface Props {
  initialUrl?: string | null;
  onChange: (blob: Blob | null) => void;
  hint?: string;
}

export default function CoverField({ initialUrl = null, onChange, hint }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl);
  const [crop, setCrop] = useState<Blob | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const blobRef = useRef<Blob | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLButtonElement>(null);

  // Release only the previews this field created; the server URL is not ours to revoke.
  useEffect(() => () => {
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const accept = useCallback((file: Blob | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File này không phải ảnh JPG, PNG hoặc WebP.');
      return;
    }
    setError('');
    setCrop(file);
  }, []);

  // Paste a photo/screenshot straight into this form (⌘V / Ctrl+V). Scoped to the form so the post
  // form and the skill form (both mounted in /admin) never open two croppers at once.
  useEffect(() => {
    if (crop) return undefined; // the cropper is open; don't swap the photo under it
    const form = dropRef.current?.closest('form');
    if (!form) return undefined;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (!item.type.startsWith('image/')) continue;
        const f = item.getAsFile();
        if (f) {
          e.preventDefault();
          accept(f);
          return;
        }
      }
    };
    form.addEventListener('paste', onPaste);
    return () => form.removeEventListener('paste', onPaste);
  }, [accept, crop]);

  const applyCrop = (blob: Blob) => {
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    blobRef.current = blob;
    setImageUrl(URL.createObjectURL(blob));
    onChange(blob);
    setCrop(null);
  };

  const reCrop = async () => {
    setError('');
    try {
      const blob = blobRef.current ?? (imageUrl ? await (await fetch(imageUrl)).blob() : null);
      if (blob) setCrop(blob);
    } catch {
      setError('Không đọc được ảnh này. Hãy chọn ảnh khác.');
    }
  };

  return (
    <>
      <button
        ref={dropRef}
        type="button"
        className={`adm-drop${imageUrl ? ' has-image' : ''}${dragOver ? ' is-over' : ''}`}
        onClick={() => picker.current?.click()}
        onDragEnter={(e) => {
          if (!Array.from(e.dataTransfer.types).includes('Files')) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          if (!Array.from(e.dataTransfer.types).includes('Files')) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          accept(e.dataTransfer.files?.[0] ?? null);
        }}
        aria-label={imageUrl ? 'Đổi ảnh: bấm để chọn, kéo hoặc dán ảnh' : 'Chọn ảnh: bấm để chọn, kéo hoặc dán ảnh'}
      >
        {imageUrl ? <img src={imageUrl} alt="" /> : <span>Bấm để chọn ảnh<br /><em>hoặc kéo ảnh vào đây, dán ⌘V</em></span>}
      </button>
      <input
        ref={picker}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { accept(e.target.files?.[0] ?? null); e.target.value = ''; }}
      />
      <p className="adm-hint">
        {hint ?? 'Bấm để chọn, kéo ảnh từ ngoài vào ô, hoặc dán ảnh (⌘V). Bạn sẽ cắt vuông 1:1 trước khi lưu — đúng như thẻ trên trang Cộng đồng.'}
      </p>
      {imageUrl && (
        <div className="adm-row">
          <button type="button" className="adm-btn adm-btn--small" onClick={() => void reCrop()}>Chỉnh lại / cắt ảnh</button>
        </div>
      )}
      {error && <p className="adm-error" role="alert">{error}</p>}
      {crop && <ImageCropper file={crop} onApply={applyCrop} onCancel={() => setCrop(null)} />}
    </>
  );
}
