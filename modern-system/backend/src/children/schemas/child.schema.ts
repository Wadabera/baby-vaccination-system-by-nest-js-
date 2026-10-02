import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class VaccineDose {
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

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  notes?: string;
}

const VaccineDoseSchema = {
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
  approvedBy: { type: Types.ObjectId, ref: 'User' },
  notes: { type: String },
};

export class Contraindication {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  flaggedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  dateFlagged: Date;

  @Prop({ default: true })
  isActive: boolean;
}

const ContraindicationSchema = {
  type: { type: String, required: true },
  reason: { type: String, required: true },
  flaggedBy: { type: Types.ObjectId, ref: 'User', required: true },
  dateFlagged: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
};

export class AdverseReaction {
  @Prop({ required: true })
  vaccineType: string;

  @Prop({ required: true })
  reaction: string;

  @Prop({
    required: true,
    enum: ['mild', 'moderate', 'severe', 'life_threatening'],
  })
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';

  @Prop({ default: Date.now })
  dateReported: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop()
  treatment?: string;
}

const AdverseReactionSchema = {
  vaccineType: { type: String, required: true },
  reaction: { type: String, required: true },
  severity: {
    type: String,
    required: true,
    enum: ['mild', 'moderate', 'severe', 'life_threatening'],
  },
  dateReported: { type: Date, default: Date.now },
  reportedBy: { type: Types.ObjectId, ref: 'User', required: true },
  treatment: { type: String },
};

@Schema({ timestamps: true })
export class Child extends Document {
  @Prop({ required: true, unique: true })
  childId: string;

  @Prop({ type: Types.ObjectId, ref: 'Mother', required: true })
  motherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Clinic' })
  clinicId?: Types.ObjectId;

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

  @Prop({ type: [VaccineDoseSchema], default: [] })
  schedule: VaccineDose[];

  @Prop({
    type: {
      birthWeight: { type: Number },
      birthHeight: { type: Number },
      allergies: { type: [String], default: [] },
      contraindications: { type: [ContraindicationSchema], default: [] },
      adverseReactions: { type: [AdverseReactionSchema], default: [] },
    },
    default: {
      birthWeight: null,
      birthHeight: null,
      allergies: [],
      contraindications: [],
      adverseReactions: [],
    },
  })
  medicalInfo: {
    birthWeight?: number;
    birthHeight?: number;
    allergies: string[];
    contraindications: Contraindication[];
    adverseReactions: AdverseReaction[];
  };

  @Prop({
    type: {
      qrCode: { type: String },
      lastGenerated: { type: Date },
      version: { type: Number, default: 1 },
      shareToken: { type: String },
    },
  })
  digitalCard?: {
    qrCode?: string;
    lastGenerated?: Date;
    version: number;
    shareToken?: string;
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

export const ChildSchema = SchemaFactory.createForClass(Child);

// Create indexes. `childId` is already unique via its @Prop.
ChildSchema.index({ motherId: 1 });
ChildSchema.index({ 'personalInfo.birthDate': 1 });
ChildSchema.index({ 'schedule.dueDate': 1 });
ChildSchema.index({ 'schedule.status': 1 });
ChildSchema.index({ 'medicalInfo.contraindications.isActive': 1 });
