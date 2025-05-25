
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Button } from "./ui/button";
import { LogsIcon, PauseIcon, PlayIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { usePost } from "@/hooks/use-post";
import { useEffect, useRef, useState } from "react";
import { env } from "@/environment";
import { ServerType } from "@/pages";
import ServerCommand from "./server-command";


const formatMemory = (memoryAsMb: string | number): string => {
    if (typeof memoryAsMb === "number") {
        memoryAsMb = memoryAsMb.toString();
    }
    const memoryInMb = parseFloat(memoryAsMb);
    if (isNaN(memoryInMb)) return "N/A";

    return `${(memoryInMb / 1024).toFixed(2)} Gb`;
}

function ActionButton({ icon: Icon, onClick, text, disabled }: { icon: React.ComponentType<any>, onClick: () => void, text: string, disabled?: boolean }) {
    return (
        <Tooltip>
            <TooltipTrigger className="flex items-center" asChild>
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

function ServerItem({ server, refreshServers, handleLogClick }: { server: ServerType, refreshServers: () => void, handleLogClick: (containerId: string) => void }) {
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
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="text-lg font-semibold flex flex-col gap-2">
                <section className="flex justify-between items-center w-full">
                    <span className="flex items-center gap-4">
                        <span>{server.Name ? server.Name.slice(1).split('--')[1] : "Name not found"}</span>
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
                </section>
                <h4 className="text-md font-medium ">{getEnvValue('MOTD_NAME', 'A Minecraft Server')}</h4>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                <p className="text-sm">Port: {server.HostConfig.PortBindings['25565/tcp'][0].HostPort}</p>
                <p className="text-sm">Type: {types[getEnvValue('TYPE', '')]}</p>
                <p className="text-sm">Version: {getEnvValue('VERSION', 'N/A')}</p>
                <p className="text-sm">Memory Usage: {formatMemory(server.memory_stats.usage / 1024 / 1024)}/{formatMemory(getEnvValue('MEMORY', 'N/A'))}</p>
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
                        onClick={() => handleLogClick(server.Id)}
                        disabled={false}
                        text="Logs"
                    />
                </div>
            </CardFooter>
        </Card>
    );
}

export default function ServersList({ servers, refreshServers }: { servers: ServerType[], refreshServers: () => void }) {
    const logContainerRef = useRef<HTMLDivElement>(null);

    const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const handleLogClick = (containerId: string) => {
        setSelectedContainerId(containerId);
    };

    useEffect(() => {
        const container = logContainerRef.current;
        if (container && (container.dataset.autoscroll === "true" || container.dataset.autoscroll === undefined)) {
            container.scrollTop = container.scrollHeight;
        }
    }, [logs]);

    const sanitizeLogs = (log: string) => {
        return log
            .replace(/\\"/g, '"')
            .replace(/\\r/g, '')
            .replace(/\\u001b/g, "\u001b")
            .replace(/\r$/, "")
            .replace(/\\t/g, "    ")
            .replace(/^"/g, "");
    }

    useEffect(() => {
        if (selectedContainerId) {
            setIsOpen(true);
            const eventSource = new EventSource(`${env.VITE_API_URL}/api/servers/${selectedContainerId}/logs?access_token=${localStorage.getItem("token")}`);
            eventSource.onmessage = (event: { data: string }) => {
                // eslint-disable-next-line
                const log = event.data.slice(1, -1).split('","').map(line => sanitizeLogs(line));
                setLogs((prevLogs) => Array.from(new Set([...prevLogs, ...log])));
            };

            eventSource.onerror = (error) => {
                console.log("EventSource error:", error);
                eventSource.close();
            };
            return () => {
                eventSource.close();
            };
        }
    }, [selectedContainerId]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedContainerId(null);
            setLogs([]);
        }
    }, [isOpen]);


    return (
        <div className="grid grid-cols-1 md:grid-cols-2  gap-4 p-4">
            {servers.map((server, index) => (
                <ServerItem key={index} refreshServers={refreshServers} server={server} handleLogClick={handleLogClick} />
            ))}
            <ServerCommand selectedContainerId={selectedContainerId} logs={logs} isOpen={isOpen} setIsOpen={setIsOpen} />
        </div>
    );
}