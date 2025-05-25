import { Body, Controller, Get, Param, Post, Sse } from '@nestjs/common';
import { ServersService } from '../service/servers.service';
import { interval, map, mergeMap, Observable } from 'rxjs';

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

    @Sse(':container_id/logs')
    getLogs(@Param('container_id') containerId: string): Observable<{ data: string[], index: number }> {
        let index = 0;
        return interval(1000).pipe(
            map(async () => ({
                data: await this.serversService.getLogs(containerId, index),
                index: ++index
            })),
            mergeMap(async (result) => ({
                data: (await result).data,
                index: (await result).index
            }))
        );
    }
}
