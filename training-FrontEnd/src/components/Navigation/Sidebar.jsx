import React from "react";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { RiFileList3Line } from "react-icons/ri";
import { MdOutlineEmail } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { TbCircleDashed } from "react-icons/tb";

const iconStyle = "inline-block w-6 h-6 mr-3 -mt-2";
const activeLinkStyle = "py-5 px-3 w-full rounded-lg shadow bg-[#0364BD] text-[#f4f4f4] transition";
const inactiveLinkStyle = "py-5 px-3 w-full rounded-lg hover:shadow hover:bg-gray-100 dark:hover:bg-[#00285A] transition";

const links = [
    {
        id: 1,
        icon: <MdOutlineSpaceDashboard className={iconStyle} />,
        title: "Overview",
        url: "/",
    },
    {
        id: 2,
        icon: <MdOutlineEmail className={iconStyle} />,
        title: "Email Box",
        url: "/email/inbox",
    },
    {
        id: 3,
        icon: <TbCircleDashed className={iconStyle} />,
        title: "Training",
        url: "/training",
    },
];

const Sidebar = () => {
    return (
        <div className="w-64 l-0 r-0 bg-white fixed h-full px-4 py-2 z-10 dark:bg-[#002451]">
            <div className="my-2 mb-6">
                <h1 className="text-2xl text-left text-black font-medium tracking-tighter dark:text-[#F4F4F4]">
                    <NavLink to={'/'}>InLuna</NavLink>
                </h1>
                <p className="text-sm text-[#0364BD] font-semibold">Training Platform</p>
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
