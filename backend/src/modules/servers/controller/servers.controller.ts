import { Body, Controller, Get, Post } from '@nestjs/common';
import { ServersService } from '../service/servers.service';

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
}
