import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { MockFirebaseAuthGuard } from './mock-firebase-auth.guard';

type CreateE2eAppOptions = {
  controllers: any[];
  providers: any[];
};

/**
 * Helper dựng Nest app cho e2e theo kiểu mocked providers.
 */
export async function createE2eApp(options: CreateE2eAppOptions): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    controllers: options.controllers,
    providers: options.providers,
  })
    .overrideGuard(FirebaseAuthGuard)
    .useClass(MockFirebaseAuthGuard)
    .compile();

  const app = moduleFixture.createNestApplication();

  // Bật validation để có case invalid/valid dựa trên DTO (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  await app.init();
  return app;
}
