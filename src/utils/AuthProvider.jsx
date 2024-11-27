import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import LoadingOverlay from "./LoadingOverlay";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// TODO: Change salt for refresh token.

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const refreshTimeout = useRef(null);

    const storage = {
        set: (key, value, persistent) => {
            if (persistent) {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                sessionStorage.setItem(key, JSON.stringify(value));
            }
        },
        get: (key) => {
            const value = localStorage.getItem(key) || sessionStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        },
        remove: (key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        },
    };

    const getToken = () => {
        const user = storage.get("user");
        return user ? user.token : null;
    };

    useEffect(() => {
        const user = storage.get("user");
        console.log(user)

        if (user) {
            const tokenExpired = isTokenExpired(user.token);

            if (tokenExpired) {
                logout(false, "Session expired please login again", "error");
            } else {
                setIsAuthenticated(true);
                scheduleTokenRefresh(user.token);
            }
        }

        setLoading(false);
        return () => clearTimeout(refreshTimeout.current)
    }, []);

    const isTokenExpired = (token) => {
        try {
            const decoded = jwtDecode(token);
            return decoded.exp * 1000 < Date.now();
        } catch (error) {
            console.error("Failed to decode token:", error);
            return true;
        }
    };

    const getRemainingTime = (token) => {
        try {
            const decoded = jwtDecode(token);
            const expiresAt = decoded.exp * 1000;
            const remainingTime = expiresAt - Date.now();
            return remainingTime > 0 ? remainingTime : 0;
        } catch (error) {
            console.error("Failed to get remaining time:", error);
            return 0;
        }
    };

    const scheduleTokenRefresh = (token) => {
        if (refreshTimeout.current) {
            clearTimeout(refreshTimeout.current);
        }

        const remainingTime = getRemainingTime(token);

        const refreshTime = remainingTime - 60000;

        if (refreshTime > 0) {
            refreshTimeout.current = setTimeout(refreshAuthToken, refreshTime)
        }
    };

    const refreshAuthToken = async () => {
        const user = storage.get("user");
        if (!user || !user.refreshToken) {
            return;
        }
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/auth/refreshTokenDas`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ refreshToken: user.refreshToken }),
            });
            if (!response.ok) {
                throw new Error("Failed to refresh token.");
            }

            const data = await response.json();
            storage.set("user", data, !!localStorage.getItem("user"));
            scheduleTokenRefresh(data.token);
            console.log("Token refreshed successfully");
        } catch (error) {
            console.error("Token refresh failed:", error);
            logout(false, "Session expired, please log in again.", "error");
        }
    };

    const login = async (loginData, rememberMe) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/auth/loginDas`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify(loginData),
            });

            if (!response.ok) {
                throw new Error("Login failed. Please check your credentials!");
            }

            const data = await response.json();
            const decodedToken = jwtDecode(data.token);
            const userType = import.meta.env.VITE_USERTYPE;

            if (decodedToken.userType === userType) {
                storage.set("user", data, rememberMe);

                setIsAuthenticated(true);
                scheduleTokenRefresh(data.token);

                toast.success("Login successful");
                navigate("/");
            } else {
                toast.error("Unauthorized");
            }
        } catch (error) {
            toast.error(error.message || "Something went wrong!");
        }
    };

    const logout = async (setClearOrgId, message, toastStatus) => {
        try {
            const storedUser = storage.get("user");
            if (storedUser && storedUser.refreshToken) {
                const refreshToken = storedUser.refreshToken;
                const apiUrl = import.meta.env.VITE_API_URL;
                await fetch(`${apiUrl}/auth/logoutDas`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ refreshToken }),
                });
            }
            if (setClearOrgId === true) {
                storage.remove("orgId");
            }
            storage.remove("user");

            setIsAuthenticated(false);
            navigate("/login");

            // Show toast notification
            if (toastStatus === "success") {
                toast.success(message);
            } else {
                toast.error(message);
            }
        } catch (error) {
            console.error("Logout failed:", error);

            if (setClearOrgId === true) {
                storage.remove("orgId");
            }
            storage.remove("user");
            setIsAuthenticated(false);
            navigate("/login");
            toast.error("Failed to logout completely, but you are logged out locally.");
        }

    };

    if (loading) {
        return <LoadingOverlay loading={loading} />;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, getToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
