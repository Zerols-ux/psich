import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { env } from '../env.js';

export interface GoogleOAuthProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * `true` when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. The
 * route handlers gate themselves on this so a fresh dev clone without Google
 * credentials still boots — the password-login flows keep working, the
 * `/api/auth/google*` endpoints just return 503 with a clear message.
 */
export const googleAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);

let registered = false;

/** Initializes the Google strategy once. No-op when credentials are missing. */
export function configureGoogleStrategy(): void {
  if (registered || !googleAuthEnabled) return;
  registered = true;
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID as string,
        clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: env.GOOGLE_REDIRECT_URI,
      },
      (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const normalized = normalizeProfile(profile);
          // Passport's `Express.User` is augmented as `AccessTokenPayload`;
          // here we intentionally pass a different shape because our
          // /google/callback route uses the custom-callback form of
          // `passport.authenticate` and receives this object directly, never
          // through `req.user`. Cast to satisfy the strategy's typing.
          done(null, normalized as unknown as Express.User);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
}

/**
 * Pulls the fields we actually need out of the Google profile and validates
 * that the email is present + verified. Google occasionally returns accounts
 * without an email scope granted, which we have to reject — we have no other
 * way to link to an existing user. We also require `email_verified=true`:
 * `loginOrRegisterWithGoogle` auto-links by email, so an unverified email
 * would let an attacker register an unverified Google account under someone
 * else's address and silently link to their existing password user.
 *
 * Exported for unit tests.
 */
export function normalizeProfile(profile: Profile): GoogleOAuthProfile {
  const email = profile.emails?.find((e) => e.value)?.value;
  if (!email) {
    throw new Error('Google account did not return an email address');
  }
  if (!isEmailVerified(profile, email)) {
    throw new Error('Google email address is not verified');
  }
  const name =
    profile.displayName ||
    [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
    email;
  const avatarUrl = profile.photos?.find((p) => p.value)?.value ?? null;
  return {
    googleId: profile.id,
    email,
    name,
    avatarUrl,
  };
}

/**
 * Reads the `email_verified` flag from the Google profile. The OpenID userinfo
 * response and the OAuth2 v3 userinfo endpoint both put this in
 * `profile._json.email_verified` (boolean, sometimes a string "true"); newer
 * passport versions also expose it as `verified` on each email entry. Accept
 * either, defaulting to `false` when neither is present.
 */
function isEmailVerified(profile: Profile, email: string): boolean {
  const entry = profile.emails?.find((e) => e.value === email) as
    | { value: string; verified?: boolean | string }
    | undefined;
  if (entry && entry.verified !== undefined) {
    return entry.verified === true || entry.verified === 'true';
  }
  const json = (profile as { _json?: { email_verified?: boolean | string } })._json;
  const flag = json?.email_verified;
  return flag === true || flag === 'true';
}

export { passport };
