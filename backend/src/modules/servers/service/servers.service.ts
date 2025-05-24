import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as dockerode from 'dockerode';

@Injectable()
export class ServersService {
    private docker: dockerode;

    constructor() {
        this.docker = new dockerode();
        this.docker.getImage('itzg/minecraft-server:latest')
    }

    async getServers(): Promise<dockerode.ContainerInspectInfo[]> {
        try {
            const containers = await Promise.all((await this.docker.listContainers({ all: true })).filter(container => container.Image.includes('itzg/minecraft-server')).map(async container => await this.docker.getContainer(container.Id).inspect()));
            return containers;
        } catch (error) {
            throw new Error(`Failed to retrieve servers: ${error.message}`);
        }
    }

    async createServer(createServerDto: CreateServerDto): Promise<dockerode.ContainerInspectInfo> {
        let envs: string[] = []
        envs.push('EULA=TRUE');
        envs.push(`TYPE=${createServerDto.type}`);
        envs.push(`VERSION=${createServerDto.version}`);
        envs.push(`MEMORY=${createServerDto.memory}M`);

        if (createServerDto.type === 'CURSEFORGE') {
            envs.push(`CF_API_KEY=${createServerDto.cf_api_key}`);
            envs.push(`CF_PAGE_URL=${createServerDto.cf_modpack_url}`);
        }

        try {
            let name = 'minecraft-server-' + Date.now();
            const container = await this.docker.createContainer({
                Image: 'docker.io/itzg/minecraft-server', // Image pulled from Docker Hub
                name,
                Env: envs,
                Tty: true,
                ExposedPorts: { '25565/tcp': {} },
                HostConfig: {
                    PortBindings: {
                        '25565/tcp': [{ HostPort: createServerDto.port.toString() }],
                    },
                },
            });
            await container.start();
            console.log(`Server ${name} created and started successfully.`);
            return container.inspect();
        } catch (error) {
            if (error.message.includes('port is already allocated')) {
                throw new InternalServerErrorException(`Port ${createServerDto.port} is already in use. Please choose a different port.`);
            }
            throw new InternalServerErrorException(error.message);
        }
    }

    async performAction(dockerId: string, actionDto: { action: 'start' | 'pause' | 'restart' | 'delete' }): Promise<{
        success: boolean;
        message: string;
    }> {
        const container = this.docker.getContainer(dockerId);
        let data = { success: true, message: '' };
        try {
            switch (actionDto.action) {
                case 'start':
                    try {
                        await container.start();
                    } catch (error) {
                        await container.unpause();
                    }
                    data.message = `Server ${dockerId} started successfully.`;
                    return data;
                case 'pause':
                    await container.pause();
                    data.message = `Server ${dockerId} started successfully.`;
                    return data;
                case 'restart':
                    await container.restart();
                    data.message = `Server ${dockerId} started successfully.`;
                    return data;
                case 'delete':
                    await container.remove({ force: true });
                    data.message = `Server ${dockerId} started successfully.`;
                    return data;
                default:
                    throw new InternalServerErrorException(`Unknown action: ${actionDto.action}`);
            }
        } catch (error) {
            data.success = false;
            data.message = `Failed to perform action ${actionDto.action} on server ${dockerId}: ${error.message}`;
            throw new InternalServerErrorException(data.message);
        }
    }
}
