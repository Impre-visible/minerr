
import dockerode from "dockerode";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Button } from "./ui/button";
import { LogsIcon, PauseIcon, PlayIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { usePost } from "@/hooks/use-post";
import { useEffect } from "react";

const formatMemory = (memoryAsMb: string): string => {
    const memoryInMb = parseInt(memoryAsMb, 10);
    if (isNaN(memoryInMb)) return "N/A";

    return `${(memoryInMb / 1024)} Gb`;
}

function ActionButton({ icon: Icon, onClick, text, disabled }: { icon: React.ComponentType<any>, onClick: () => void, text: string, disabled?: boolean }) {
    return (
        <Tooltip>
            <TooltipTrigger className="flex items-center">
                <Button
                    variant="outline"
                    onClick={onClick}
                    disabled={disabled}
                >
                    <Icon className="w-4 h-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-primary text-secondary">
                {text}
            </TooltipContent>
        </Tooltip>
    );
}

function ServerItem({ server, refreshServers }: { server: dockerode.ContainerInspectInfo, refreshServers: () => void }) {
    const { execute, data, isLoading } = usePost(`/servers/${server.Id}/action`);

    const statusColors: Record<string, string> = {
        running: "bg-green-300 text-green-800",
        exited: "bg-red-300 text-red-800",
        created: "bg-yellow-300 text-yellow-800",
        paused: "bg-blue-300 text-blue-800",
        restarting: "bg-orange-300 text-orange-800",
        dead: "bg-gray-300 text-gray-800",
    };

    const types: Record<string, string> = {
        "VANILLA": "Vanilla",
        "AUTO_CURSEFORGE": "CurseForge",
    };

    const getEnvValue = (env: string, defaultValue: string) => {
        const envValue = server.Config.Env.find(e => e.startsWith(env.toUpperCase() + "="));
        return envValue ? envValue.split('=')[1] : defaultValue;
    };

    const handleAction = (action: string) => {
        execute({ action })
            .then(response => {
                if (response.status === 200) {
                    console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} action executed successfully for ${server.Name}`);
                } else {
                    console.error(`Failed to execute ${action} action for ${server.Name}:`, response.data);
                }
            })
            .catch(error => {
                console.error(`Error executing ${action} action for ${server.Name}:`, error);
            });
    };

    useEffect(() => {
        if (data) {
            refreshServers();
        }
    }, [data, server.Name]);

    return (
        <Card className="p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="text-lg font-semibold flex justify-between items-center">
                <span className="flex items-center gap-4">
                    <span>{server.Name ? server.Name.slice(1) : "Name not found"}</span>
                    <span className="text-gray-300 text-sm">({server.Id.slice(0, 12)})</span>
                </span>
                <Tooltip>
                    <TooltipTrigger className="flex items-center">
                        <span className={`w-3 h-3 rounded-full ${statusColors[server.State.Status] || "bg-gray-300"}`}></span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-primary text-secondary">
                        {server.State.Status.charAt(0).toUpperCase() + server.State.Status.slice(1)}
                    </TooltipContent>
                </Tooltip>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                <p className="text-sm">Port: {server.HostConfig.PortBindings['25565/tcp'][0].HostPort}</p>
                <p className="text-sm">Type: {types[getEnvValue('TYPE', '')]}</p>
                <p className="text-sm">Version: {getEnvValue('VERSION', 'N/A')}</p>
                <p className="text-sm">Memory Limit: {formatMemory(getEnvValue('MEMORY', 'N/A'))}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <div className="w-full flex justify-between items-center">
                    <section className="flex gap-2">
                        <ActionButton
                            icon={PlayIcon}
                            onClick={() => handleAction('start')}
                            disabled={server.State.Status === "running" || isLoading}
                            text="Start"
                        />
                        <ActionButton
                            icon={PauseIcon}
                            onClick={() => handleAction('pause')}
                            disabled={server.State.Status !== "running" || isLoading}
                            text="Pause"
                        />
                        <ActionButton
                            icon={RotateCcwIcon}
                            onClick={() => handleAction('restart')}
                            disabled={server.State.Status === "restarting" || isLoading}
                            text="Restart"
                        />
                        <ActionButton
                            icon={Trash2Icon}
                            onClick={() => handleAction('delete')}
                            disabled={server.State.Status === "running" || isLoading}
                            text="Delete"
                        />
                    </section>
                    <ActionButton
                        icon={LogsIcon}
                        onClick={() => console.log("Delete action not implemented yet")}
                        disabled={false}
                        text="Logs"
                    />
                </div>
            </CardFooter>
        </Card>
    );
}

export default function ServersList({ servers, refreshServers }: { servers: dockerode.ContainerInspectInfo[], refreshServers: () => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 p-4">
            {servers.map((server, index) => (
                <ServerItem key={index} refreshServers={refreshServers} server={server} />
            ))}
        </div>
    );
}