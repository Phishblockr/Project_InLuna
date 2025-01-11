import React, { useState } from 'react'
import { toast } from "sonner";

const ForgotDetails = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const [email, setEmail] = useState("");
    const [isPasswordReset, setIsPasswordReset] = useState(false);
    const [isUsernameReminder, setIsUsernameReminder] = useState(false);
    const [isOrgIdRem, setIsOrgIdRem] = useState(false);

    const handleSendEmail = async (event) => {
        event.preventDefault();

        const formData = {
            email,
            isPasswordReset,
            isUsernameReminder,
            isOrgIdRem,
            reqMadeFrom: "dashboard"
        };
        try {
            const response = await fetch(`${apiUrl}/forgot/forgotDetails`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const data = await response.json();
                toast.error(data.message || 'Unable to process request.');
                return
            }
            toast.success("E-mail sent successfully please refer E-mail for futher steps");
        } catch (error) {
            toast.error(error.message);
        }
    }

    return (

        <div className="flex justify-center">
            <div className="flex flex-col ">
                <h1 className=" flex justify-center text-2xl text-left text-black font-bold tracking-tighter my-5 dark:text-[#F4F4F4]">
                    InLuna
                </h1>
                <div className="bg-white rounded-lg shadow p-10 dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <form onSubmit={handleSendEmail}>

                        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Details</h2>
                        <div className="mb-4">
                            <label htmlFor="email">E-mail:</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
                            />
                        </div>
                        <div className='mb-4 flex flex-col gap-2'>
                            <div className='flex flex-row gap-2'>
                                <input
                                    type="checkbox"
                                    name="resetPassword"
                                    id="resetPassword"
                                    checked={isPasswordReset}
                                    onChange={(e) => setIsPasswordReset(e.target.checked)}
                                />
                                <label htmlFor="resetPassword">Request Reset Password Link</label>
                            </div>
                            <div className='flex flex-row gap-2'>
                                <input type="checkbox"
                                    name="username"
                                    id="username"
                                    checked={isUsernameReminder}
                                    onChange={(e) => setIsUsernameReminder(e.target.checked)}
                                />
                                <label htmlFor="username">Request Username Reminder </label>
                            </div>
                            <div className='flex flex-row gap-2'>
                                <input type="checkbox"
                                    name="orgIdRem"
                                    id="orgIdRem"
                                    checked={isOrgIdRem}
                                    onChange={(e) => setIsOrgIdRem(e.target.checked)}
                                />
                                <label htmlFor="orgIdRem">Request Organization Reminder </label>
                            </div>
                        </div>
                        <input className="w-full bg-[#0364BD] text-[#f4f4f4] py-2 rounded-md hover:bg-[#003A70] transition-colors font-medium" type="submit" value="Send E-mail" />
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ForgotDetails