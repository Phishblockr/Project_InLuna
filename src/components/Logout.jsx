import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthProvider';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate('/login'); // Redirect to the login page after logout
  }, [logout, navigate]);

  return (
    <div>Logging out...</div>
  );
}

export default Logout;