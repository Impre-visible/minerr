import { env } from '@/environment';
import { useState, useEffect } from 'react';
import useRefreshToken from './use-refresh-token';

interface UseGetResult<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function useGet<T = any>(url: string, options?: RequestInit): UseGetResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [refreshIndex, setRefreshIndex] = useState<number>(0);
    const { refreshToken } = useRefreshToken();

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const fetchData = async () => {
            try {
                const response = await fetch(`${env.VITE_API_URL || ""}/api${url}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        ...(options?.headers || {})
                    },
                    ...options
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        await refreshToken();
                        const retryResponse = await fetch(`${env.VITE_API_URL || ""}/api${url}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                ...(options?.headers || {})
                            },
                            ...options
                        });
                        const result = await retryResponse.json();
                        if (isMounted) {
                            setData(result);
                            setError(null);
                        }
                    } else {
                        throw new Error(`Erreur HTTP: ${response.status}`);
                    }
                } else {
                    const result = await response.json();
                    if (isMounted) {
                        setData(result);
                        setError(null);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error(String(err)));
                    setData(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [url, refreshIndex, options, refreshToken]);

    const refetch = () => {
        setRefreshIndex(prev => prev + 1);
    };

    return { data, isLoading, error, refetch };
}
