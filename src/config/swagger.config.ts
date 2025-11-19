import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Mobile App API')
  .setDescription('API documentation for Student Marketplace & Chat App')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter Firebase ID Token',
      in: 'header',
    },
    'bearer',
  )
  .build();

export const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
};