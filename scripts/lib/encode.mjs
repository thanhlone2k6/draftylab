import { spawn } from 'node:child_process';

/** Scale filter: short edge ≤ maxShort, keep aspect, even dims. Rotation is auto-applied by ffmpeg. */
export const scaleFilter = (maxShort = 720) =>
  `scale='if(gt(iw,ih),-2,min(${maxShort},iw))':'if(gt(iw,ih),min(${maxShort},ih),-2)':flags=lanczos`;

export function ffmpeg(args, { quiet = true } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-y', ...(quiet ? ['-loglevel', 'error'] : []), ...args]);
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => (code === 0 ? resolve(err) : reject(new Error(`ffmpeg exited ${code}: ${err.slice(-2000)}`))));
  });
}

/** H.264/AAC web MP4 args for a preset {crf, maxrate, bufsize, preset, audioBitrate}. */
export function videoArgs(p, { maxShort = 720 } = {}) {
  return [
    '-vf', scaleFilter(maxShort),
    '-c:v', 'libx264', '-preset', p.preset ?? 'slow', '-crf', String(p.crf),
    '-maxrate', p.maxrate, '-bufsize', p.bufsize,
    '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', p.audioBitrate ?? '128k', '-ac', '2',
    '-movflags', '+faststart',
  ];
}
