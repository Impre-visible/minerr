import { networkInterfaces } from 'os';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

// Génère le secret une seule fois au chargement du module
const JWT_SECRET = (() => {
    const nets = networkInterfaces();
    const ipAddresses = Object.values(nets)
        .flat()
        .filter((details) => details?.family === 'IPv4' && !details.internal)
        .map((detail) => detail?.address);

    const macAddresses = Object.values(nets)
        .flat()
        .filter((details) => details?.mac !== '00:00:00:00:00:00')
        .map((detail) => detail?.mac);

    const os = process.platform;
    const nodeVersion = process.version;
    const hostname = execSync('hostname').toString().trim();

    const serverInfo = {
        ipAddresses,
        macAddresses,
        os,
        nodeVersion,
        hostname,
    };

    const serverInfoString = JSON.stringify(serverInfo);
    return crypto.createHash('sha256').update(serverInfoString).digest('hex');
})();

export function getJWTSecret(): string {
    return JWT_SECRET;
}
