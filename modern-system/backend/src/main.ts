import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  const port = Number(config.get('PORT', 5000));

  // Render (and any other TLS-terminating proxy) forwards the real client IP
  // in `x-forwarded-for`. Without this, `req.ip` is the proxy's own address
  // for every request, so the per-IP rate limiter would treat the entire
  // internet as one client and lock the whole site out after 30 sign-ins.
  //
  // `set()` lives on the underlying Express instance, not on the Nest
  // wrapper, hence the hop through the HTTP adapter.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Comma-separated so several origins (production, preview deploys, local)
  // can be allowed at once. An unset value must not become `['undefined']`,
  // which would reject every request.
  const rawOrigins = config.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  const corsOrigin = rawOrigins
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigin.length > 0 ? corsOrigin : true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Lets NestJS close the HTTP server and the Mongo connection on SIGTERM.
  // Render sends SIGTERM before recycling a deploy; without this the process
  // is killed mid-request and in-flight logins fail with a 502.
  app.enableShutdownHooks();

  // Bind to all interfaces. Some hosts only forward to 0.0.0.0.
  await app.listen(port, '0.0.0.0');

  logger.log(`API listening on port ${port} (prefix /api)`);
  logger.log(`CORS allowed for: ${corsOrigin.join(', ') || 'any'}`);
}

void bootstrap();
