import {Outlet, Navigate} from "react-router-dom";
import {useAuth} from "./AuthProvider.jsx"

const ProtectedRoute = () => {
    const {isAuthenticated} = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login"/>;
};

export default ProtectedRoute;