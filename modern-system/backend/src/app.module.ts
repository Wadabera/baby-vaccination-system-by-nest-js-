import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MothersModule } from './mothers/mothers.module';
import { ChildrenModule } from './children/children.module';
import { VaccinationsModule } from './vaccinations/vaccinations.module';
import { PostsModule } from './posts/posts.module';
import { ClinicsModule } from './clinics/clinics.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { DoctorsModule } from './doctors/doctors.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // Atlas cannot run the docker-entrypoint init script, so the unique
        // indexes declared on each schema must be built by Mongoose itself.
        //
        // The previous condition disabled this in production, which is
        // exactly where Atlas is used: a fresh Atlas cluster then silently
        // had no unique index on `email` or `username`, allowing duplicate
        // accounts. Building indexes on boot is the correct trade-off here —
        // a few hundred documents cost milliseconds.
        //
        // `MONGO_AUTO_INDEX=false` opts out for anyone who would rather
        // manage indexes out of band.
        autoIndex: configService.get<string>('MONGO_AUTO_INDEX') !== 'false',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    MothersModule,
    ChildrenModule,
    VaccinationsModule,
    PostsModule,
    ClinicsModule,
    AnalyticsModule,
    ReportsModule,
    DoctorsModule,
    NotificationsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
