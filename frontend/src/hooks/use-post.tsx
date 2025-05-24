import { env } from "@/environment"
import { useState, useCallback } from "react"
import useRefreshToken from "./use-refresh-token"
import { toast } from "sonner"
import { l } from "node_modules/react-router/dist/development/fog-of-war-D2zsXvum.d.mts"

interface UsePostResult<T, P> {
    data: T | null
    isLoading: boolean
    error: Error | null
    execute: (payload: P) => Promise<T | null>
    reset: () => void
}

export function usePost<T = any, P = any>(
    url: string,
    options?: Omit<RequestInit, "method" | "body"> & { toast?: boolean },
): UsePostResult<T, P> {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)
    const { refreshToken } = useRefreshToken();

    const execute = useCallback(
        async (payload: P): Promise<T | null> => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(`${env.VITE_API_URL || ""}/api${url}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        ...(options?.headers || {}),
                    },
                    body: JSON.stringify(payload),
                    ...options,
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        await refreshToken();
                        const retryResponse = await fetch(`${env.VITE_API_URL || ""}/api${url}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                ...(options?.headers || {}),
                            },
                            body: JSON.stringify(payload),
                            ...options,
                        });
                        const result = await retryResponse.json();
                        setData(result);
                        return result;
                    } else {
                        throw new Error("customerr:" + JSON.stringify(await response.json()));
                    }
                } else {
                    const result = await response.json();
                    setData(result);
                    return result;
                }
            } catch (err) {
                let errorMessage = err instanceof Error ? err.message : "An error occurred during the request";
                if (err instanceof Error && err.message.startsWith("customerr:")) {
                    errorMessage = JSON.parse(err.message.replace("customerr:", ""))?.message || errorMessage;
                }

                if (options?.toast !== false) { // Default toast to true
                    toast.error('Error during request', {
                        description: errorMessage,
                        duration: 5000,
                    });
                }
                setError(err as Error);
                setData(null);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [url, options, refreshToken],
    );

    const reset = useCallback(() => {
        setData(null)
        setError(null)
        setIsLoading(false)
    }, []);

    return { data, isLoading, error, execute, reset };
}
