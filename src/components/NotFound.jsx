import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] h-[calc(100svh-65px)] flex flex-col justify-center items-center relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center text-6xl font-bold text-black dark:text-white">
                    <span className="text-[150px]">4</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="47.5 47.5 105 105">
                        <circle cx="100" cy="100" r="50" fill="white" stroke="red" stroke-width="5"></circle>
                        <circle cx="100" cy="100" r="25" fill="black"></circle>
                    </svg>
                    <span className="text-[150px]">4</span>
                </div>

                <h2 className="text-2xl font-semibold mt-4 text-gray-800 dark:text-gray-200">
                    There's NOTHING here...
                </h2>
                <p className="mt-2 text-md text-gray-600 dark:text-gray-400">
                    ...maybe the page you're looking for is not found or never existed
                </p>

                <Link to="/" className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Back to overview
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
