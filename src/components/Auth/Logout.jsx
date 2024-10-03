import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utils/AuthProvider';

const Logout = () => {
    const [clearOrgId, setClearOrgId] = useState(false);
    const { logout } = useAuth();

    const handleLogout = () => {
        logout(clearOrgId)
    }

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] h-[calc(100svh-65px)] flex flex-col justify-between relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            <p>Are you sure you want to log out?</p>
            <div className="mb-6">
                <input
                    onChange={(e) => setClearOrgId(e.target.checked)}
                    type="checkbox" id="clearOrgId" name="clearOrgId" checked={clearOrgId} />
                <label htmlFor="clearOrgId"> Clear organization Id</label>
            </div>
            <button onClick={handleLogout}>Yes</button>
        </div>
    );
}

export default Logout;