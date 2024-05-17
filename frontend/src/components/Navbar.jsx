import React from "react";
import {
  RiSearchLine,
  RiNotificationBadgeLine,
  RiArrowDropDownLine,
} from "react-icons/ri";
import { FaRegUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const profileBtnStyle =
  "bg-[#0364BD] py-2 rounded-lg text-white transition hover:bg-[#003A70]";

const profileSettings = [
  {
    id: 1,
    title: "Profile",
    url: "/profileSettings",
    style: profileBtnStyle,
  },
  {
    id: 2,
    title: "Settings",
    url: "settings",
    style: profileBtnStyle,
  },
  {
    id: 3,
    title: "Log Out",
    url: "#",
    style: "bg-red-500 py-2 rounded-lg text-white transition hover:bg-red-700",
  },
];

const Navbar = () => {
  return (
    <nav className="bg-white px-4 py-3 flex justify-between sticky left-0 right-0 top-0 ml-64 z-10">
      <div className="flex items-center text-x1">
        <div className="relative w-[40svw] md:w-65 rounded-lg hidden md:block">
          <input
            className="w-full px-4 py-1 pr-12 rounded-lg outline-none focus:outline-blue-400 border-grey border-2"
            type="text"
            placeholder="Search..."
          />
          <span className="relative md:absolute inset-y-0 right-0 flex items-center pl-2 pr-2 bg-[#0364BD] rounded-r-lg hover:bg-[#003A70] cursor-pointer transition">
            <button className="p-1 px-2 focus:outline-none text-white">
              <RiSearchLine />
            </button>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-x-5">
        <div className="text-black">
          <RiNotificationBadgeLine className="w-6 h-6" />
        </div>
        <div className="relative text-black flex items-center gap-x-3">
          <FaRegUserCircle className="w-6 h-6 mt-1" />
          <div className="flex flex-col">
            <span>User</span>
            <span className="text-[10px]">Admin</span>
          </div>
          <button className="text-black group">
            <RiArrowDropDownLine className="w-6 h-6 mt-1" />
            <div className="z-10 hidden absolute bg-white rounded-lg shadow w-32 group-focus:block top-full right-0">
              <ul className="p-2 text-sm text-gray-950 gap-1 flex flex-col">
                {profileSettings.map((setting) => (
                  <li key={setting.id} className={setting.style}>
                    <Link to={setting.url}>{setting.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
