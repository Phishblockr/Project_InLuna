import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import LoadingOverlay from "./LoadingOverlay";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            const user = JSON.parse(storedUser);
            const tokenExpired = isTokenExpired(user.token);

            if (tokenExpired) {
                logout(false, "Session expired please login again", "error");
            } else {
                setIsAuthenticated(true);
                setTokenExpirationTimeout(user.token);
            }
        }

        setLoading(false);
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

    const setTokenExpirationTimeout = (token) => {
        const timeoutId = setTimeout(() => {
            logout(false, "Session expired please login again", "error");
        }, getRemainingTime(token));

        // Clean up timer if necessary (if component unmounts, etc.)
        return () => clearTimeout(timeoutId);
    };

    const login = async (loginData, saveOrgId) => {
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


                localStorage.setItem("user", JSON.stringify(data));
                if (saveOrgId === true) {
                    localStorage.setItem("orgId", decodedToken.orgId);
                    localStorage.setItem("saveOrgId", saveOrgId);
                } else {
                    localStorage.removeItem("orgId");
                }

                setIsAuthenticated(true);

                // Set timeout for token expiration and automatic logout
                setTokenExpirationTimeout(data.token);

                toast.success("Login successful");
                navigate("/");
            } else {
                toast.error("Unauthorized");
            }
        } catch (error) {
            toast.error(error.message || "Something went wrong!");
        }
    };

    const logout = (setClearOrgId, message, toastStatus) => {
        if (setClearOrgId === true) {
            localStorage.removeItem("orgId");
            localStorage.setItem("saveOrgId", false)
        }
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        navigate("/login");
        if (toastStatus === "success") {
            toast.success(message)
        } else {
            toast.error(message)
        }
    };

    if (loading) {
        return <LoadingOverlay loading={loading} />;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
