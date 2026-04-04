export type UserRole = 'viewer' | 'editor' | 'admin';

export interface JwtPayload {
  sub:      string;
  username: string;
  role:     UserRole;
}

// Extend Fastify request to carry decoded JWT after jwtVerify()
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user:    JwtPayload;
  }
}
