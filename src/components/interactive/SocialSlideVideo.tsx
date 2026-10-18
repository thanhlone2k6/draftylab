// In-place video for the FRONT slide of a Social carousel (no lightbox, no controls).
//  • Plays automatically while the slide is in front and the group is on screen (loops, inline).
//  • Sound: the session level (default 50%) while the visitor's pointer/focus is on the group, muted otherwise
//    (so several groups never talk over each other). If the browser blocks unmuted playback (no interaction with
//    the page yet), it keeps playing muted and the sound comes on at the first gesture.
//  • Source is attached only while playing and detached afterwards (network + decoder stop for real).
import { useEffect, useRef, useState } from 'react';
import { applyMediaVolume, applySessionVolume, subscribeVolume } from '../../lib/volume';

interface Props {
  src: string;
  playing: boolean;
  engaged: boolean;
  landscape: boolean;
  /** 9:16 video shown in full (object-fit contain) with a transparent letterbox */
  contain?: boolean;
}

export default function SocialSlideVideo({ src, playing, engaged, landscape, contain }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);
  const engagedRef = useRef(engaged);
  engagedRef.current = engaged;

  // Attach / detach the source.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onPlaying = () => setLive(true);
    v.addEventListener('playing', onPlaying);
    if (playing) {
      v.src = src;
      applySessionVolume(v, !engagedRef.current);
      v.play().catch(() => {
        applySessionVolume(v, true);
        v.play().catch(() => {});
      });
    }
    return () => {
      v.removeEventListener('playing', onPlaying);
      v.pause();
      v.removeAttribute('src');
      v.load();
      setLive(false);
    };
  }, [playing, src]);

  // Sound follows hover/focus.
  useEffect(() => {
    const v = ref.current;
    if (!v || !playing) return;
    applySessionVolume(v, !engaged);
    if (!engaged) return;
    // Blocked unmute pauses the element in some browsers: fall back to muted and retry on the first gesture.
    const check = window.setTimeout(() => {
      if (v.paused && v.getAttribute('src')) {
        applySessionVolume(v, true);
        v.play().catch(() => {});
        const on = () => {
          document.removeEventListener('pointerdown', on, true);
          document.removeEventListener('keydown', on, true);
          if (engagedRef.current && v.getAttribute('src')) {
            applySessionVolume(v, false);
            v.play().catch(() => {});
          }
        };
        document.addEventListener('pointerdown', on, true);
        document.addEventListener('keydown', on, true);
      }
    }, 250);
    return () => window.clearTimeout(check);
  }, [engaged, playing]);

  // The level is shared with the rest of the page (session volume store): a change applies here too.
  useEffect(
    () =>
      subscribeVolume((vol) => {
        const v = ref.current;
        if (v) applyMediaVolume(v, vol, !engagedRef.current);
      }),
    [],
  );

  return (
    <video
      ref={ref}
      className="sb-video"
      data-live={live ? '' : undefined}
      data-landscape={landscape ? '' : undefined}
      data-contain={contain ? '' : undefined}
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
