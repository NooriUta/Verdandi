import bcrypt from 'bcryptjs';
import { arcadeCommand } from './arcade';
import type { UserRole } from './types';

export interface DbUser {
  id:            string;
  username:      string;
  role:          UserRole;
  password_hash: string;
}

/**
 * Verify credentials against the User document type in ArcadeDB.
 * Returns the user object (without password_hash) on success, null on failure.
 *
 * Phase 2 schema requirement:
 *   CREATE DOCUMENT TYPE User IF NOT EXISTS;
 *   INSERT INTO User SET username='admin', password_hash='<bcrypt>', role='admin';
 */
export async function verifyUser(
  username: string,
  password: string,
): Promise<Omit<DbUser, 'password_hash'> | null> {
  const res = await arcadeCommand(
    'sql',
    'SELECT @rid, username, role, password_hash FROM User WHERE username = :username LIMIT 1',
    { username },
  );

  const rows = res.result as Partial<DbUser & { '@rid': string }>[];
  if (!rows.length) return null;

  const row = rows[0];
  if (!row.password_hash) return null;

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return null;

  return {
    id:       row['@rid'] ?? '',
    username: row.username ?? username,
    role:     (row.role as UserRole) ?? 'viewer',
  };
}

/** Utility used in seed scripts — hash a plain-text password. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
