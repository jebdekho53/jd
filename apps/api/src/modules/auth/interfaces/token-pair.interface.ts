export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access token expiry in seconds (for clients to schedule silent refresh) */
  expiresIn: number;
}
