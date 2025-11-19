import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) => {
      console.log('Validation Errors:', errors);
      return new BadRequestException(errors);
    },
  }));

  
  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('Authentication endpoints using Firebase + NestJS')
    .setVersion('1.0')
    .addBearerAuth() // thêm header Authorization: Bearer
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
