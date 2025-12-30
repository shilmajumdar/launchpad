import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [tempToken, setTempToken] = useState(null); // For MFA flow
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const data = await api.get('/api/auth/profile', token);
                    setUser(data.user);
                } catch (error) {
                    console.error("Failed to fetch profile", error);
                    logout();
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const setMfaTempToken = (t) => {
        setTempToken(t);
    };

    return (
        <AuthContext.Provider value={{ user, token, tempToken, login, logout, setMfaTempToken, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
