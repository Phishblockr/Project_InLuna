import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
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
          if (window.location.pathname === "/login") {
            toast.success("Welcome back");
            navigate("/");
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
      refreshTimeout.current = setTimeout(refreshAuthToken, refreshTime);
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
          console.error(
            "Failed to refresh token. Response status:",
            response.status,
          );
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
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/auth/loginDas`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(loginData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed. Please check your credentials!",
        );
      }

      const decodedToken = jwtDecode(data.token);
      const userType = import.meta.env.VITE_USERTYPE;
      const userTypeUser = import.meta.env.VITE_USERTYPE_USER;

      localStorage.setItem("userType", decodedToken.userType);

      if (decodedToken.userType === userType) {
        setIsAuthenticated(true);
        scheduleTokenRefresh(data.token);
        setAccessToken(data.token);
        toast.success("Admin Login successful");
        navigate("/");
      } else if (decodedToken.userType == userTypeUser) {
        setIsAuthenticated(true);
        scheduleTokenRefresh(data.token);
        setAccessToken(data.token);
        toast.success("User Login successful");
        window.location.href = import.meta.env.VITE_TRAINING_URL;
      } else {
        toast.error("Unauthorized");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong!");
    }
  };

  const logout = async (setClearOrgId, message, toastStatus) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      await fetch(`${apiUrl}/auth/logoutDas`, {
        method: "POST",
        credentials: "include",
      });

      clearAuthState(setClearOrgId);

      if (toastStatus === "success") {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error("Logout failed:", error);
      clearAuthState(false);
      toast.error(
        "Failed to logout completely, but you are logged out locally.",
      );
    }
  };

  const clearAuthState = (clearOrgId) => {
    if (clearOrgId) {
      localStorage.removeItem("orgId");
    }

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
