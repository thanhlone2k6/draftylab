'use client';
// /admin: 1:1 crop before upload. The square frame is exactly what the card shows on the site,
// so nothing important gets cut off later. Drag the photo to move it, slide to zoom.
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import AdminLightbox from './AdminLightbox';

const OUT_MAX = 1400; // same cap the old direct upload used
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

async function encode(canvas: HTMLCanvasElement): Promise<Blob> {
  const toBlob = (type: string, quality: number) => new Promise<Blob | null>((done) => canvas.toBlob(done, type, quality));
  const webp = await toBlob('image/webp', 0.88);
  if (webp?.type === 'image/webp') return webp; // Safari cannot encode WebP and hands back PNG
  const jpeg = await toBlob('image/jpeg', 0.9);
  if (!jpeg) throw new Error('encode');
  return jpeg;
}

interface Props {
  file: Blob;
  onApply: (blob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ file, onApply, onCancel }: Props) {
  const [url, setUrl] = useState('');
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    const measure = () => setFrame(el.clientWidth);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const cover = dims && frame ? Math.max(frame / dims.w, frame / dims.h) : 1;
  const k = cover * zoom;
  const maxX = dims ? Math.max(0, (dims.w * k - frame) / 2) : 0;
  const maxY = dims ? Math.max(0, (dims.h * k - frame) / 2) : 0;

  // Zooming out or resizing can leave the photo off-centre; pull it back inside the frame.
  useEffect(() => {
    setOffset((o) => ({ x: clamp(o.x, -maxX, maxX), y: clamp(o.y, -maxY, maxY) }));
  }, [maxX, maxY]);

  const start = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dims) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // synthetic pointers (tests/assistive tools) have no active capture target — dragging still works
    }
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    setOffset({
      x: clamp(d.ox + e.clientX - d.x, -maxX, maxX),
      y: clamp(d.oy + e.clientY - d.y, -maxY, maxY),
    });
  };
  const end = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const apply = async () => {
    const img = imgRef.current;
    if (!img || !dims || !frame) return;
    setBusy(true);
    setError('');
    try {
      const scale = cover * zoom;
      const sw = frame / scale;
      const sx = dims.w / 2 - (frame / 2 + offset.x) / scale;
      const sy = dims.h / 2 - (frame / 2 + offset.y) / scale;
      const out = Math.min(OUT_MAX, Math.max(64, Math.floor(sw)));
      const canvas = document.createElement('canvas');
      canvas.width = out;
      canvas.height = out;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sw, 0, 0, out, out);
      onApply(await encode(canvas));
    } catch {
      setError('Không xử lý được ảnh này. Hãy chọn ảnh khác.');
    }
    setBusy(false);
  };

  return (
    <AdminLightbox label="Cắt ảnh" variant="crop" onClose={onCancel}>
      <div className="adm-card adm-crop">
        <h2>Cắt ảnh</h2>
        <div
          ref={frameRef}
          className="adm-crop__frame"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {url && (
            <img
              ref={imgRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              style={dims ? {
                width: `${dims.w * k}px`,
                height: `${dims.h * k}px`,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              } : { visibility: 'hidden' }}
            />
          )}
          <span className="adm-crop__grid" aria-hidden="true" />
        </div>
        <label className="adm-field">
          <span>Phóng to <em>({Math.round(zoom * 100)}%)</em></span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <p className="adm-muted">Kéo ảnh để chọn phần nằm trong khung. Trang Cộng đồng hiện đúng khung vuông này.</p>
        {error && <p className="adm-error" role="alert">{error}</p>}
        <div className="adm-row">
          <button type="button" className="adm-btn adm-btn--primary" disabled={!dims || busy} onClick={() => void apply()}>
            {busy ? 'Đang xử lý…' : 'Dùng ảnh này'}
          </button>
          <button type="button" className="adm-btn adm-btn--ghost" disabled={busy} onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>
            Đặt lại
          </button>
          <button type="button" className="adm-btn adm-btn--ghost" disabled={busy} onClick={onCancel}>Huỷ</button>
        </div>
      </div>
    </AdminLightbox>
  );
}
