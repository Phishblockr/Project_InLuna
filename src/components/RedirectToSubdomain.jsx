import React, { useEffect } from "react";
import { useAuth } from "../utils/AuthProvider";
import { getOrgIdFromToken } from "../utils/getOrgIdFromToken";

const RedirectToSubdomain = () => {
    const { getToken } = useAuth();

    useEffect(() => {
        const token = getToken();
        if (!token) return; // No token available yet

        const orgId = getOrgIdFromToken(token);
        if (!orgId) return; // Token doesn't have orgId

        const currentHost = window.location.hostname; // e.g., "lvh.me" or "org123.lvh.me"
        // Check if the current hostname starts with the tenant subdomain
        if (!currentHost.startsWith(`${orgId}.`)) {
            // Construct the new hostname
            // For local development, using lvh.me domain (which points to 127.0.0.1)
            const newHost = `${orgId}.${import.meta.env.VITE_DOMAIN_NAME}`;
            // If you need to include the port (e.g., :3000) on development:
            const port = window.location.port ? `:${window.location.port}` : "";
            const newUrl = `${window.location.protocol}//${newHost}${port}${window.location.pathname}${window.location.search}`;
            window.location.href = newUrl;
        }
    }, [getToken]);

    // This component doesn't render anything visible
    return null;
};

export default RedirectToSubdomain;
