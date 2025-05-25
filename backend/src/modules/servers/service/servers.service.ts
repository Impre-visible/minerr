import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as dockerode from 'dockerode';
import { Readable } from 'stream';

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

    private versionToTag(version: string): string {
        const versionParts = version.split('.');
        if (versionParts.length >= 2) {
            version = `${versionParts[0]}.${versionParts[1]}`;
        }
        const minecraftJavaVersions: Record<string, string> = {
            "1.1": "java8-jdk",
            "1.2": "java8-jdk",
            "1.3": "java8-jdk",
            "1.4": "java8-jdk",
            "1.5": "java8-jdk",
            "1.6": "java8-jdk",
            "1.7": "java8-jdk",
            "1.8": "java8-jdk",
            "1.9": "java8-jdk",
            "1.10": "java8-jdk",
            "1.11": "java8-jdk",
            "1.12": "java8-jdk",
            "1.13": "java8-jdk",
            "1.14": "java8-jdk",
            "1.15": "java8-jdk",
            "1.16": "java8-jdk",
            "1.17": "java16-openj9",
            "1.18": "java17",
            "1.19": "java17",
            "1.20": "java17",
            "1.21": "java17",
        }

        return minecraftJavaVersions[version] || 'java17'; // Default to java17 if version is not found
    }

    async createServer(createServerDto: CreateServerDto): Promise<dockerode.ContainerInspectInfo> {

        const imageTag = this.versionToTag(createServerDto.version);

        const imageName = `itzg/minecraft-server:${imageTag}`;
        const images = await this.docker.listImages();
        const imageExists = images.some(image => image.RepoTags && image.RepoTags.includes(imageName));
        if (!imageExists) {
            await this.docker.pull(imageName);
        }


        let envs: string[] = []
        envs.push('EULA=TRUE');
        envs.push(`TYPE=${createServerDto.type}`);
        envs.push(`VERSION=${createServerDto.version}`);
        envs.push(`MEMORY=${createServerDto.memory}M`);
        envs.push(`FETCH_TLS_HANDSHAKE_TIMEOUT=PT120S`); // 120 seconds timeout for TLS handshake
        envs.push(`ENABLE_AUTOPAUSE=true`);

        if (createServerDto.type === 'AUTO_CURSEFORGE') {
            envs.push(`CF_API_KEY=${createServerDto.cf_api_key}`);
            envs.push(`CF_PAGE_URL=${createServerDto.cf_modpack_url}`);
        }

        try {
            let name = 'minecraft-server-' + Date.now();
            const container = await this.docker.createContainer({
                Image: 'docker.io/' + imageName,
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

    async getLogs(containerId: string, index: number): Promise<string[]> {
        const container = this.docker.getContainer(containerId);

        try {
            const logBuffer = await container.logs({
                follow: false, // Disable streaming for faster retrieval
                stdout: true,
                stderr: true,
                tail: index > 0 ? 100 : 'all' as any,
            });

            const logs = logBuffer
                .toString()
                .split('\n')
                .filter(line => line.trim() !== '');

            if (logs.length === 0) {
                throw new InternalServerErrorException(`No logs found for container ${containerId}`);
            }

            return logs;
        } catch (error) {
            throw new InternalServerErrorException(`Failed to retrieve logs for container ${containerId}: ${error.message}`);
        }
    }
}
