import React from "react";

export default function Log({ blog, setBlog, showBlog }) {
    return (
        <div className="flex rounded-lg shadow-md bg-white justify-between items-center dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
            <div className="flex">
                <div
                    className={`${blog.type === "whitelisted" ? "bg-[#00695C]" : "bg-[#C62828]"
                        } rounded-s-lg p-3`}
                ></div>
                <div className="p-3 text-right flex gap-5">
                    <h1 className="text-right font-medium pr-8 border-r-2 border-gray-500">
                        {blog.day}
                    </h1>
                    <h1 className="text-right font-medium pr-8 border-r-2 border-gray-500">
                        {blog.date}, {blog.time}
                    </h1>
                    <h1 className="text-right font-medium pr-8 border-r-2 border-gray-500">
                        {blog.name}
                    </h1>
                    <h1 className="text-right font-medium pr-8">{blog.phishingUrl}</h1>
                </div>
            </div>
            <div className="flex justify-center items-center pr-3">
                <button onClick={() => setBlog(!showBlog)}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}
