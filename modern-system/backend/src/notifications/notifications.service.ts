import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from './schemas/notification.schema';
import { Child } from '../children/schemas/child.schema';
import { Mother } from '../mothers/schemas/mother.schema';
import { User } from '../users/schemas/user.schema';

export interface DoseReminder {
  patientType: 'child' | 'mother';
  patientId: string;
  patientName: string;
  vaccineName: string;
  dueDate: Date;
  phoneNumber: string;
  overdueDays: number;
}

/**
 * Builds reminder payloads and persists notifications.
 *
 * Delivery transports (SMS/email providers) are intentionally not wired up:
 * without provider credentials the service records each notification as
 * `skipped` or `pending` so the queue is inspectable rather than pretending to
 * have sent a message.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @InjectModel(Child.name) private readonly childModel: Model<Child>,
    @InjectModel(Mother.name) private readonly motherModel: Model<Mother>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /** Children and mothers with a dose due within `withinDays` or already overdue. */
  async findDueDoses(withinDays = 14): Promise<DoseReminder[]> {
    const now = new Date();
    const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    const reminders: DoseReminder[] = [];

    const children = await this.childModel
      .find({
        isActive: true,
        schedule: { $elemMatch: { status: { $in: ['pending', 'overdue'] } } },
      })
      .exec();

    for (const child of children) {
      for (const dose of child.schedule) {
        if (dose.status !== 'pending' && dose.status !== 'overdue') continue;
        if (dose.dueDate > cutoff) continue;
        reminders.push({
          patientType: 'child',
          patientId: child._id.toString(),
          patientName: `${child.personalInfo.firstName} ${child.personalInfo.lastName}`,
          vaccineName: dose.vaccineName,
          dueDate: dose.dueDate,
          phoneNumber: '',
          overdueDays: dose.dueDate < now ? daysBetween(dose.dueDate, now) : 0,
        });
      }
    }

    const mothers = await this.motherModel
      .find({
        isActive: true,
        schedule: { $elemMatch: { status: { $in: ['pending', 'overdue'] } } },
      })
      .exec();

    for (const mother of mothers) {
      for (const dose of mother.schedule) {
        if (dose.status !== 'pending' && dose.status !== 'overdue') continue;
        if (dose.dueDate > cutoff) continue;
        reminders.push({
          patientType: 'mother',
          patientId: mother._id.toString(),
          patientName: `${mother.personalInfo.firstName} ${mother.personalInfo.lastName}`,
          vaccineName: dose.vaccineName,
          dueDate: dose.dueDate,
          phoneNumber: mother.contactInfo.phoneNumber,
          overdueDays: dose.dueDate < now ? daysBetween(dose.dueDate, now) : 0,
        });
      }
    }

    return reminders.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /** Queue one reminder for a dose. */
  async queueDoseReminder(
    reminder: DoseReminder,
    channel: NotificationChannel = NotificationChannel.SMS,
  ): Promise<Notification> {
    const { patientType, patientId } = reminder;

    const recipient =
      patientType === 'child'
        ? await this.userModel.findOne({ childrenIds: patientId }).exec()
        : null;

    const subject =
      reminder.overdueDays > 0
        ? `Overdue vaccination: ${reminder.vaccineName}`
        : `Upcoming vaccination: ${reminder.vaccineName}`;

    const when =
      reminder.overdueDays > 0
        ? `was due ${reminder.overdueDays} day(s) ago`
        : `is due on ${reminder.dueDate.toDateString()}`;

    return new this.notificationModel({
      recipientId: recipient?._id,
      recipientPhone:
        reminder.phoneNumber || recipient?.profile.phoneNumber || '',
      childId: patientType === 'child' ? patientId : undefined,
      type:
        reminder.overdueDays > 0
          ? NotificationType.DOSE_OVERDUE
          : NotificationType.DOSE_DUE,
      channel,
      subject,
      body:
        `Dear parent, the ${reminder.vaccineName} vaccination for ${reminder.patientName} ` +
        `${when}. Please visit your nearest health centre.`,
      status: NotificationStatus.PENDING,
      scheduledFor: new Date(),
    }).save();
  }

  /** Queue every currently-due reminder. Returns the number queued. */
  async queueAllDueReminders(withinDays = 14): Promise<number> {
    const reminders = await this.findDueDoses(withinDays);
    let queued = 0;

    for (const reminder of reminders) {
      // Skip patients we have no way to contact.
      if (!reminder.phoneNumber) {
        await new this.notificationModel({
          recipientPhone: '',
          childId:
            reminder.patientType === 'child' ? reminder.patientId : undefined,
          type: NotificationType.DOSE_DUE,
          channel: NotificationChannel.SMS,
          subject: `Upcoming vaccination: ${reminder.vaccineName}`,
          body: `No contact number on file for ${reminder.patientName}.`,
          status: NotificationStatus.SKIPPED,
          error: 'No phone number available for this patient',
          scheduledFor: new Date(),
        }).save();
        continue;
      }

      await this.queueDoseReminder(reminder);
      queued += 1;
    }

    this.logger.log(
      `Queued ${queued} reminder(s) from ${reminders.length} due dose(s)`,
    );
    return queued;
  }

  async findAll(status?: NotificationStatus): Promise<Notification[]> {
    const query = status ? { status } : {};
    return this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .exec();
  }
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(
    0,
    Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)),
  );
}
