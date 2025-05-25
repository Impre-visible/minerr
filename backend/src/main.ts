import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getJWTSecret } from './utils';
import * as dockerode from 'dockerode';

const pullImage = async () => {
  const docker = new dockerode();
  try {
    const imageName = 'itzg/minecraft-server:latest';
    const images = await docker.listImages();
    const imageExists = images.some(image => image.RepoTags && image.RepoTags.includes(imageName));
    if (!imageExists) {
      await docker.pull(imageName, { authconfig: { username: process.env.DOCKER_USERNAME, password: process.env.DOCKER_PASSWORD } });
    }
  } catch (error) {
    throw new Error(`Failed to pull Docker image: ${error.message}`);
  }
};

async function bootstrap() {
  await pullImage();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  process.env.JWT_SECRET = getJWTSecret();
  await app.listen(process.env.BACKEND_PORT ?? 3000);
  console.log('\n\n[Minerr] - Backend is running on port', process.env.BACKEND_PORT ?? 3000, '\n\n');
}
bootstrap();
