import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChildrenController } from './children.controller';
import { ChildrenService } from './children.service';
import { Child, ChildSchema } from './schemas/child.schema';
import {
  ContraindicationEntry,
  ContraindicationEntrySchema,
  AdverseReactionEntry,
  AdverseReactionEntrySchema,
} from './schemas/contraindication-entry.schema';
import { MothersModule } from '../mothers/mothers.module';
import { UsersModule } from '../users/users.module';
import { ClinicsModule } from '../clinics/clinics.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Child.name, schema: ChildSchema },
      { name: ContraindicationEntry.name, schema: ContraindicationEntrySchema },
      { name: AdverseReactionEntry.name, schema: AdverseReactionEntrySchema },
    ]),
    MothersModule,
    UsersModule,
    ClinicsModule,
  ],
  controllers: [ChildrenController],
  providers: [ChildrenService],
  exports: [ChildrenService],
})
export class ChildrenModule {}
