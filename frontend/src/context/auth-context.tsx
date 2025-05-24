import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useGet } from '@/hooks/use-get';

const AuthContext = createContext({
    isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { data, error, isLoading } = useGet('/me');


    useEffect(() => {
        if (!isLoading) {
            if (error || !data) {
                if (window.location.pathname !== '/auth') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    navigate('/auth'); // Rediriger vers la page d'authentification
                }
            } else {
                setIsAuthenticated(true);
            }
        }
    }, [data, error, isLoading]);

    return (
        <AuthContext.Provider value={{ isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
