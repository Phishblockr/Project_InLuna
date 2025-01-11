import React from "react";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { RiMailLine, RiPlayCircleLine } from "react-icons/ri";
import { NavLink } from "react-router-dom";

const iconStyle = "inline-block w-6 h-6 mr-3 -mt-2";
const activeLinkStyle = "py-5 px-3 w-full rounded-lg shadow bg-[#0364BD] text-[#f4f4f4] transition";
const inactiveLinkStyle = "py-5 px-3 w-full rounded-lg hover:shadow hover:bg-gray-100 dark:hover:bg-[#00285A] transition";
const appName = import.meta.env.VITE_APP_NAME
const subName = import.meta.env.VITE_SUB_NAME
const links = [
    {
        id: 1,
        icon: <MdOutlineSpaceDashboard className={iconStyle} />,
        title: "Overview",
        url: "/",
    },
    {
        id: 2,
        icon: <RiPlayCircleLine className={iconStyle} />,
        title: "Course",
        url: "/course",
    },
    {
        id: 3,
        icon: <RiMailLine className={iconStyle} />,
        title: "Email",
        url: "/email",
    },
];

const Sidebar = () => {
    return (
        <div className="w-64 l-0 r-0 bg-white fixed h-full px-4 py-2 z-10 dark:bg-[#002451]">
            <div className="my-2 mb-6">
                <h1 className="text-2xl text-left text-black font-medium tracking-tighter dark:text-[#F4F4F4]">
                    <NavLink to={'/'}>{appName}</NavLink>
                </h1>
                <p className="text-sm text-gray-600">{subName}</p>
            </div>
            <ul className="mt-4 text-black flex flex-col font-medium gap-2 dark:text-[#F4F4F4]">
                {links.map((link) => (
                    <li
                        key={link.id}
                        className="flex"
                    >
                        <NavLink to={link.url} title={link.title} className={({ isActive }) => (isActive ? activeLinkStyle : inactiveLinkStyle)}>
                            {link.icon}
                            {link.title}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
