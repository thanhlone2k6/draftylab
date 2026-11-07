// Compact counter for the landing "join the community" card. Starts at 48 (FOMO) and picks up the
// real count from GET /api/waitlist when it is reachable.
import { useEffect, useState } from 'react';
import { interpolate } from '../../lib/interpolate';
import { WAITLIST_BASELINE, WAITLIST_GOAL } from '../../lib/waitlist';
import './WaitlistProgress.css';

interface Props {
  label: string;
  remaining: string;
  className?: string;
}

export default function WaitlistProgress({ label, remaining, className = '' }: Props) {
  const [count, setCount] = useState(WAITLIST_BASELINE);

  useEffect(() => {
    let alive = true;
    fetch('/api/waitlist', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.ok && typeof data.count === 'number') {
          setCount(Math.min(WAITLIST_GOAL, Math.max(WAITLIST_BASELINE, data.count)));
        }
      })
      .catch(() => {
        /* keep the 48 head start */
      });
    return () => {
      alive = false;
    };
  }, []);

  const left = Math.max(0, WAITLIST_GOAL - count);

  return (
    <span className={`wlp ${className}`.trim()}>
      <span
        className="wlp__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={WAITLIST_GOAL}
        aria-valuenow={count}
        aria-label={interpolate(label, { count, goal: WAITLIST_GOAL })}
      >
        <span className="wlp__fill" style={{ width: `${(count / WAITLIST_GOAL) * 100}%` }} />
      </span>
      <span className="wlp__text">
        <span>{interpolate(label, { count, goal: WAITLIST_GOAL })}</span>
        {left > 0 && <span className="wlp__left"> · {interpolate(remaining, { count: left })}</span>}
      </span>
    </span>
  );
}
