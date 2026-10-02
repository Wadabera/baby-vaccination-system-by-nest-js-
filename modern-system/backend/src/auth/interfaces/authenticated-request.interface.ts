import type { Request } from 'express';
import type { UserRole } from '../../users/schemas/user.schema';
import type { SessionData } from '../session.service';

/** Identity attached to a request by `JwtStrategy.validate`. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  clinicId?: string;
}

/** An Express request carrying a validated JWT identity. */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  session?: SessionData;
  userId?: string;
}
