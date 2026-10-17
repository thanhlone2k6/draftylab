import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

/** ffprobe → display-oriented dimensions (rotation applied), duration, codecs. */
export async function probeVideo(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', file], { maxBuffer: 1 << 24 });
  const data = JSON.parse(stdout);
  const v = data.streams.find((s) => s.codec_type === 'video');
  const a = data.streams.find((s) => s.codec_type === 'audio');
  let rotation = 0;
  for (const sd of v?.side_data_list ?? []) if (typeof sd.rotation === 'number') rotation = sd.rotation;
  if (v?.tags?.rotate) rotation = Number(v.tags.rotate);
  const swap = Math.abs(rotation) % 180 === 90;
  const [fr, fd] = String(v?.avg_frame_rate || '0/1').split('/').map(Number);
  return {
    codec: v?.codec_name,
    codedWidth: v?.width,
    codedHeight: v?.height,
    width: swap ? v?.height : v?.width,
    height: swap ? v?.width : v?.height,
    rotation,
    fps: fd ? Math.round((fr / fd) * 100) / 100 : null,
    durationSeconds: Math.round(Number(data.format.duration) * 100) / 100,
    bitRate: Number(data.format.bit_rate) || null,
    audioCodec: a?.codec_name ?? null,
    sizeBytes: Number(data.format.size),
  };
}
