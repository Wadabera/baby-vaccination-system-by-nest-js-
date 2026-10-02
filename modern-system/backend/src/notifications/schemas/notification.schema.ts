import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum NotificationType {
  DOSE_DUE = 'dose_due',
  DOSE_OVERDUE = 'dose_overdue',
  NEW_REGISTRATION = 'new_registration',
}

/**
 * A queued notification.
 *
 * The PHP system sent no messages at all, so this is new functionality: it
 * backs the "notify parent about the next dose" workflow that the README
 * describes but the old code never implemented.
 */
@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  recipientId?: Types.ObjectId;

  @Prop({ required: true })
  recipientPhone: string;

  @Prop({ type: Types.ObjectId, ref: 'Child' })
  childId?: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(NotificationType) })
  type: NotificationType;

  @Prop({ required: true, enum: Object.values(NotificationChannel) })
  channel: NotificationChannel;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    default: NotificationStatus.PENDING,
    enum: Object.values(NotificationStatus),
  })
  status: NotificationStatus;

  @Prop()
  scheduledFor?: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  error?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ status: 1, scheduledFor: 1 });
NotificationSchema.index({ childId: 1, type: 1 });
