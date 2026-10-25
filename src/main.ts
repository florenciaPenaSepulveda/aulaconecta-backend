import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarApp } from './app.setup';
import { validarEntorno } from './config/environment';

async function bootstrap() {
    validarEntorno();
    const app = await NestFactory.create(AppModule);
    configurarApp(app);
    app.enableShutdownHooks();
    await app.listen(Number(process.env.PORT) || 3000);
}
bootstrap();
