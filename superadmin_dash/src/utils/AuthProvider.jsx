import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import LoadingOverlay from "./LoadingOverlay";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);
    const navigate = useNavigate();
    const refreshTimeout = useRef(null);

    const getToken = () => {
        return accessToken;
    };

    const initializeAuth = async () => {
        setLoading(true); // Explicitly set loading state at the start
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/auth/checkAuthDas`, {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.token;

                if (token && !isTokenExpired(token)) {
                    setAccessToken(token);
                    setIsAuthenticated(true);
                    scheduleTokenRefresh(token);
                    if (window.location.pathname === '/login') {
                        toast.success("Welcome back");
                        navigate('/');
                    }
                } else {
                    await refreshAuthToken(); // Refresh token if expired
                }
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error("Failed to check authentication:", error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false); // Always reset loading state
        }
    };



    useEffect(() => {
        initializeAuth();

        return () => {
            if (refreshTimeout.current) {
                clearTimeout(refreshTimeout.current);
            }
        };
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
        try {
            const apiUrl = import.meta.env.VITE_API_URL;

            const response = await fetch(`${apiUrl}/auth/refreshTokenDas`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn("Refresh token expired. Logging out...");
                } else {
                    console.error("Failed to refresh token. Response status:", response.status);
                }
                throw new Error("Failed to refresh token.");
            }

            const data = await response.json();
            const newAccessToken = data.token;

            setAccessToken(newAccessToken);
            setIsAuthenticated(true);

            scheduleTokenRefresh(newAccessToken);

            console.log("Token refreshed successfully");
        } catch (error) {
            console.error("Token refresh failed:", error);
            logout(false, "Session expired, please log in again.", "error");
        }
    };

    const login = async (loginData) => {
        const apiUrl = import.meta.env.VITE_API_URL;
        let payload = null;
        try {
            const response = await fetch(`${apiUrl}/auth/loginSuperAdm`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(loginData),
                credentials: "include",
            });

            try {
                payload = await response.json();
            } catch (_) {
                // ignore JSON parse errors
            }

            if (!response.ok) {
                // Map common status codes to clearer messages.
                let message = payload?.error || payload?.message;
                if (!message) {
                    switch (response.status) {
                        case 400:
                            message = "Invalid request. Please check the submitted data."; break;
                        case 401:
                            message = "Incorrect username or password."; break;
                        case 403:
                            message = "Access denied. Your account is not permitted here."; break;
                        case 404:
                            message = "Login endpoint not found (404)."; break;
                        case 429:
                            message = "Too many attempts. Please wait and try again."; break;
                        case 500:
                            message = "Server error while logging in. Please try again."; break;
                        default:
                            message = `Login failed (status ${response.status}).`;
                    }
                }
                // Special hint if reCAPTCHA token was expected
                if (message && /captcha/i.test(message) && !loginData.recaptchaToken) {
                    message += " (No reCAPTCHA token supplied.)";
                }
                toast.error(message);
                return { success: false, status: response.status, message, code: payload?.code };
            }

            if (!payload?.token) {
                const msg = "Login response missing token.";
                toast.error(msg);
                return { success: false, status: 500, message: msg };
            }

            const decodedToken = (() => {
                try { return jwtDecode(payload.token); } catch { return null; }
            })();
            const userType = import.meta.env.VITE_USERTYPE;

            if (!decodedToken) {
                const msg = "Received invalid token.";
                toast.error(msg);
                return { success: false, status: 500, message: msg };
            }

            if (decodedToken.userType === userType) {
                setIsAuthenticated(true);
                scheduleTokenRefresh(payload.token);
                setAccessToken(payload.token);
                toast.success("Login successful");
                navigate("/");
                return { success: true };
            } else {
                const msg = "Unauthorized user type.";
                toast.error(msg);
                return { success: false, status: 403, message: msg };
            }
        } catch (error) {
            const msg = error?.message || "Unexpected network error during login.";
            toast.error(msg);
            return { success: false, status: 0, message: msg };
        }
    };

    const logout = async (message, toastStatus) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            await fetch(`${apiUrl}/auth/logoutDas`, {
                method: "POST",
                credentials: "include",
            });

            if (toastStatus === "success") {
                toast.success(message);
                clearAuthState(false);
            } else {
                toast.error(message);
                clearAuthState(false);
            }
        } catch (error) {
            console.error("Logout failed:", error);
            clearAuthState(false);
            toast.error("Failed to logout completely, but you are logged out locally.");
        }

    };

    const clearAuthState = () => {
        setIsAuthenticated(false);
        if (refreshTimeout.current) {
            clearTimeout(refreshTimeout.current);
        }
        navigate("/login");
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
