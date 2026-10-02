import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child } from '../children/schemas/child.schema';
import { Mother } from '../mothers/schemas/mother.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<Child>,
    @InjectModel(Mother.name) private motherModel: Model<Mother>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getDashboardStats() {
    const totalChildren = await this.childModel.countDocuments();
    const totalMothers = await this.motherModel.countDocuments();
    const totalUsers = await this.userModel.countDocuments();

    // Calculate vaccination coverage (e.g., children with at least one completed vaccine)
    const fullyVaccinated = await this.childModel.countDocuments({
      schedule: { $not: { $elemMatch: { status: 'pending' } } },
    });

    const pendingVaccinesToday = await this.childModel.countDocuments({
      schedule: {
        $elemMatch: {
          status: 'pending',
          dueDate: {
            $lte: new Date(),
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      },
    });

    return {
      totalChildren,
      totalMothers,
      totalUsers,
      fullyVaccinated,
      coverageRate:
        totalChildren > 0 ? (fullyVaccinated / totalChildren) * 100 : 0,
      pendingToday: pendingVaccinesToday,
    };
  }
}
