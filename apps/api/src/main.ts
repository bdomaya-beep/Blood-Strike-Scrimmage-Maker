import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const port = Number(
    configService.get<string>('PORT') ?? configService.get<string>('API_PORT') ?? '3001',
  );
  const rawOrigins = configService.get<string>('WEB_BASE_URL', 'http://localhost:3000');
  const origins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  const origin = origins.length === 1 ? origins[0] : origins;

  app.setGlobalPrefix('api/v1');

  // Railway health probe endpoint.
  app.getHttpAdapter().get('/api/v1/health', (_req: unknown, res: { status: (code: number) => { json: (body: { status: string; timestamp: string }) => void } }) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Blood Strike Scrim Hub API')
    .setDescription('REST and WebSocket API for BSSH platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`BSSH API running on port ${port}`);
}

bootstrap();
