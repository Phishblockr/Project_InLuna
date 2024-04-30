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

const iconStyle = "inline-block w-6 h-6 mr-3 -mt-2";

const links = [
  {
    id: 1,
    icon: <MdOutlineSpaceDashboard className={iconStyle} />,
    title: "Overview",
    url: "#",
  },
  {
    id: 2,
    icon: <RiUserLine className={iconStyle} />,
    title: "Users",
    url: "#",
  },
  {
    id: 3,
    icon: <CgInsights className={iconStyle} />,
    title: "Insights",
    url: "#",
  },
  {
    id: 4,
    icon: <RiFileList3Line className={iconStyle} />,
    title: "URL Lists",
    url: "#",
  },
  {
    id: 5,
    icon: <RiPagesLine className={iconStyle} />,
    title: "Requests",
    url: "#",
  },
  {
    id: 6,
    icon: <RiFeedbackLine className={iconStyle} />,
    title: "Feedbacks",
    url: "#",
  },
  {
    id: 7,
    icon: <RiGitRepositoryLine className={iconStyle} />,
    title: "Logs",
    url: "#",
  },
];

const Sidebar = () => {
  return (
    <div className="w-64 bg-white fixed h-full px-4 py-2">
      <div className="my-2 mb-6">
        <h1 className=" text-xl text-left text-black font-bold">Phishblokr</h1>
      </div>
      <ul className="mt-4 text-black font-bold">
        {links.map((link) => (
          <li
            key={link.id}
            className="py-5 rounded-lg hover:shadow hover:bg-blue-500 hover:text-white"
          >
            <a href={link.url} className="px-3">
              {link.icon}
              {link.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
