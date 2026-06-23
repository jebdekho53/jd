export interface JwtPayload {
  /** User ID (cuid) */
  sub: string;
  phone: string;
  email: string | null;
  roles: string[];
  permissions: string[];
  /** Key ID — matches JWT_KEY_ID env var for rotation tracking */
  kid?: string;
}
