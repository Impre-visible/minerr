import { Dialog, DialogContent, DialogFooter, DialogTitle } from "./ui/dialog";
import ReactAnsi from "react-ansi";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { Input } from "./ui/input";

export default function ServerCommand({ selectedContainerId, logs, isOpen, setIsOpen }: {
    selectedContainerId: string | null;
    logs: string[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}) {
    const { theme } = useTheme();

    const logContainerRef = useRef<HTMLDivElement>(null);



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
                    <>
                        <DialogTitle className="text-xl font-bold">Logs for {selectedContainerId.slice(0, 12)}</DialogTitle>
                        <div className="!w-[78vw] !max-w-[78vw]">
                            <div
                                ref={logContainerRef}
                                className="w-full h-[80dvh] overflow-y-auto"
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
                    </>
                ) : (
                    <p className="text-sm text-gray-500">Select a server to view logs.</p>
                )
                }
            </DialogContent>
        </Dialog>
    )
}