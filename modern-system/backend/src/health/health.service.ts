import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConnectionStates, Model } from 'mongoose';
import { Child } from '../children/schemas/child.schema';
import { Mother } from '../mothers/schemas/mother.schema';
import { User } from '../users/schemas/user.schema';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  database: 'connected' | 'disconnected';
  counts: { users: number; mothers: number; children: number };
  checkedAt: Date;
}

export interface DueCohort {
  vaccineName: string;
  pending: number;
  overdue: number;
  total: number;
}

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  constructor(
    @InjectModel(Child.name) private readonly childModel: Model<Child>,
    @InjectModel(Mother.name) private readonly motherModel: Model<Mother>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /** Liveness/readiness probe plus record counts. */
  async check(): Promise<HealthCheckResult> {
    let database: HealthCheckResult['database'] = 'disconnected';
    let counts = { users: 0, mothers: 0, children: 0 };

    try {
      // Compare against the driver's enum member rather than the bare `1`.
      if (this.userModel.db.readyState !== ConnectionStates.connected) {
        throw new Error(
          `MongoDB readyState is ${this.userModel.db.readyState}`,
        );
      }
      database = 'connected';
      const [users, mothers, children] = await Promise.all([
        this.userModel.countDocuments(),
        this.motherModel.countDocuments(),
        this.childModel.countDocuments(),
      ]);
      counts = { users, mothers, children };
    } catch {
      // Leave `database` as disconnected and report degraded below.
    }

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      database,
      counts,
      checkedAt: new Date(),
    };
  }

  async stats() {
    const [totalChildren, totalMothers, totalUsers] = await Promise.all([
      this.childModel.countDocuments({ isActive: true }),
      this.motherModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ isActive: true }),
    ]);

    const childrenByAgeBand = await this.childModel.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y',
              date: '$personalInfo.birthDate',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return {
      totalChildren,
      totalMothers,
      totalUsers,
      childrenByBirthYear: childrenByAgeBand.map((row) => ({
        year: row._id,
        count: row.count,
      })),
    };
  }

  /** Aggregate pending/overdue counts per vaccine across children and mothers. */
  async dueCohorts(withinDays = 14): Promise<DueCohort[]> {
    const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    const now = new Date();

    const match = {
      isActive: true,
      schedule: {
        $elemMatch: {
          status: { $in: ['pending', 'overdue'] },
          dueDate: { $lte: cutoff },
        },
      },
    };

    const [children, mothers] = await Promise.all([
      this.childModel.aggregate([
        { $match: match },
        { $unwind: '$schedule' },
        { $match: { 'schedule.status': { $in: ['pending', 'overdue'] } } },
      ]),
      this.motherModel.aggregate([
        { $match: match },
        { $unwind: '$schedule' },
        { $match: { 'schedule.status': { $in: ['pending', 'overdue'] } } },
      ]),
    ]);

    const buckets = new Map<string, DueCohort>();

    for (const row of [...children, ...mothers]) {
      const name: string = row.schedule.vaccineName;
      const bucket = buckets.get(name) ?? {
        vaccineName: name,
        pending: 0,
        overdue: 0,
        total: 0,
      };

      // The stored status can lag reality, so derive overdue from the date.
      if (row.schedule.status === 'overdue' || row.schedule.dueDate < now) {
        bucket.overdue += 1;
      } else {
        bucket.pending += 1;
      }
      bucket.total += 1;
      buckets.set(name, bucket);
    }

    return [...buckets.values()].sort((a, b) => b.total - a.total);
  }

  /** Flip elapsed pending doses to overdue. Returns the number of documents changed. */
  async refreshOverdue(): Promise<number> {
    const now = new Date();
    const [children, mothers] = await Promise.all([
      this.childModel.updateMany(
        { 'schedule.status': 'pending', 'schedule.dueDate': { $lte: now } },
        { $set: { 'schedule.$.status': 'overdue' } },
      ),
      this.motherModel.updateMany(
        { 'schedule.status': 'pending', 'schedule.dueDate': { $lte: now } },
        { $set: { 'schedule.$.status': 'overdue' } },
      ),
    ]);

    return (children.modifiedCount ?? 0) + (mothers.modifiedCount ?? 0);
  }
}
