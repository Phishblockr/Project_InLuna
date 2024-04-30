import React from "react";
import {
  RiSearchLine,
  RiNotificationBadgeLine,
  RiArrowDropDownLine,
} from "react-icons/ri";
import { FaRegUserCircle } from "react-icons/fa";

const profileBtnStyle =
  "bg-[#0364BD] m-2 py-2 rounded text-white hover:bg-[#003A70]";

const profileSettings = [
  {
    id: 1,
    title: "Profile",
    url: "#",
    style: profileBtnStyle,
  },
  {
    id: 2,
    title: "Settings",
    url: "#",
    style: profileBtnStyle,
  },
  {
    id: 3,
    title: "Log Out",
    url: "#",
    style: "bg-red-500 m-2 py-2 rounded text-white hover:bg-red-700",
  },
];

const Navbar = () => {
  return (
    <nav className="bg-white px-4 py-3 flex justify-between ml-64">
      <div className="flex items-center text-x1">
        <div className="relative w-[40svw] md:w-65 border-2 rounded-lg border-black hidden md:block">
          <input
            className="w-full px-4 py-1 pr-12 rounded-lg shadow outline-none"
            type="text"
            placeholder="Search..."
          />
          <span className="relative md:absolute inset-y-0 right-0 flex items-center pl-2 pr-2 bg-[#0364BD] rounded-r-lg hover:bg-[#003A70] cursor-pointer ">
            <button className="p-1 focus:outline-none text-white">
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
            <div className="z-10  hidden absolute bg-white rounded-lg shadow w-32 group-focus:block top-full right-0">
              <ul className="py-2 text-sm text-gray-950">
                {profileSettings.map((setting) => (
                  <li key={setting.id} className={setting.style}>
                    <a href={setting.url}>{setting.title}</a>
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
