import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from "sonner";

const PasswordReset = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordReset = async (event) => {
        event.preventDefault();

        const formData = {
            newPassword,
            confirmPassword
        };

        try {
            const response = await fetch(`${apiUrl}/forgot/resetPassword/${token}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                toast.error(data.message || 'Unable to reset password.');
                return 
            }
            toast.success("Password Reset Successful");
            navigate("/login");
        } catch (err) {
            toast.error(err.message);
        }

    }

    return (

        <div className="flex justify-center">
            <div className="flex flex-col ">
                <h1 className=" flex justify-center text-2xl text-left text-black font-bold tracking-tighter my-5 dark:text-[#F4F4F4]">
                    Phishblokr
                </h1>
                <div className="bg-white rounded-lg shadow p-10 dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <form onSubmit={handlePasswordReset}>

                        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
                        <div className="mb-4">
                            <label htmlFor="newPassword">New Password:</label>
                            <input
                                type="password"
                                name="newPassword"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="confirmPassword">Confirm Password:</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
                            />
                        </div>

                        <input className="w-full bg-[#0364BD] text-[#f4f4f4] py-2 rounded-md hover:bg-[#003A70] transition-colors font-medium" type="submit" value="Reset Password" />
                    </form>
                </div>
            </div>
        </div>
    )
}

export default PasswordReset