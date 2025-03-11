import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LuChevronFirst, LuChevronLast } from "react-icons/lu";
import { MdOutlineSpaceDashboard } from 'react-icons/md';
import { RiMailLine, RiPlayCircleLine } from 'react-icons/ri';

const Sidebar2 = ({ expanded, setExpanded }) => {
    const appName = import.meta.env.VITE_APP_NAME
    const iconStyle = " inline-block w-[24px] h-[24px]";
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
            icon: <RiPlayCircleLine className={iconStyle} />,
            title: "Course",
            url: "/courses",
        },
        {
            id: 3,
            icon: <RiMailLine className={iconStyle} />,
            title: "Email",
            url: "/emails",
        },        {
            id: 4,
            icon: <RiMailLine className={iconStyle} />,
            title: "Appointments",
            url: "/appointments",
        },
    ];

    return (
        <nav className={`h-full flex flex-col bg-white shadow-sm transition-all dark:bg-[#002451] ${expanded ? "w-61" : "w-20"}`}>
            <div className="p-4 pb-2 flex justify-between items-center">
                <img className='w-[24px] mr-2' src="/vite.svg" alt="" />
                <h1 className={`text-2xl text-left text-black font-medium tracking-tighter dark:text-[#F4F4F4] overflow-hidden transition-all ${expanded ? "w-52" : "w-0"}`}>
                    <NavLink to={'/'}>{appName}</NavLink>
                </h1>
                <button onClick={() => setExpanded(!expanded)} className="p-1 5 rounded-lg hover:bg-gray-100 dark:text-[#F4F4F4] dark:bg- dark:hover:bg-[#00285A]">
                    {expanded ? <LuChevronFirst /> : <LuChevronLast />}
                </button>
            </div>
            <ul className="flex-1 px-2 dark:text-[#F4F4F4]">
                {links.map((link) => (
                    <li
                        key={link.id}
                        className="relative flex items-center py-2 font-medium rounded-md cursor-pointer"
                    >
                        <NavLink to={link.url} title={link.title} className={({ isActive }) => (isActive ? activeLinkStyle : inactiveLinkStyle)}>
                            <div className='flex justify-center gap-2'>
                                {link.icon}
                                <span className={`overflow-hidden transition-all ${expanded ? "w-52" : "hidden"}`}>
                                    {link.title}
                                </span>
                            </div>
                        </NavLink>
                        {/* {alert && (
                                <div className="absolute right-2 w-2 h-2 rounded bg-red-500"></div>
                            )} */}
                    </li>
                ))}
            </ul>
        </nav>
    )
}

export default Sidebar2