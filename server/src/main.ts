import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Razorpay webhooks need the raw request body for signature verification.
    rawBody: true,
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  const origins = (config.get<string>('CORS_ORIGINS') ?? 'http://localhost:5175')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin) || origins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Idempotency-Key', 'Razorpay-Signature'],
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Servora Marketplace API')
    .setDescription(
      [
        'Production-oriented API for the Servora multi-vendor local services marketplace.',
        '',
        '**Auth** — use `POST /api/auth/login`, then click Authorize and paste the access token.',
        '**Demo accounts** — customer@servora.demo / vendor@servora.demo / admin@servora.demo, password `demo1234`.',
        '**Money** — all monetary values are integers in paise (₹1 = 100).',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('Health', 'Liveness and dependency checks')
    .addTag('Auth', 'Registration, login, refresh, OTP and password recovery')
    .addTag('Catalog', 'Categories, vendors and services')
    .addTag('Availability', 'Real slot calculation for a service, staff member and date range')
    .addTag('Bookings', 'Transaction-safe booking engine')
    .addTag('Payments', 'Razorpay orders, verification and webhooks')
    .addTag('Reviews', 'Verified reviews and vendor replies')
    .addTag('Coupons', 'Discount validation and redemption')
    .addTag('Payouts', 'Vendor earnings and payout batches')
    .addTag('Disputes', 'Customer/vendor conflict resolution')
    .addTag('Notifications', 'In-app, email and SMS delivery')
    .addTag('Admin', 'Marketplace administration')
    .addTag('Vendor', 'Vendor workspace')
    .addTag('Customer', 'Customer workspace')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', operationsSorter: 'alpha' },
    customSiteTitle: 'Servora API docs',
  });

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`API ready on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
