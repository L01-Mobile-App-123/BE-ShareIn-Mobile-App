import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { corsConfig } from '@config/cors.config';
import { swaggerConfig, swaggerOptions } from '@config/swagger.config';
import { validationConfig } from '@config/validation.config';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors(corsConfig);

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(new ValidationPipe(validationConfig));

  // Accept raw text/plain bodies so endpoints can handle plain text notifications
  app.use(express.text({ type: 'text/*' }));

  // Swagger
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, swaggerOptions);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  // console.log(`🚀 Server is running on: http://localhost:${port}`);
  // console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
