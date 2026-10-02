import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Roles carried over from the legacy PHP system, which used
 * `admin` / `registrar` (registration desk) / `health` (clinical staff).
 * `registrar` keeps the PHP meaning and `doctor` replaces `health`, since the
 * clinical module is doctor-facing (medical review / approvals).
 */
export enum UserRole {
  ADMIN = 'admin',
  REGISTRAR = 'registrar',
  DOCTOR = 'doctor',
  PARENT = 'parent',
}

@Schema({ timestamps: true })
export class User extends Document {
  /**
   * Login identifier kept from the PHP system, where users signed in with a
   * `username` column (e.g. "Nati"). Kept optional so self-registered
   * parents can be created with only an email address.
   */
  @Prop({ unique: true, lowercase: true, trim: true, sparse: true })
  username?: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  /**
   * Legacy MD5 hash from the MySQL `users.password` column, used only to keep
   * migrated accounts able to log in once. Cleared as soon as the password is
   * changed or reset through the new API.
   */
  @Prop({ select: false })
  legacyPasswordHash?: string;

  @Prop({
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.PARENT,
  })
  role: UserRole;

  @Prop({
    type: {
      firstName: { type: String, required: true },
      middleName: { type: String },
      lastName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      photoUrl: { type: String },
      birthDate: { type: Date },
    },
    required: true,
  })
  profile: {
    firstName: string;
    middleName?: string;
    lastName: string;
    phoneNumber: string;
    photoUrl?: string;
    birthDate?: Date;
  };

  @Prop({ type: Types.ObjectId, ref: 'Clinic' })
  clinicId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Child' }], default: [] })
  childrenIds: Types.ObjectId[];

  @Prop({
    type: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
      },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'Africa/Addis_Ababa' },
    },
    default: {
      notifications: { email: true, sms: true, push: false },
      language: 'en',
      timezone: 'Africa/Addis_Ababa',
    },
  })
  settings: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: string;
    timezone: string;
  };

  @Prop({
    type: {
      lastLogin: { type: Date },
      failedAttempts: { type: Number, default: 0 },
      lockedUntil: { type: Date },
      mfaEnabled: { type: Boolean, default: false },
    },
    default: {
      lastLogin: null,
      failedAttempts: 0,
      lockedUntil: null,
      mfaEnabled: false,
    },
  })
  security: {
    lastLogin: Date | null;
    failedAttempts: number;
    lockedUntil: Date | null;
    mfaEnabled: boolean;
  };

  @Prop({
    type: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      createdBy: { type: Types.ObjectId, ref: 'User' },
      updatedBy: { type: Types.ObjectId, ref: 'User' },
    },
  })
  audit: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes. `email` and `username` are already unique via their @Prop.
UserSchema.index({ role: 1 });
UserSchema.index({ clinicId: 1 });
UserSchema.index({ 'profile.phoneNumber': 1 });
UserSchema.index({ childrenIds: 1 });
UserSchema.index({ isActive: 1 });
