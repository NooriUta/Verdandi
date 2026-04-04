import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '../types';

/** SQL/Cypher write-operation detector. */
export function isWriteQuery(command: string): boolean {
  return /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|MERGE|SET)\b/i.test(command.trim());
}

/** Minimum role required for write operations via the proxy. */
const WRITE_MIN_ROLE: UserRole = 'admin';

const ROLE_RANK: Record<UserRole, number> = {
  viewer: 0,
  editor: 1,
  admin:  2,
};

function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

/**
 * preHandler: verify JWT from cookie, attach user to request.
 * Use as `preHandler: [app.authenticate]` on protected routes.
 */
const rbacPlugin: FastifyPluginAsync = async (app) => {
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify({ onlyCookie: true });
      } catch {
        reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  );

  /**
   * Guard that combines authenticate + write-permission check.
   * Pass `command` in the request body; role is taken from the JWT.
   */
  app.decorate(
    'authorizeQuery',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify({ onlyCookie: true });
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const body = request.body as { command?: string } | undefined;
      if (body?.command && isWriteQuery(body.command)) {
        const role = request.user.role;
        if (!hasMinRole(role, WRITE_MIN_ROLE)) {
          return reply.status(403).send({ error: 'Forbidden: write access requires admin role' });
        }
      }
    },
  );
};

export default fp(rbacPlugin, { name: 'rbac' });

// ── Fastify type augmentation ─────────────────────────────────────────────────
declare module 'fastify' {
  interface FastifyInstance {
    authenticate:   (req: FastifyRequest, rep: FastifyReply) => Promise<void>;
    authorizeQuery: (req: FastifyRequest, rep: FastifyReply) => Promise<void>;
  }
}
