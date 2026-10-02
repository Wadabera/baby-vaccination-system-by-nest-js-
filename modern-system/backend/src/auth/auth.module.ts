import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionService } from './session.service';
import { SessionMiddleware } from './middleware/session.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import type { StringValue } from 'ms';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'insecure-dev-secret'),
        signOptions: {
          // Each token type sets its own `expiresIn` at sign time; this is only
          // the fallback used when a caller omits it.
          expiresIn: configService.get<string>(
            'JWT_EXPIRES_IN',
            '1h',
          ) as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SessionService],
  exports: [AuthService, SessionService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply rate limiting to all auth endpoints
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: 'auth/*', method: RequestMethod.ALL });

    // Apply session middleware to all non-auth endpoints
    // Session tracking is optional (see SessionMiddleware), so it runs on every
    // route and simply passes through when no `x-session-token` is sent.
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}
