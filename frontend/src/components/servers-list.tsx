
import dockerode from "dockerode";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Button } from "./ui/button";
import { Loader2, LogsIcon, PauseIcon, PlayIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { usePost } from "@/hooks/use-post";
import { useEffect, useRef, useState } from "react";
import { env } from "@/environment";
import { Dialog, DialogContent, DialogHeader } from "./ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import ReactAnsi from "react-ansi";
import { useTheme } from "./theme-provider";


const formatMemory = (memoryAsMb: string): string => {
    const memoryInMb = parseInt(memoryAsMb, 10);
    if (isNaN(memoryInMb)) return "N/A";

    return `${(memoryInMb / 1024)} Gb`;
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

function ServerItem({ server, refreshServers, handleLogClick }: { server: dockerode.ContainerInspectInfo, refreshServers: () => void, handleLogClick: (containerId: string) => void }) {
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
                        onClick={() => handleLogClick(server.Id)}
                        disabled={false}
                        text="Logs"
                    />
                </div>
            </CardFooter>
        </Card>
    );
}

export default function ServersList({ servers, refreshServers }: { servers: dockerode.ContainerInspectInfo[], refreshServers: () => void }) {
    const { theme } = useTheme();

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 p-4">
            {servers.map((server, index) => (
                <ServerItem key={index} refreshServers={refreshServers} server={server} handleLogClick={handleLogClick} />
            ))}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="p-4 !w-[80vw] !max-w-[80vw]">
                    {selectedContainerId ? (
                        <>
                            <DialogTitle className="text-xl font-bold">Logs for {selectedContainerId.slice(0, 12)}</DialogTitle>
                            <div className="!w-[78vw] !max-w-[78vw]">
                                <div
                                    ref={logContainerRef}
                                    className="w-full h-[80dvh] overflow-y-auto bg-neutral-100 dark:bg-neutral-900 color-neutral-900 dark:text-neutral-100 p-4 rounded-lg"
                                    onScroll={(e) => {
                                        const el = e.currentTarget;
                                        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
                                        el.dataset.autoscroll = nearBottom ? "true" : "false";
                                    }}
                                >
                                    {
                                        logs.length > 0 ? (
                                            <ReactAnsi
                                                bodyStyle={{ background: "transparent" }}
                                                logStyle={{ color: theme === "dark" ? "#f5f5f5" : "#262626", fontFamily: "monospace", whiteSpace: "pre-wrap" }}
                                                log={logs
                                                    .map((line) =>
                                                        line
                                                    )
                                                    .join("\n")}
                                            />
                                        ) : selectedContainerId ? (
                                            <span className="flex items-center justify-center h-full text-gray-500">
                                                <Loader2 className="animate-spin inline-block w-16 h-16 stroke-1" />
                                            </span>
                                        ) : (
                                            <p className="text-sm text-gray-500">No logs available.</p>
                                        )
                                    }
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Select a server to view logs.</p>
                    )
                    }
                </DialogContent>
            </Dialog>
        </div>
    );
}