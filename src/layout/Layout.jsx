import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar2 from '../components/Navigation/Sidebar2';
import Navbar from '../components/Navigation/Navbar';

const Layout = () => {
    const location = useLocation();

    const isLoginPage = location.pathname === '/login';
    const isLogoutPage = location.pathname === '/logout';
    const isForgotDetailsPage = location.pathname === '/forgotDetails';
    const isResetPasswordPage = location.pathname.startsWith('/resetPassword');
    const isPasswordResetSuccessfulPage = location.pathname === "/passwordResetSuccessful"
    const isPasswordSetSuccessfulPage = location.pathname === "/passwordSetSuccessful"

    const showSidebarAndNavbar =
        !isLoginPage && !isLogoutPage && !isResetPasswordPage && !isForgotDetailsPage &&isPasswordResetSuccessfulPage && isPasswordSetSuccessfulPage;

    // Lift sidebar state here
    const [expanded, setExpanded] = useState(true);

    // Define dynamic widths/margins based on expanded state
    const sidebarWidth = expanded ? 'w-64' : 'w-20';
    const contentMargin = expanded ? 'ml-64' : 'ml-20';

    return (
        <div className="min-h-screen dark:bg-[#001733]">
            {/* Pass expanded state to Navbar */}
            {showSidebarAndNavbar && <Navbar expanded={expanded} />}
            <div className="flex">
                {showSidebarAndNavbar && (
                    <div className={`${sidebarWidth} fixed left-0 top-0 h-full z-10 transition-all`}>
                        <Sidebar2 expanded={expanded} setExpanded={setExpanded} />
                    </div>
                )}
                <div className={`flex-grow transition-all ${showSidebarAndNavbar ? contentMargin : ''}`}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
