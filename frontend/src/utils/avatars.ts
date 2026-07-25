const FACES: Record<string, string> = {
  nuan:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 22c0-10 6-16 14-16s14 6 14 16" fill="#f4a574" opacity=".9"/><ellipse cx="14" cy="26" rx="3.2" ry="2.2" fill="#ff8fab" opacity=".55"/><ellipse cx="34" cy="26" rx="3.2" ry="2.2" fill="#ff8fab" opacity=".55"/><circle cx="18" cy="22" r="2.6" fill="#2a3140"/><circle cx="30" cy="22" r="2.6" fill="#2a3140"/><path d="M18 30c2.8 3.2 9.2 3.2 12 0" stroke="#2a3140" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M34 14c2-1 4-.5 5 1.5" stroke="#e85d4c" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  tiao:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 18c2-8 8-12 12-12 4 0 10 4 12 12l-2 4H14l-2-4z" fill="#2bb3a3" opacity=".85"/><circle cx="24" cy="8" r="2.5" fill="#f0b429"/><circle cx="17" cy="23" r="2.8" fill="#2a3140"/><circle cx="31" cy="23" r="2.8" fill="#2a3140"/><circle cx="24" cy="31" r="3.2" fill="#2a3140"/><path d="M8 36c4-2 8-1 10 2M40 36c-4-2-8-1-10 2" stroke="#2bb3a3" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  cha:
    '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 16c0-7 4.5-11 10-11s10 4 10 11v2H14v-2z" fill="#4f9fd8" opacity=".75"/><rect x="20" y="6" width="8" height="3" rx="1.5" fill="#2a3140" opacity=".35"/><circle cx="18" cy="22" r="2.5" fill="#2a3140"/><circle cx="30" cy="22" r="2.5" fill="#2a3140"/><path d="M17 30h14" stroke="#2a3140" stroke-width="2.4" stroke-linecap="round"/><path d="M36 28c3 1 5 4 5 7" stroke="#4f9fd8" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="41" cy="36" rx="3.5" ry="2.5" fill="#c9e4ff" stroke="#4f9fd8" stroke-width="1.5"/></svg>',
};

export function avatarSvg(kind: string): string {
  return FACES[kind] || FACES.nuan;
}

export function iconChild(): string {
  return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="#b03060" stroke-width="2"/><path d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="#b03060" stroke-width="2" stroke-linecap="round"/></svg>';
}
