// Vanilla port of the hero "glyph sonar" canvas (was a React island).
// Desktop-only decoration: Hero.astro imports this lazily behind a media query.
import '../components/GlyphSonar.css';

type Tone = 'gold' | 'muted' | 'white';
interface Particle {
  bx: number; by: number; glyph: number; scale: number;
  alpha: number; phase: number; drift: number; tone: 'gold' | 'muted';
}

const GLYPHS = ['+', '×', '○', '·'];
const TAU = Math.PI * 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const fract = (value: number) => value - Math.floor(value);
const hash = (x: number, y: number, seed = 0) => fract(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453);

function makeSprite(glyph: string, color: string, size: number, glow: number) {
  const padding = Math.ceil(size * 1.8);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size + padding * 2;
  const context = canvas.getContext('2d')!;
  context.font = `500 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = glow;
  context.fillText(glyph, canvas.width / 2, canvas.height / 2 + 0.5);
  return canvas;
}

function buildAtlas(isMobile: boolean) {
  const sizes = isMobile ? [6, 8, 10] : [7, 10, 13];
  const colors: Record<Tone, string> = { gold: '#FFD687', muted: '#B78A42', white: '#F1FFF9' };
  const atlas = {} as Record<Tone, HTMLCanvasElement[][]>;
  (Object.keys(colors) as Tone[]).forEach((tone) => {
    atlas[tone] = GLYPHS.map((glyph) => sizes.map((size) => makeSprite(glyph, colors[tone], size, tone === 'white' ? 10 : 7)));
  });
  return atlas;
}

function createField(width: number, height: number, isMobile: boolean): Particle[] {
  const spacing = isMobile ? 15 : 13;
  const maxParticles = isMobile ? 720 : Math.min(2700, Math.floor((width * height) / 520));
  const candidates: Particle[] = [];
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);

  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= cols; col += 1) {
      const nx = col / cols;
      const ny = row / rows;
      const a = Math.sin(nx * 12.4 + Math.sin(ny * 7.1) * 1.8);
      const b = Math.cos(ny * 10.2 - Math.sin(nx * 8.4) * 1.5);
      const c = Math.sin((nx + ny) * 18.6 + Math.cos(nx * 5.2));
      const shoal = a * 0.48 + b * 0.34 + c * 0.18;
      const grain = hash(col, row, 3.7);
      const centerDistance = Math.hypot(nx - 0.5, ny - 0.5);
      const centralQuiet = 1 - Math.exp(-Math.pow(centerDistance / 0.24, 4));
      const threshold = 0.16 + (grain - 0.5) * 0.62;

      if (shoal * centralQuiet > threshold) {
        const jitterX = (hash(col, row, 8.1) - 0.5) * spacing * 0.42;
        const jitterY = (hash(col, row, 11.9) - 0.5) * spacing * 0.42;
        candidates.push({
          bx: col * spacing + jitterX,
          by: row * spacing + jitterY,
          glyph: Math.floor(hash(col, row, 15.3) * GLYPHS.length),
          scale: Math.floor(hash(col, row, 19.1) * 3),
          alpha: 0.17 + hash(col, row, 23.8) * 0.58,
          phase: hash(col, row, 27.4) * TAU,
          drift: 0.35 + hash(col, row, 31.2) * 0.9,
          tone: hash(col, row, 35.6) > 0.74 ? 'gold' : 'muted',
        });
      }
    }
  }

  if (candidates.length <= maxParticles) return candidates;
  const step = candidates.length / maxParticles;
  return Array.from({ length: maxParticles }, (_, index) => candidates[Math.floor(index * step)]);
}

export function initGlyphSonar(root: HTMLElement, { interactive = false } = {}) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas');
  const context = canvas?.getContext('2d', { alpha: false });
  if (!canvas || !context) return;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarseQuery = window.matchMedia('(pointer: coarse)');
  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    isMobile: coarseQuery.matches || window.innerWidth < 720,
    field: [] as Particle[],
    atlas: null as Record<Tone, HTMLCanvasElement[][]> | null,
    visible: true,
    pageVisible: !document.hidden,
    reduced: reduceMotionQuery.matches,
    pointer: { x: 0, y: 0, active: false },
    pulses: [{ born: -1.3 }, { born: -4.5 }],
    frame: 0,
    lastDraw: 0,
  };

  const rebuild = () => {
    const bounds = root.getBoundingClientRect();
    state.width = Math.max(1, bounds.width);
    state.height = Math.max(1, bounds.height);
    state.isMobile = coarseQuery.matches || state.width < 720;
    state.dpr = Math.min(window.devicePixelRatio || 1, state.isMobile ? 1.25 : 1.6);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.field = createField(state.width, state.height, state.isMobile);
    state.atlas = buildAtlas(state.isMobile);
    state.pointer.x = state.width * 0.5;
    state.pointer.y = state.height * 0.5;
  };

  const drawSprite = (tone: Tone, glyph: number, scale: number, x: number, y: number, alpha: number, rotation = 0) => {
    const sprite = state.atlas![tone][glyph][scale];
    context.save();
    context.globalAlpha = clamp(alpha, 0, 1);
    context.translate(x, y);
    context.rotate(rotation);
    context.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    context.restore();
  };

  const pulseStrengthAt = (distance: number, elapsed: number, maxRadius: number) => {
    let strength = 0;
    for (const pulse of state.pulses) {
      const age = elapsed - pulse.born;
      if (age < 0 || age > 4.8) continue;
      const radius = (age / 4.8) * maxRadius;
      const band = state.isMobile ? 20 : 28;
      const wave = Math.exp(-Math.pow((distance - radius) / band, 2));
      const fade = Math.sin(clamp(age / 4.8, 0, 1) * Math.PI);
      strength = Math.max(strength, wave * fade);
    }
    return strength;
  };

  const render = (timestamp: number) => {
    const elapsed = timestamp * 0.001;
    const centerX = state.width * 0.5;
    const centerY = state.height * 0.5;
    const maxRadius = Math.hypot(state.width, state.height) * 0.62;
    const frameGap = state.isMobile ? 1000 / 32 : 1000 / 60;

    if (timestamp - state.lastDraw < frameGap && !state.reduced) return;
    state.lastDraw = timestamp;
    context.fillStyle = '#0A0A0A';
    context.fillRect(0, 0, state.width, state.height);

    const vignette = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    vignette.addColorStop(0, 'rgba(255, 214, 135, 0.018)');
    vignette.addColorStop(0.58, 'rgba(10, 10, 10, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.52)');
    context.fillStyle = vignette;
    context.fillRect(0, 0, state.width, state.height);

    for (const particle of state.field) {
      const flowX = Math.sin(elapsed * 0.19 + particle.by * 0.009 + particle.phase) * 7 * particle.drift;
      const flowY = Math.cos(elapsed * 0.16 + particle.bx * 0.007 - particle.phase) * 6 * particle.drift;
      let x = particle.bx + flowX;
      let y = particle.by + flowY;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.hypot(dx, dy);
      const pulse = pulseStrengthAt(distance, elapsed, maxRadius);

      if (state.pointer.active && interactive) {
        const pointerDx = x - state.pointer.x;
        const pointerDy = y - state.pointer.y;
        const pointerDistance = Math.hypot(pointerDx, pointerDy);
        if (pointerDistance < 135 && pointerDistance > 0.1) {
          const push = Math.pow(1 - pointerDistance / 135, 2) * 24;
          x += (pointerDx / pointerDistance) * push;
          y += (pointerDy / pointerDistance) * push;
        }
      }

      const shimmer = 0.84 + Math.sin(elapsed * (0.7 + particle.drift * 0.18) + particle.phase) * 0.16;
      const tone: Tone = pulse > 0.68 ? 'white' : pulse > 0.2 ? 'gold' : particle.tone;
      const alpha = particle.alpha * shimmer + pulse * 0.68;
      const scale = clamp(particle.scale + (pulse > 0.54 ? 1 : 0), 0, 2);
      const displacement = pulse * 8;
      const invDistance = distance > 0 ? 1 / distance : 0;
      drawSprite(
        tone,
        particle.glyph,
        scale,
        x + dx * invDistance * displacement,
        y + dy * invDistance * displacement,
        alpha,
        Math.sin(elapsed * 0.13 + particle.phase) * 0.11,
      );
    }

    if (!state.reduced) {
      const latest = state.pulses[state.pulses.length - 1];
      if (elapsed - latest.born > 3.35) state.pulses.push({ born: elapsed });
      state.pulses = state.pulses.filter((pulse) => elapsed - pulse.born < 5.2);
    }
  };

  const canRun = () => state.visible && state.pageVisible;
  const loop = (timestamp: number) => {
    if (canRun()) render(timestamp);
    state.frame = !state.reduced && canRun() ? requestAnimationFrame(loop) : 0;
  };
  const stop = () => {
    cancelAnimationFrame(state.frame);
    state.frame = 0;
  };
  const start = () => {
    stop();
    if (state.reduced) render(2400);
    else if (canRun()) state.frame = requestAnimationFrame(loop);
  };

  const onPointerMove = (event: PointerEvent) => {
    const bounds = root.getBoundingClientRect();
    state.pointer.x = event.clientX - bounds.left;
    state.pointer.y = event.clientY - bounds.top;
    state.pointer.active = true;
  };

  new ResizeObserver(() => {
    rebuild();
    if (canRun()) start();
  }).observe(root);
  new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (canRun()) start(); else stop();
  }, { rootMargin: '120px' }).observe(root);
  document.addEventListener('visibilitychange', () => {
    state.pageVisible = !document.hidden;
    if (state.pageVisible) start(); else stop();
  });
  reduceMotionQuery.addEventListener('change', (event) => {
    state.reduced = event.matches;
    start();
  });
  if (interactive) {
    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerleave', () => { state.pointer.active = false; });
    root.addEventListener('pointerdown', (event) => {
      if (state.reduced) return;
      onPointerMove(event);
      state.pulses.push({ born: performance.now() * 0.001 });
    }, { passive: true });
  }
  rebuild();
  start();
}
