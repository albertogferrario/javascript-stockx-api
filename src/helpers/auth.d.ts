export function buildAuthUrl(
  baseUrl: string,
  clientId: string,
  redirectUri: string,
  scopes?: string[],
  state?: string | null
): string;

export function buildTokenUrl(baseUrl: string): string;

export interface PKCEChallenge {
  verifier: string;
  challenge: string;
  method: 'S256';
}

export function generatePKCE(): PKCEChallenge;

export interface AuthCodeResult {
  code: string;
  state: string | null;
}

export function parseAuthCode(callbackUrl: string): AuthCodeResult;