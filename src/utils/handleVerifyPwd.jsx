import { toast } from "sonner";

export const handleVerifyPwd = async (password, apiUrl, token) => {
    try {
        const response = await fetch(`${apiUrl}/user/verifyAdminPassword`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ password }),
        });
        const data = await response.json();

        if (!response.ok) {
            toast.error(data.error || "Failed to verify password.");
            return null; 
        }
        
        return data; 
    } catch (error) {
        toast.error(error.message);
        return null;
    }
};
