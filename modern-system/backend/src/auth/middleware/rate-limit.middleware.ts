import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

interface Limits {
  max: number;
  windowMs: number;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * Credential endpoints are throttled, but not brutally: a health centre
 * shares one NAT address across all its staff, so a very low cap would lock
 * out legitimate users. Per-account lockout (5 failed attempts, see
 * `AuthService`) is the real brute-force defence; this is a coarse outer bound.
 */
const STRICT: Limits = { max: 30, windowMs: 15 * MINUTE };

/**
 * `auth/me` runs on every page load to restore the session, so it needs a
 * budget that survives normal browsing. A 100-request cap on a shared client IP
 * locks legitimate users out of their own session.
 */
const SESSION: Limits = { max: 600, windowMs: HOUR };

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests = new Map<string, RateLimitEntry>();
  private lastSweep = Date.now();

  use(req: Request, res: Response, next: NextFunction): void {
    const limits = this.limitsFor(req);
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${clientIp}:${req.baseUrl}${req.path}`;

    const now = Date.now();
    const entry = this.requests.get(key);

    // No entry yet, or the window elapsed: start a fresh window.
    if (!entry || now - entry.firstRequest > limits.windowMs) {
      this.requests.set(key, { count: 1, firstRequest: now });
      this.setHeaders(res, limits, limits.max - 1, limits.windowMs);
      this.sweep(now);
      return next();
    }

    if (entry.count >= limits.max) {
      const retryAfter = Math.ceil(
        (entry.firstRequest + limits.windowMs - now) / 1000,
      );
      res.setHeader('Retry-After', String(retryAfter));
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      });
      return;
    }

    entry.count += 1;
    this.setHeaders(
      res,
      limits,
      limits.max - entry.count,
      entry.firstRequest + limits.windowMs - now,
    );
    next();
  }

  /** Pick the budget for the endpoint being called. */
  private limitsFor(req: Request): Limits {
    const path = req.path ?? '';
    if (path.endsWith('/auth/me')) {
      return SESSION;
    }
    if (path.endsWith('/auth/login') || path.endsWith('/auth/register')) {
      return STRICT;
    }
    return SESSION;
  }

  private setHeaders(
    res: Response,
    limits: Limits,
    remaining: number,
    resetInMs: number,
  ): void {
    res.setHeader('X-RateLimit-Limit', String(limits.max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(remaining, 0)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetInMs / 1000)));
  }

  /** Drop expired entries so the map cannot grow without bound. */
  private sweep(now: number): void {
    if (now - this.lastSweep < HOUR) {
      return;
    }
    for (const [key, value] of this.requests.entries()) {
      if (now - value.firstRequest > HOUR) {
        this.requests.delete(key);
      }
    }
    this.lastSweep = now;
  }
}
