import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { MedicalReviewService } from './services/medical-review.service';
import { ApprovalService } from './services/approval.service';
import { ContraindicationService } from './services/contraindication.service';
import { AdverseReactionService } from './services/adverse-reaction.service';
import { Child, ChildSchema } from '../children/schemas/child.schema';
import { Mother, MotherSchema } from '../mothers/schemas/mother.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';
import {
  ContraindicationEntry,
  ContraindicationEntrySchema,
  AdverseReactionEntry,
  AdverseReactionEntrySchema,
} from '../children/schemas/contraindication-entry.schema';
import { UsersModule } from '../users/users.module';
import { ChildrenModule } from '../children/children.module';
import { MothersModule } from '../mothers/mothers.module';
import { ClinicsModule } from '../clinics/clinics.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Child.name, schema: ChildSchema },
      { name: Mother.name, schema: MotherSchema },
      { name: User.name, schema: UserSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: ContraindicationEntry.name, schema: ContraindicationEntrySchema },
      { name: AdverseReactionEntry.name, schema: AdverseReactionEntrySchema },
    ]),
    UsersModule,
    ChildrenModule,
    MothersModule,
    ClinicsModule,
  ],
  controllers: [DoctorsController],
  providers: [
    DoctorsService,
    MedicalReviewService,
    ApprovalService,
    ContraindicationService,
    AdverseReactionService,
  ],
  exports: [
    DoctorsService,
    MedicalReviewService,
    ApprovalService,
    ContraindicationService,
    AdverseReactionService,
  ],
})
export class DoctorsModule {}
