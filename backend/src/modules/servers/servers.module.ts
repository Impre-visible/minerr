import { Module } from '@nestjs/common';
import { ServersService } from './service/servers.service';
import { ServersController } from './controller/servers.controller';

@Module({
  providers: [ServersService],
  controllers: [ServersController]
})
export class ServersModule {}
