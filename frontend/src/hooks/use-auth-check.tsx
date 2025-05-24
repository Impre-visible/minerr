import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useGet } from './use-get';

const useAuthCheck = () => {
    const token = localStorage.getItem('token');
    const { data, error, isLoading } = useGet('/me');
    const navigate = useNavigate();

    // Mémorise la réponse de /me tant que le token ne change pas
    const memoizedData = useMemo(() => data, [data, token]);
    const memoizedError = useMemo(() => error, [error, token]);
    const memoizedIsLoading = useMemo(() => isLoading, [isLoading, token]);

    const authCheck = () => {
        if (memoizedIsLoading) return;

        if (memoizedError) {
            //localStorage.removeItem('token');
            //localStorage.removeItem('refreshToken');
            navigate('/auth', { replace: true });
        }
    };

    useEffect(() => {
        authCheck();
    }, [memoizedData, memoizedError, memoizedIsLoading, navigate]);

    return { authCheck, user: memoizedData };
};

export default useAuthCheck;
