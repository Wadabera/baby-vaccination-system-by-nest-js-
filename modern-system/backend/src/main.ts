import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  const port = Number(config.get('PORT', 5000));
  const corsOrigin = config
    .get('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((origin: string) => origin.trim());

  app.enableCors({ origin: corsOrigin, credentials: true });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(port);

  logger.log(`API listening on http://localhost:${port}/api`);
}

void bootstrap();
