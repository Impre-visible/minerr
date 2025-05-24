import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getJWTSecret } from './utils';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  process.env.JWT_SECRET = getJWTSecret();
  await app.listen(process.env.BACKEND_PORT ?? 3000);
  console.log('\n\n[Minerr] - Backend is running on port', process.env.BACKEND_PORT ?? 3000, '\n\n');
}
bootstrap();
