import {Outlet, Navigate} from "react-router-dom";
import {useAuth} from "./AuthProvider.jsx"

const ProtectedRoute = () => {
    const userType = localStorage.getItem("userType");
    const Admin = import.meta.env.VITE_USERTYPE_ADMIN;
    const User = import.meta.env.VITE_USERTYPE_USER;

    const { isAuthenticated } = useAuth();

    if(!isAuthenticated){
        return <Navigate to="/login"/>;
    }

    if (isAuthenticated) {
        if (userType === User) {
            // Redirect user to the training dashboard login
            window.location.href = import.meta.env.VITE_TRAINING_URL;
            return null; // Prevent rendering anything during redirection
        } else {
            // Redirect admin to the login page
            return isAuthenticated ? <Outlet /> : <Navigate to="/login"/>;

        }
    }

};


export default ProtectedRoute;