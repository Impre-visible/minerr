interface CreateServerDto {
    name: string; // server name
    motd: string; // server motd 
    max_players: number; // maximum players allowed on the server
    cf_api_key: string;
    cf_modpack_url: string;
    memory: number; // in MB
    port: number; // server port
    type: "VANILLA" | "AUTO_CURSEFORGE (Forge)" | "AUTO_CURSEFORGE (NeoForge)"; // server type (e.g., "VANILLA", "CURSEFORGE", etc.)
    version: string; // server version (e.g., "1.20.1")
}