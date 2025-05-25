import { z } from "zod"
import { ResponsiveDrawerDialog, ResponsiveDrawerDialogContent, ResponsiveDrawerDialogTrigger } from "./ui/responsive-dialog"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Input } from "./ui/input"
import { useEffect, useState } from "react"
import { usePost } from "@/hooks/use-post"

const formSchema = z.object({
    name: z.string().min(1, "Server name is required").max(50, "Server name must be less than 50 characters").regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, "Server name must start with a letter or number and can only contain letters, numbers, underscores, hyphens, and periods."),
    motd: z.string().optional().nullable(),
    max_players: z.number().int().min(1).max(10000).default(20), // Optional, default to 20 players
    memory: z.number().int().min(0).max(16384).default(2048),
    port: z.number().int().min(1).max(65535).default(25565),
    version: z.string().default('1.20.1'), // This is used to specify the Minecraft version, e.g., "1.20.1" 
    type: z.string().default("VANILLA"),
    cf_api_key: z.string().optional().nullable(),
    cf_modpack_url: z.string().optional().nullable()
}).superRefine((data, ctx) => {
    if (data.type === "AUTO_CURSEFORGE") {
        if (!data.cf_api_key || !data.cf_modpack_url) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "CurseForge API Key and Modpack URL are required for CurseForge servers.",
            })
        }
    } else {
        if (data.cf_api_key || data.cf_modpack_url) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "CurseForge API Key and Modpack URL should not be provided for Vanilla servers.",
            })
        }
    }
    if (data.memory < 1024 || data.memory > 16384) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Memory must be between 1024 MB and 16384 MB (16 GB).",
        })
    }
    if (data.port < 1 || data.port > 65535) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Port must be between 1 and 65535.",
        })
    }
    if (!data.version.match(/^\d+\.\d+\.\d+$/)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Version must be in the format X.Y.Z (e.g., 1.20.1).",
        })
    }
})

export default function CreateServer({ refreshServers }: { refreshServers: () => void }) {
    const { execute, data: serverCreateData } = usePost("/servers/create")
    const [isOpen, setIsOpen] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "VANILLA",
            name: "",
            max_players: 20,
            motd: "A Minecraft Server",
            port: 25565,
            version: "1.20.1",
            memory: 1024,
            cf_api_key: "",
            cf_modpack_url: "",
        },
    })

    const handleOpenChange = (open: boolean) => {
        form.reset({
            type: "VANILLA",
            name: "",
            max_players: 20,
            motd: "A Minecraft Server",
            port: 25565,
            version: "1.20.1",
            memory: 1024,
            cf_api_key: "",
            cf_modpack_url: "",
        })
        setIsOpen(open)
    }

    const handleSubmit = (data: z.infer<typeof formSchema>) => {
        execute(data)
    }

    useEffect(() => {
        if (serverCreateData) {
            setIsOpen(false)
            refreshServers()
        }
    }, [serverCreateData])

    return (
        <ResponsiveDrawerDialog open={isOpen} onOpenChange={handleOpenChange}>
            <ResponsiveDrawerDialogTrigger>
                <Button className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                </Button>
            </ResponsiveDrawerDialogTrigger>
            <ResponsiveDrawerDialogContent>
                <section>
                    <h2 className="text-2xl font-bold mb-4">Create Server</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Configure your server settings below.
                    </p>
                    <Form {...form}>
                        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(() => {
                            setIsOpen(false)
                        })}>
                            <section className="w-full flex flex-row gap-2">
                                <FormField
                                    name="name"
                                    render={({ field, fieldState }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Server Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    placeholder="My Minecraft Server"
                                                    value={field.value}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        if (/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(value) || value === "") {
                                                            field.onChange(value) // Update the field value only if it matches the regex
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            {fieldState.error && <FormMessage />}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="motd"
                                    render={({ field, fieldState }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>MOTD</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    placeholder="A Minecraft Server"
                                                    {...field}
                                                />
                                            </FormControl>
                                            {fieldState.error && <FormMessage />}
                                        </FormItem>
                                    )}
                                />
                            </section>
                            <section className="w-full flex flex-row gap-2">
                                <FormField
                                    name="type"
                                    render={({ field, fieldState }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Server Type</FormLabel>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value)
                                                form.setValue("cf_api_key", "")
                                                form.setValue("cf_modpack_url", "")
                                            }} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select server type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="VANILLA">Vanilla</SelectItem>
                                                    <SelectItem value="AUTO_CURSEFORGE">CurseForge</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {fieldState.error && <FormMessage />}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="version"
                                    render={({ field, fieldState }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Version</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    placeholder="Minecraft Version (e.g., 1.20.1)"
                                                    {...field}
                                                />
                                            </FormControl>
                                            {fieldState.error && <FormMessage />}
                                        </FormItem>
                                    )}
                                />
                            </section>
                            <section className="w-full flex flex-row gap-2">
                                <FormField
                                    name="max_players"
                                    render={({ field, fieldState }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Max Players</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Max Players"
                                                    value={field.value}
                                                    onChange={(e) => {
                                                        field.onChange(Math.max(1, Math.min(10000, parseInt(e.target.value, 10) || 20))) // Ensure value is between 1 and 10000
                                                    }}
                                                />
                                            </FormControl>
                                            {fieldState.error && <FormMessage />}
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    name="memory"
                                    render={({ field, fieldState }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Memory (MB)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Memory (MB)"
                                                    value={field.value}
                                                    onChange={(e) => {
                                                        const memoryValue = parseInt(e.target.value, 10)
                                                        if (!isNaN(memoryValue) || e.target.value === '') {
                                                            field.onChange(memoryValue)
                                                        } else {
                                                            field.onChange(1024)
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            {fieldState.error && <FormMessage />}
                                        </FormItem>
                                    )}
                                />
                            </section>
                            <FormField
                                name="port"
                                render={({ field, fieldState }) => (
                                    <FormItem>
                                        <FormLabel>Port</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Port" value={field.value} onChange={(e) => {
                                                const value = parseInt(e.target.value, 10)
                                                console.log("Port Value:", value)
                                                if (!isNaN(value) && value >= 1 && value <= 65535) {
                                                    field.onChange(value)
                                                } else {
                                                    field.onChange(25565)
                                                }
                                            }} />
                                        </FormControl>
                                        {fieldState.error && <FormMessage />}
                                    </FormItem>
                                )}
                            />
                            {form.watch("type") === "AUTO_CURSEFORGE" && (
                                <section className="flex flex-row items-center gap-4 w-full">
                                    <FormField
                                        name="cf_api_key"
                                        render={({ field, fieldState }) => (
                                            <FormItem className=" w-full">
                                                <FormLabel>CurseForge API Key</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Your CurseForge API Key"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                {fieldState.error && <FormMessage />}
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        name="cf_modpack_url"
                                        render={({ field, fieldState }) => (
                                            <FormItem className=" w-full">
                                                <FormLabel>CurseForge Modpack URL</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="https://www.curseforge.com/minecraft/modpacks/your-modpack"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                {fieldState.error && <FormMessage />}
                                            </FormItem>
                                        )}
                                    />
                                </section>
                            )}
                            <Button
                                type="submit"
                                className="mt-4"
                                onClick={form.handleSubmit(handleSubmit)}
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                Create Server
                            </Button>
                        </form>
                    </Form>
                </section>
            </ResponsiveDrawerDialogContent>
        </ResponsiveDrawerDialog>
    )
}