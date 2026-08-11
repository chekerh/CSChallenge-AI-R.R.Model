import { API_BASE } from '../api';

export type OAuthProvider = 'google' | 'linkedin';

export interface OAuthProviders {
  google: boolean;
  linkedin: boolean;
}

export async function getOAuthProviders(): Promise<OAuthProviders> {
  try {
    const resp = await fetch(`${API_BASE}/auth/oauth/providers`, {
      credentials: 'include',
    });
    if (!resp.ok) return { google: false, linkedin: false };
    return (await resp.json()) as OAuthProviders;
  } catch {
    return { google: false, linkedin: false };
  }
}

export function oauthLoginUrl(provider: OAuthProvider): string {
  return `${API_BASE}/auth/oauth/${provider}/start`;
}
