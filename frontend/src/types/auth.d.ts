export interface JwtPayload {
  sub: string;       // User UUID
  exp: number;       // Expiration
  email: string;
  mobile: string;
  // Multi-tenant dictionary: { "lab_uuid": ["owner", "admin"] }
  lab_permissions: Record<string, string[]>; 
}