'use client';

import { API_BASE_URL } from '@/lib/api';

interface Props {
  /** Where to drop the user after successful Google sign-in. */
  next?: string;
}

/**
 * Top-level navigation to the API's Google OAuth entry point. We do a full
 * page redirect (not fetch) so the cookie set by the callback lands on the
 * api host on the way back, then the `/auth/google/callback` page on the web
 * side calls `auth.refresh()` to pick up the session.
 */
export function GoogleSignInButton({ next }: Props) {
  const href =
    `${API_BASE_URL}/api/auth/google` + (next ? `?next=${encodeURIComponent(next)}` : '');
  return (
    <a
      href={href}
      className="flex w-full items-center justify-center gap-3 rounded border border-card-border/60 bg-bg/40 py-3 text-sm font-semibold uppercase tracking-widest text-text transition hover:border-gold/70 hover:text-gold"
    >
      <GoogleIcon />
      <span>Увійти через Google</span>
    </a>
  );
}

function GoogleIcon() {
  // Inline Google brand mark to avoid pulling in an icon dep. Colors match
  // Google's standard guidelines.
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
