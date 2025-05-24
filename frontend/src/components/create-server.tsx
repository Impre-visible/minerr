import { z } from "zod"
import { ResponsiveDrawerDialog, ResponsiveDrawerDialogContent, ResponsiveDrawerDialogTrigger } from "./ui/responsive-dialog"
import { Equal, Plus, Trash2 } from "lucide-react"
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
import BetterSlider from "./better-slider"
import { usePost } from "@/hooks/use-post"

const formSchema = z.object({
    memory: z.number().int().min(128).max(16384).default(1024),
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
    if (data.memory < 128 || data.memory > 16384) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Memory must be between 128 MB and 16384 MB.",
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

export default function CreateServer() {
    const { execute, data: serverCreateData, error: serverCreateError } = usePost("/servers/create")
    const [isOpen, setIsOpen] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "VANILLA",
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
            port: 25565,
            version: "1.20.1",
            memory: 1024,
            cf_api_key: "",
            cf_modpack_url: "",
        })
        setIsOpen(open)
    }

    const handleSubmit = (data: z.infer<typeof formSchema>) => {
        console.log("Submitted Data:", data)
        execute(data)
    }

    useEffect(() => {
        if (serverCreateData) {
            console.log("Server created successfully:", serverCreateData)
            setIsOpen(false)
        }
        if (serverCreateError) {
            console.error("Error creating server:", serverCreateError)
            // Handle error appropriately, e.g., show a toast notification
            alert(`Error creating server: ${serverCreateError.message}`)
        }
    }, [serverCreateData, serverCreateError])

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
                        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((data) => {
                            console.log("Form Data:", data)
                            setIsOpen(false)
                        })}>
                            <FormField
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="version"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Version</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="Minecraft Version (e.g., 1.20.1)"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="memory"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Memory (GB)</FormLabel>
                                        <section className="w-full flex flex-col justify-between gap-2">
                                            <BetterSlider value={[field.value / 1024]} onValueChange={(value) => {
                                                const memoryValue = value[0]
                                                if (memoryValue >= 1 && memoryValue <= 16) {
                                                    field.onChange(memoryValue * 1024) // Convert to MB
                                                } else {
                                                    field.onChange(1024)
                                                }
                                            }} min={1} max={16} step={1} labelFunction={(value) => `${value}Gb`} />
                                        </section>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="port"
                                render={({ field }) => (
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch("type") === "AUTO_CURSEFORGE" && (
                                <section className="flex flex-row items-center gap-4 w-full">
                                    <FormField
                                        name="cf_api_key"
                                        render={({ field }) => (
                                            <FormItem className=" w-full">
                                                <FormLabel>CurseForge API Key</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Your CurseForge API Key"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        name="cf_modpack_url"
                                        render={({ field }) => (
                                            <FormItem className=" w-full">
                                                <FormLabel>CurseForge Modpack URL</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="https://www.curseforge.com/minecraft/modpacks/your-modpack"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </section>
                            )}
                            <Button
                                type="submit"
                                className="mt-4"
                                onClick={form.handleSubmit(handleSubmit)}
                                disabled={!form.formState.isValid || form.formState.isSubmitting}
                            >
                                Create Server
                            </Button>
                        </form>
                    </Form>
                </section>
            </ResponsiveDrawerDialogContent>
        </ResponsiveDrawerDialog>
    )
}