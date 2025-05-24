import { Module } from '@nestjs/common';
import { MeController } from './controller/me.controller';

@Module({
  controllers: [MeController]
})
export class MeModule { }
