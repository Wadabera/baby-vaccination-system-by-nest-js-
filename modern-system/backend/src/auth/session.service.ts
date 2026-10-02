import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';

export interface SessionData {
  userId: string;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  private sessions: Map<string, SessionData> = new Map();
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  createSession(userId: string, ipAddress: string, userAgent: string): string {
    const sessionId = this.generateSessionId();
    const now = new Date();

    this.sessions.set(sessionId, {
      userId,
      lastActivity: now,
      ipAddress,
      userAgent,
      expiresAt: new Date(now.getTime() + this.INACTIVITY_TIMEOUT),
    });

    // Clean up expired sessions periodically
    this.cleanupExpiredSessions();

    return sessionId;
  }

  updateActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const now = new Date();
    session.lastActivity = now;
    session.expiresAt = new Date(now.getTime() + this.INACTIVITY_TIMEOUT);
    return true;
  }

  getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session || new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  invalidateSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  invalidateAllUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }

  async logAuditEvent(
    userId: string,
    action: string,
    entityType?: string,
    entityId?: string,
    details?: Record<string, any>,
  ): Promise<void> {
    // In a real implementation, this would write to an audit log database
    // For now, we'll log to console
    console.log(
      `[AUDIT] ${new Date().toISOString()} - User ${userId} - ${action}`,
      {
        entityType,
        entityId,
        details,
      },
    );

    // You could also write to MongoDB audit collection here
    // await this.auditModel.create({
    //   userId,
    //   action,
    //   entityType,
    //   entityId,
    //   details,
    //   timestamp: new Date(),
    //   ipAddress: 'TODO', // Would come from request context
    //   userAgent: 'TODO', // Would come from request context
    // });
  }
}
