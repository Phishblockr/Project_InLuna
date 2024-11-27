import React, { useState } from "react";

export default function AuthenticateModal({ isOpen, onClose, onConfirm }) {
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password); // Send the password to the confirmation callback
        handleClose();
    };

    const handleClose = () => {
        setPassword("");
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white relative p-6 rounded-lg shadow-lg w-96 dark:bg-[#002451] dark:text-[#f4f4f4]">
                <h2 className="text-xl font-medium mb-4">Confirm Admin Password</h2>
                <form onSubmit={handleSubmit}>
                    <label className="block mb-2">
                        Enter your password to confirm:
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-[#001C40] dark:border-0"
                            required
                        />
                    </label>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="bg-gray-300 hover:bg-gray-400 text-black font-medium py-2 px-4 rounded-lg dark:bg-[#001C40] dark:text-[#f4f4f4]"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="bg-blue-600 text-[#f4f4f4] p-2 rounded-lg">
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
