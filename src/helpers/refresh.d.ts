import { AxiosInstance, AxiosError } from 'axios';

export interface RefreshInterceptorOptions {
  onRefresh: () => Promise<string>;
  shouldRefresh?: (error: AxiosError) => boolean;
  maxRetries?: number;
}

export function createInterceptor(
  client: AxiosInstance,
  options: RefreshInterceptorOptions
): AxiosInstance;

export function refreshToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  tokenUrl: string
): Promise<any>;