import { Tabs, TabsList, TabsTrigger } from "@/components/animated-tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@radix-ui/react-tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { usePost } from "@/hooks/use-post";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-_]).{8,}$/;

const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});

const registerSchema = z.object({
    username: z.string(),
    password: z.string().min(8).max(64).regex(PASSWORD_REGEX, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),
    confirmPassword: z.string().min(8).max(64).regex(PASSWORD_REGEX, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
});


export default function Auth() {
    const { execute: executeLogin, isLoading: isLoadingLogin } = usePost("/auth/login")
    const { execute: executeRegister, isLoading: isLoadingRegister } = usePost("/auth/register")

    const navigate = useNavigate();

    const loginForm = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const registerForm = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            password: "",
            confirmPassword: "",
        },
    });

    const handleLoginSubmit = (data: { username: string; password: string }) => {
        executeLogin(data)
            .then((response) => {
                if (!response.error) {
                    localStorage.setItem('token', response.access_token);
                    localStorage.setItem('refreshToken', response.refresh_token);
                    navigate("/", { replace: true });
                } else {
                    toast.error("Login failed", {
                        description: response.message || "An error occurred during login.",
                    });
                }
            })
    };

    const handleRegisterSubmit = (data: { username: string; password: string; confirmPassword: string }) => {
        executeRegister(data)
            .then((response) => {
                if (!response.error) {
                    console.log("Registration successful:", response);
                } else {
                    toast.error("Registration failed", {
                        description: response.message || "An error occurred during registration.",
                    });
                }
            })
    };

    return (
        <Tabs defaultValue="login" className="flex flex-col gap-4 w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>
                            Enter your credentials to login. If you don't have an account, please register.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Form {...loginForm}>
                            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                                <FormField
                                    control={loginForm.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Username" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={loginForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoadingLogin}>
                                    {isLoadingLogin && <Loader2 className="animate-spin" />}
                                    Login
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">
                            Forgot password?
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            <TabsContent value="register">
                <Card>
                    <CardHeader>
                        <CardTitle>Register</CardTitle>
                        <CardDescription>
                            Create a new account here. Click register when you're done.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Form {...registerForm}>
                            <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                                <FormField
                                    control={registerForm.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Username" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={registerForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={registerForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Confirm Password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoadingRegister}>
                                    {isLoadingRegister && <Loader2 className="animate-spin" />}
                                    Register
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">
                            Already have an account?
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    );
}