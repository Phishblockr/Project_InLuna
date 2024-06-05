import React, { useState } from "react";
import {
  RiSearchLine,
  RiNotificationBadgeLine,
  RiArrowDropDownLine,
} from "react-icons/ri";
import { FaRegUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const profileBtnStyle =
  "bg-[#0364BD] rounded-lg text-white transition hover:bg-[#003A70]";

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
    style: "bg-red-500 rounded-lg text-white transition hover:bg-red-700",
  },
];

const Navbar = () => {
  const [dropdown, setDropdown] = useState(false);

  const toggleDropdown = () => {
    setDropdown(!dropdown);
  };

  const closeDropdown = () => {
    setDropdown(false);
  };

  return (
    <nav className="bg-white px-4 py-3 flex justify-between sticky left-0 right-0 top-0 ml-64 z-10 dark:bg-[#001C40]">
      <div className="flex items-center text-x1">
        <div className="relative w-[40svw] max-w-xl md:w-65 rounded-lg hidden md:block">
          <input
            className="w-full px-4 py-1 pr-12 rounded-lg border-gray-300 border-2 text-gray-400 focus:outline-[#0364BD] dark:bg-[#001733] dark:border-0"
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
        <div className="text-black dark:text-[#F4F4F4]">
          <RiNotificationBadgeLine className="w-6 h-6" />
        </div>
        <div className="relative text-black flex items-center gap-x-3 dark:text-[#F4F4F4]">
          <FaRegUserCircle className="w-6 h-6 mt-1" />
          <div className="flex flex-col">
            <span>User</span>
            <span className="text-[10px]">Admin</span>
          </div>
          <button onClick={toggleDropdown} className="text-black dark:text-[#F4F4F4]">
            <RiArrowDropDownLine className="w-6 h-6 mt-1" />
          </button>
          {dropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={closeDropdown}
              ></div>
              <div className="z-20 absolute bg-white rounded-lg shadow w-32 top-full right-0 dark:bg-[#001C40]">
                <ul className="p-2 text-sm text-gray-950 gap-1 flex flex-col">
                  {profileSettings.map((setting) => (
                    <li key={setting.id} className={setting.style}>
                      <Link
                        onClick={closeDropdown}
                        className="flex items-center justify-center py-2"
                        to={setting.url}
                      >
                        {setting.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
