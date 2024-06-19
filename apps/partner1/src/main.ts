import { NestFactory } from '@nestjs/core';
import { Partner1Module } from './partner1.module';

async function bootstrap() {
  const app = await NestFactory.create(Partner1Module);
  await app.listen(process.env.PORT || 8081);
}
bootstrap();
