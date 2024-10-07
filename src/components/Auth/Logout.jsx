import React, { useState } from 'react';
import { useAuth } from '../../utils/AuthProvider';
import { useNavigate } from "react-router-dom";

const Logout = () => {
    const [clearOrgId, setClearOrgId] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(clearOrgId, "Logged out successfully", "success");
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl flex flex-col p-6 gap-4 dark:bg-[#002451] dark:text-[#f4f4f4]">
                <h2 className="font-bold">Are you sure you want to log out?</h2>
                <div className="mb-6">
                    <input
                        onChange={(e) => setClearOrgId(e.target.checked)}
                        type="checkbox"
                        id="clearOrgId"
                        name="clearOrgId"
                        checked={clearOrgId}
                        className="mr-2"
                    />
                    <label htmlFor="clearOrgId">Clear organization Id</label>
                </div>
                <div className="w-full flex gap-3">
                    <button
                        className="w-full bg-gray-200 hover:bg-gray-300 text-red-500 p-3 font-medium rounded-lg transition-colors dark:bg-[#001733] dark:hover:bg-[#001733]"
                        onClick={handleLogout}
                    >
                        Yes
                    </button>
                    <button
                    onClick={() => navigate("/")}
                        className="w-full bg-[#0364BD] hover:bg-[#003A70] p-3 text-[#f4f4f4] font-medium rounded-lg"
                    >
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Logout;
