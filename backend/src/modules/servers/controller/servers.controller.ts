import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ServersService } from '../service/servers.service';

type Actions = 'start' | 'pause' | 'restart' | 'delete';

@Controller('servers')
export class ServersController {
    constructor(private readonly serversService: ServersService) { }
    @Get()
    async getServers() {
        return await this.serversService.getServers();
    }

    @Post('create')
    async createServer(@Body() createServerDto: CreateServerDto) {
        return await this.serversService.createServer(createServerDto);
    }

    @Post(':docker_id/action')
    async performAction(@Body() actionDto: { action: Actions }, @Param('docker_id') dockerId: string) {
        let data = await this.serversService.performAction(dockerId, actionDto)
        return data;
    }
}
