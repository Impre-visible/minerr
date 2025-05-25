import { Body, Controller, Get, Param, Post, Sse } from '@nestjs/common';
import { ServersService } from '../service/servers.service';
import { interval, map, mergeMap, Observable } from 'rxjs';

export type Actions = 'start' | 'pause' | 'restart' | 'delete' | 'command';

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
    async performAction(@Body() actionDto: { action: Actions, params?: string }, @Param('docker_id') dockerId: string) {
        let data = await this.serversService.performAction(dockerId, actionDto)
        return data;
    }

    @Sse(':container_id/logs')
    getLogs(@Param('container_id') containerId: string): Observable<{ data: string[], index: number }> {
        let index = 0;
        let previousLogs: string[] = [];
        return interval(100).pipe(
            mergeMap(async () => {
                const currentLogs = await this.serversService.getLogs(containerId, index);
                if (JSON.stringify(currentLogs) !== JSON.stringify(previousLogs)) {
                    previousLogs = currentLogs;
                    return { data: currentLogs, index: ++index };
                }
                return null;
            }),
            map((result) => {
                if (result) {
                    return { data: result.data, index: result.index };
                }
                return null;
            }),
            mergeMap((result) => result ? [result] : [])
        );
    }
}
