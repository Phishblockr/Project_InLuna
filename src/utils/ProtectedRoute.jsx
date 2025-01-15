import {Outlet, Navigate} from "react-router-dom";
import {useAuth} from "./AuthProvider.jsx"

const ProtectedRoute = () => {
    const userType = localStorage.getItem("userType");
    const Admin = import.meta.env.VITE_USERTYPE_ADMIN;
    const User = import.meta.env.VITE_USERTYPE;

    const { isAuthenticated } = useAuth();

    if(!isAuthenticated){
        window.location.href = import.meta.env.VITE_LOGIN_URL;
        return null;
    }

    if (isAuthenticated) {
        if (userType === Admin) {
            // Redirect user to the training dashboard login
            window.location.href = import.meta.env.VITE_LOGIN_URL;
            return null; // Prevent rendering anything during redirection
        } else {
            // Redirect admin to the login page
            return isAuthenticated ? <Outlet /> : <Navigate to="/"/>;

        }
    }

    return <Outlet />; // Render the child components if authenticated
};


export default ProtectedRoute;