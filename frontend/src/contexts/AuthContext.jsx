import React, { createContext, useContext, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Backend URL (Vite env var OR fallback for development)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    // User state: null when logged out, user object when logged in
    const [user, setUser] = useState(null);

    /*
     * useEffect for session persistence (hard reload)
     * 1. Check if token exists
     * 2. If yes → fetch /user/me
     * 3. If valid → setUser(...)
     * 4. If invalid → clear token + setUser(null)
     */
    useEffect(() => {
        const token = localStorage.getItem("token");
        // If no token, ensure user is null
        if (!token) {
            setUser(null);
            return;
        }
        // Token exists → verify it by calling /user/me
        fetch(`${BACKEND_URL}/user/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }).then(async (res) => {
            if (!res.ok) {
                // Token invalid or expired
                localStorage.removeItem("token");
                setUser(null);
                return;
            }
            const data = await res.json();
            setUser(data.user);
        }).catch(() => {
            localStorage.removeItem("token");
            setUser(null);
        });
    }, []);

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     * 1. POST username/password to /login
     * 2. If successful → store token
     * 3. Fetch /user/me to get profile
     * 4. Update user state
     * 5. Navigate to /profile
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        const res = await fetch(`${BACKEND_URL}/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username, password})
        });
        if (!res.ok) {
            const err = await res.json();
            return err.message;
        }
        const data = await res.json();
        const token = data.token;
        // Save token
        localStorage.setItem("token", token);
        // Fetch user profile
        const profileRes = await fetch(`${BACKEND_URL}/user/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const profileData = await profileRes.json();
        setUser(profileData.user);
        navigate("/profile");
        return null; // indicate success
    };

    /**
     * Registers a new user. 
     * On success → navigate to /success
     * On failure → return error message
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        const res = await fetch(`${BACKEND_URL}/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const err = await res.json();
            return err.message;
        }
        navigate("/success");
        return null; // indicate success
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
