import { Injectable } from '@nestjs/common';
import * as dockerode from 'dockerode';

@Injectable()
export class ServersService {
    private docker: dockerode;

    constructor() {
        this.docker = new dockerode();
    }

    async getServers(): Promise<dockerode.ContainerInfo[]> {
        try {
            const containers = await (await this.docker.listContainers({ all: true })).filter(container => container.Image.startsWith('itzg/minecraft-server'));
            console.log('Retrieved containers:', containers);
            return containers;
        } catch (error) {
            throw new Error(`Failed to retrieve servers: ${error.message}`);
        }
    }

    async createServer(createServerDto: CreateServerDto): Promise<dockerode.ContainerInspectInfo> {
        try {
            let name = 'minecraft-server-' + Date.now();
            const container = await this.docker.createContainer({
                Image: 'itzg/minecraft-server',
                name,
                Env: Object.entries(createServerDto.env).map(([key, value]) => `${key}=${value}`),
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
            throw new Error(`Failed to create server: ${error.message}`);
        }
    }
}
