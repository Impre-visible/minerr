import { env } from "@/environment";
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';

const useRefreshToken = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const navigate = useNavigate();

    const refreshToken = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await fetch(`${env.VITE_API_URL || ""}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            console.log('Token refreshed successfully:', data.access_token);
            localStorage.setItem('token', data.access_token);
            setIsRefreshing(false);
            return data.access_token;
        } catch (error) {
            navigate('/auth', { replace: true });
            setIsRefreshing(false);
            throw error;
        }
    }, [navigate]); // 👈 dépendance unique et stable

    return { refreshToken, isRefreshing };
};

export default useRefreshToken;
