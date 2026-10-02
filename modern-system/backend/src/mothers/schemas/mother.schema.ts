import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * A single tetanus toxoid / Rh dose for a mother.
 *
 * Mirrors the child's `VaccineDose` so both populations report due dates,
 * administration dates and status the same way. This replaces the legacy
 * `mother_vaccin` table, which only stored boolean flags.
 */
export class MotherVaccineDose {
  @Prop({ required: true })
  vaccineName: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({
    default: 'pending',
    enum: ['pending', 'completed', 'missed', 'overdue'],
  })
  status: string;

  @Prop()
  givenDate?: Date;

  @Prop()
  batchNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  administeredBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Clinic' })
  clinicId?: Types.ObjectId;

  @Prop()
  notes?: string;
}

const MotherVaccineDoseSchema = {
  vaccineName: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'completed', 'missed', 'overdue'],
  },
  givenDate: { type: Date },
  batchNumber: { type: String },
  administeredBy: { type: Types.ObjectId, ref: 'User' },
  clinicId: { type: Types.ObjectId, ref: 'Clinic' },
  notes: { type: String },
};

@Schema({ timestamps: true })
export class Mother extends Document {
  @Prop({ required: true, unique: true })
  motherId: string;

  @Prop({
    type: {
      firstName: { type: String, required: true },
      middleName: { type: String },
      lastName: { type: String, required: true },
      birthDate: { type: Date, required: true },
      bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
      photoUrl: { type: String },
    },
    required: true,
  })
  personalInfo: {
    firstName: string;
    middleName?: string;
    lastName: string;
    birthDate: Date;
    bloodType?: string;
    photoUrl?: string;
  };

  @Prop({
    type: {
      phoneNumber: { type: String, required: true },
      alternatePhone: { type: String },
      email: { type: String },
    },
    required: true,
  })
  contactInfo: {
    phoneNumber: string;
    alternatePhone?: string;
    email?: string;
  };

  @Prop({
    type: {
      zone: { type: String, required: true },
      wereda: { type: String, required: true },
      kebele: { type: String, required: true },
      houseNumber: { type: String },
      gpsCoordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    required: true,
  })
  address: {
    zone: string;
    wereda: string;
    kebele: string;
    houseNumber?: string;
    gpsCoordinates?: {
      lat: number;
      lng: number;
    };
  };

  /** TT1-TT5 plus Rh screening, each with due/administration dates. */
  @Prop({ type: [MotherVaccineDoseSchema], default: [] })
  schedule: MotherVaccineDose[];

  @Prop({
    type: {
      allergies: { type: [String], default: [] },
      chronicConditions: { type: [String], default: [] },
      previousAdverseReactions: { type: [String], default: [] },
      notes: { type: String },
    },
    default: {
      allergies: [],
      chronicConditions: [],
      previousAdverseReactions: [],
      notes: '',
    },
  })
  medicalHistory: {
    allergies: string[];
    chronicConditions: string[];
    previousAdverseReactions: string[];
    notes?: string;
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Child' }], default: [] })
  childrenIds: Types.ObjectId[];

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

export const MotherSchema = SchemaFactory.createForClass(Mother);

// Create indexes. `motherId` is already unique via its @Prop.
MotherSchema.index({ 'contactInfo.phoneNumber': 1 });
MotherSchema.index({ 'schedule.dueDate': 1 });
MotherSchema.index({ 'schedule.status': 1 });
MotherSchema.index({
  'address.zone': 1,
  'address.wereda': 1,
  'address.kebele': 1,
});
MotherSchema.index({ 'medicalHistory.allergies': 1 });
MotherSchema.index({ childrenIds: 1 });
