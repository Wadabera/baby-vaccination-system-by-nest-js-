import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MothersController } from './mothers.controller';
import { MothersService } from './mothers.service';
import { Mother, MotherSchema } from './schemas/mother.schema';
import { Child, ChildSchema } from '../children/schemas/child.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mother.name, schema: MotherSchema },
      { name: Child.name, schema: ChildSchema },
    ]),
  ],
  controllers: [MothersController],
  providers: [MothersService],
  exports: [MothersService],
})
export class MothersModule {}
