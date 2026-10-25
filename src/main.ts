import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  app.enableCors({
    origin: '*', 
    credentials: true, 
  });

  await app.listen(Number(process.env.PORT) || 3000);
}
bootstrap();
