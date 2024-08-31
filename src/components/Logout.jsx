import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthProvider';
import { toast } from "sonner";

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate('/login'); // Redirect to the login page after logout
    toast.success("Logout successful")
  }, []);

  return (
    <div>Logging out...</div>
  );
}

export default Logout;