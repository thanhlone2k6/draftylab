// Inline icons (no icon font, no network).
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const IconPlay = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>);
export const IconPause = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" /></svg>);
export const IconSound = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h4l5-4v13l-5-4H4z" fill="currentColor" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" {...P} /></svg>);
export const IconMuted = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h4l5-4v13l-5-4H4z" fill="currentColor" /><path d="M17 9.5l5 5M22 9.5l-5 5" {...P} /></svg>);
export const IconPrev = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" {...P} /></svg>);
export const IconNext = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" {...P} /></svg>);
