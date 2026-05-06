import React from 'react'

const PasswordResetDone = () => {
    return (
        <div className="w-full h-[100svh] flex flex-col items-center justify-center text-center bg-white">
            <div className="flex items-center justify-center text-6xl font-bold text-black dark:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="47.5 47.5 105 105">
                    <circle cx="100" cy="100" r="50" fill="white" stroke="red" stroke-width="5"></circle>
                    <circle cx="100" cy="100" r="25" fill="black"></circle>
                </svg>
                
                <span className="text-[150px]">K</span>
            </div>

            <h2 className="text-2xl font-semibold mt-4 text-gray-800 dark:text-gray-200">
                Your password has been reset!
            </h2>
            <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                Now you can close this page and start browsing safely.
            </p>
        </div>
    )
}

export default PasswordResetDone