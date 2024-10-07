import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAuth } from './AuthProvider';

const UpdatePasswordModal = ({ isOpen, onClose }) => {
    const { logout } = useAuth();
    const dispatch = useDispatch();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [passwordValid, setPasswordValid] = useState(true);

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    const handleUpdatePassword = async () => {

        if (!passwordRegex.test(newPassword)) {
            setPasswordValid(false);
            toast.error("Password must be at least 6 characters long and contain both letters and numbers.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordsMatch(false);
            toast.error("Passwords do not match");
            return;
        }

        setPasswordsMatch(true);
        setPasswordValid(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const token = JSON.parse(localStorage.getItem("user")).token;

            const response = await fetch(`${apiUrl}/user/updateAdminPwd`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to update password");
            }

            toast.success("Password updated successfully. Please log in again.");
            onClose(); // Close the modal
            logout(); // Log out the user
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-[#002451] p-6 rounded-lg w-[400px]">
                <h2 className="text-xl font-semibold">Update Password</h2>
                <p className="text-red-500 mt-2">Updating password will log you out!</p>


                <div className="mt-4">
                    <label className="block mb-2">Old Password:</label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-[#001C40] dark:border-0"
                    />
                </div>
                <div className="mt-4">
                    <label className="block mb-2">New Password:</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-[#001C40] dark:border-0"
                    />
                </div>
                <div className="mt-4">
                    <label className="block mb-2">Confirm New Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-[#001C40] dark:border-0"
                    />
                </div>
                <div className="flex justify-between mt-6">
                    <button
                        onClick={handleUpdatePassword}
                        className="bg-[#0364BD] hover:bg-[#003A70] text-[#f4f4f4] font-medium py-2 px-4 rounded-lg"
                    >
                        Update Password
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-300 hover:bg-gray-400 text-black font-medium py-2 px-4 rounded-lg dark:bg-[#001C40] dark:text-[#f4f4f4]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdatePasswordModal;