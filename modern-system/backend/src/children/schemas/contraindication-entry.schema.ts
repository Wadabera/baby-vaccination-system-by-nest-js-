import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Severity of an adverse reaction following a vaccination.
 * `life_threatening` is included because the doctors module reports on it.
 */
export enum ReactionSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  LIFE_THREATENING = 'life_threatening',
}

export const REACTION_SEVERITIES = Object.values(ReactionSeverity);

/** Severities that should block further vaccination pending medical review. */
export const BLOCKING_SEVERITIES: readonly ReactionSeverity[] = [
  ReactionSeverity.SEVERE,
  ReactionSeverity.LIFE_THREATENING,
];

/**
 * A contraindication stands as a separate collection entry rather than an
 * embedded array so that it carries its own audit trail and can be queried
 * across all patients ("who needs review?").
 */
@Schema({ timestamps: true })
export class ContraindicationEntry extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Child', required: true, index: true })
  childId: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  flaggedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  dateFlagged: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop()
  clinicalEvidence?: string;

  @Prop({
    enum: ['permanent', 'temporary', 'conditional'],
    default: 'temporary',
  })
  duration?: 'permanent' | 'temporary' | 'conditional';

  @Prop()
  reviewDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  removedBy?: Types.ObjectId;

  @Prop()
  removedAt?: Date;

  @Prop()
  removalReason?: string;
}

export const ContraindicationEntrySchema = SchemaFactory.createForClass(
  ContraindicationEntry,
);

ContraindicationEntrySchema.index({ childId: 1, isActive: 1 });
ContraindicationEntrySchema.index({ childId: 1, dateFlagged: -1 });

/** A reported adverse reaction following a vaccination. */
@Schema({ timestamps: true })
export class AdverseReactionEntry extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Child', required: true, index: true })
  childId: Types.ObjectId;

  @Prop({ required: true })
  vaccineType: string;

  @Prop({ required: true })
  reaction: string;

  @Prop({ required: true, enum: REACTION_SEVERITIES })
  severity: ReactionSeverity;

  @Prop({ default: Date.now })
  dateReported: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop()
  treatment?: string;

  @Prop()
  onsetDate?: Date;

  @Prop()
  duration?: string;

  @Prop()
  outcome?: string;

  @Prop()
  clinicalNotes?: string;

  @Prop()
  batchNumber?: string;

  @Prop()
  followUpRequired?: boolean;
}

export const AdverseReactionEntrySchema =
  SchemaFactory.createForClass(AdverseReactionEntry);

AdverseReactionEntrySchema.index({ childId: 1, dateReported: -1 });
AdverseReactionEntrySchema.index({ severity: 1 });
