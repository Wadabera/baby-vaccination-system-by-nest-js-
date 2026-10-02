import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { SessionService, type SessionData } from '../session.service';

export interface RequestWithSession extends Request {
  session?: SessionData;
  userId?: string;
}

/**
 * Optional session tracking.
 *
 * Authentication itself is enforced by `JwtAuthGuard`, so this middleware never
 * blocks anonymous traffic. When a client *does* send `x-session-token` we
 * validate it, refresh its idle window and surface the session on the request,
 * which lets us log out a single session. Sending an invalid token is an error.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly sessionService: SessionService) {}

  use(req: RequestWithSession, res: Response, next: NextFunction): void {
    const sessionToken = req.headers['x-session-token'];

    if (typeof sessionToken !== 'string' || sessionToken.length === 0) {
      return next();
    }

    const session = this.sessionService.getSession(sessionToken);
    if (!session) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    if (!this.sessionService.updateActivity(sessionToken)) {
      throw new UnauthorizedException('Session update failed');
    }

    req.session = session;
    req.userId = session.userId;

    next();
  }
}
