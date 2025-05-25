import { Dialog, DialogContent, DialogFooter, DialogTitle } from "./ui/dialog";
import ReactAnsi from "react-ansi";
import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizonal } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { usePost } from "@/hooks/use-post";

export default function ServerCommand({ selectedContainerId, logs, isOpen, setIsOpen }: {
    selectedContainerId: string | null;
    logs: string[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}) {
    const [command, setCommand] = useState("");
    const logContainerRef = useRef<HTMLDivElement>(null);

    const { execute: executeCommand } = usePost(`/servers/${selectedContainerId}/action`);

    const handleCommandSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let clean_command = command.trim();
        if (!clean_command) return;

        if (clean_command.startsWith("/")) {
            clean_command = clean_command.slice(1); // Remove leading slash if present
        }

        try {
            await executeCommand({ action: "command", params: clean_command });
            setCommand("");
        } catch (error) {
            console.error("Failed to execute command:", error);
        }
    };

    useEffect(() => {
        const container = logContainerRef.current;
        if (container && (container.dataset.autoscroll === "true" || container.dataset.autoscroll === undefined)) {
            container.scrollTop = container.scrollHeight;
        }
    }, [logs]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="p-4 !w-[80vw] !max-w-[80vw]">
                {selectedContainerId ? (
                    <section className="flex flex-col gap-4">
                        <DialogTitle className="text-xl font-bold">Logs for {selectedContainerId.slice(0, 12)}</DialogTitle>
                        <div className="!w-[78vw] !max-w-[78vw] min-h-[75dvh] max-h-[75dvh]">
                            <div
                                ref={logContainerRef}
                                className="w-full h-[75dvh] overflow-y-auto rounded-md"
                                onScroll={(e) => {
                                    const el = e.currentTarget;
                                    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
                                    el.dataset.autoscroll = nearBottom ? "true" : "false";
                                }}
                            >
                                {
                                    logs.length > 0 ? (
                                        <ReactAnsi
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
                        <DialogFooter className="flex items-center justify-between">
                            <Input
                                className="flex-1"
                                type="text"
                                placeholder="Enter command...(e.g., op <username>, ban <username>, etc.)"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCommandSubmit(e);
                                    }
                                }}
                            />
                            <Button
                                className="h-full aspect-1/1 !p-0 group"
                                onClick={handleCommandSubmit}
                            >
                                <SendHorizonal className={`w-4 h-4 -rotate-45 transition-transform ease-in-out duration-200 group-hover:rotate-0 group-active:scale-90`} />
                            </Button>
                        </DialogFooter>
                    </section>
                ) : (
                    <p className="text-sm text-gray-500">Select a server to view logs.</p>
                )}
            </DialogContent>
        </Dialog>
    )
}