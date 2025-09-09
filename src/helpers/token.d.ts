export interface JWTPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export function decode(jwt: string): JWTPayload | null;

export function isExpired(jwt: string, bufferSeconds?: number): boolean;

export function getExpiry(jwt: string): Date | null;

export interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  [key: string]: any;
}

export interface ParsedToken {
  accessToken: string;
  tokenType: string;
  refreshToken?: string;
  scope: string[];
  expiresAt?: Date;
}

export function parse(tokenResponse: TokenResponse): ParsedToken;