import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.ADMIN_WEB_URL ?? 'http://localhost:4200',
  });

  if (process.env.NODE_ENV === 'production') {
    const staticRoot =
      process.env.ADMIN_STATIC_ROOT ?? join(process.cwd(), 'dist/apps/admin/browser');
    if (existsSync(staticRoot)) {
      app.useStaticAssets(staticRoot);
      const express = app.getHttpAdapter().getInstance();
      express.get('/*path', (req: any, res: any, next: any) => {
        if (req.path.startsWith('/api')) return next();
        return res.sendFile(join(staticRoot, 'index.html'));
      });
    }
  }

  await app.listen(Number(process.env.ADMIN_PORT ?? 3001), '0.0.0.0');
}
bootstrap();
