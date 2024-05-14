import React from "react";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import {
  RiUserLine,
  RiFileList3Line,
  RiPagesLine,
  RiFeedbackLine,
  RiGitRepositoryLine,
} from "react-icons/ri";
import { CgInsights } from "react-icons/cg";
import { NavLink } from "react-router-dom";

const iconStyle = "inline-block w-6 h-6 mr-3 -mt-2";
const activeLinkStyle = "py-5 px-3 w-full rounded-lg shadow bg-[#0364BD] text-white transition";
const inactiveLinkStyle = "py-5 px-3 w-full rounded-lg hover:shadow hover:bg-[#0364BD] hover:text-white transition";

const links = [
  {
    id: 1,
    icon: <MdOutlineSpaceDashboard className={iconStyle} />,
    title: "Overview",
    url: "/",
  },
  {
    id: 2,
    icon: <RiUserLine className={iconStyle} />,
    title: "Users",
    url: "/users",
  },
  {
    id: 3,
    icon: <CgInsights className={iconStyle} />,
    title: "Insights",
    url: "/insights",
  },
  {
    id: 4,
    icon: <RiFileList3Line className={iconStyle} />,
    title: "URL Lists",
    url: "/urllists",
  },
  {
    id: 5,
    icon: <RiPagesLine className={iconStyle} />,
    title: "Requests",
    url: "/requests",
  },
  {
    id: 6,
    icon: <RiFeedbackLine className={iconStyle} />,
    title: "Feedbacks",
    url: "/feedbacks",
  },
  {
    id: 7,
    icon: <RiGitRepositoryLine className={iconStyle} />,
    title: "Logs",
    url: "/logs",
  },
];

const Sidebar = () => {
  return (
    <div className="w-64 l-0 r-0 bg-white fixed h-full px-4 py-2 z-10">
      <div className="my-2 mb-6">
        <h1 className="text-2xl text-left text-black font-normal tracking-tighter">
          <NavLink to={'/'}>Phishblokr</NavLink>
        </h1>
      </div>
      <ul className="mt-4 text-black flex flex-col font-normal gap-2">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex"
          >
            <NavLink to={link.url} className={({isActive}) => (isActive ? activeLinkStyle : inactiveLinkStyle)}>
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
