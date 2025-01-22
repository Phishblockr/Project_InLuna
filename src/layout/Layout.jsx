import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Navigation/Sidebar';
import Navbar from '../components/Navigation/Navbar';

const Layout = () => {
    const location = useLocation();

    const isLoginPage = location.pathname === '/login';
    const isLogoutPage = location.pathname === '/logout';
    const isForgotDetailsPage = location.pathname === '/forgotDetails';
    const isResetPasswordPage = location.pathname.startsWith('/resetPassword');

    const showSidebarAndNavbar =
        !isLoginPage && !isLogoutPage && !isResetPasswordPage && !isForgotDetailsPage;

    return (
        <div className="min-h-screen dark:bg-[#001733]">
            {/* Conditional Navbar */}
            {showSidebarAndNavbar && <Navbar />}

            <div className="flex">
                {/* Conditional Sidebar */}
                {showSidebarAndNavbar && (
                    <div className="w-64 fixed left-0 top-0 h-full z-10">
                        <Sidebar />
                    </div>
                )}

                {/* Main Content */}
                <div
                    className={`flex-grow ${
                        showSidebarAndNavbar ? 'ml-64' : ''
                    }`}
                >
                    <div>
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
