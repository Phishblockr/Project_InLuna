import React, { useEffect, useState } from "react";
import {
  RiSearchLine,
  RiNotificationBadgeLine,
  RiArrowDropDownLine,
  RiQuestionLine,
} from "react-icons/ri";
import { FaRegUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const profileBtnStyle =
  "rounded-lg dark:text-white transition hover:bg-white dark:hover:bg-[#00285A]";
const dropdownTheme = "bg-[#f7f4f4] dark:bg-[#182A46]"
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
    url: "/logout",
    style:
      "rounded-lg text-red-500 transition hover:bg-white dark:hover:bg-[#00285A]",
  },
];

const HelpOptions = [
  {
    id: 1,
    title: "Feedback",
    url: "/feedback",
    style: profileBtnStyle,
  },
  {
    id: 2,
    title: "Support",
    url: "/support",
    style: profileBtnStyle,
  },
  {
    id: 3,
    title: "Report a bug",
    url: "/report",
    style: profileBtnStyle,
  },
  {
    id: 4,
    title: "FAQs",
    url: "/faq",
    style: profileBtnStyle,
  },
];

const Navbar = () => {
  const [dropdown, setDropdown] = useState(false);
  const [helpDropdown, setHelpDropdown] = useState(false);
  const [userData, setUserData] = useState("")

  const toggleDropdown = () => {
    setDropdown(!dropdown);
  };

  const closeDropdown = () => {
    setDropdown(false);
  };

  const toggleHelpDropdown = () => {
    setHelpDropdown(!helpDropdown);
  };

  const closeHelpDropdown = () => {
    setHelpDropdown(false);
  };

  const fetchUser = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user.token;
      const response = await fetch(`${apiUrl}/user/profile`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setUserData(data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);


  return (
    <nav className="bg-white px-4 py-3 flex justify-between sticky left-0 right-0 top-0 ml-64 z-10 dark:bg-[#002451]">
      <div className="flex items-center text-x1">
        <div className="relative w-[40svw] max-w-xl md:w-65 rounded-lg hidden md:block">
          <input
            className="w-full px-4 py-1 pr-12 rounded-lg border-gray-300 border-2 text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
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
        <button
          title="help"
          onClick={toggleHelpDropdown}
          className="text-black dark:text-[#F4F4F4]"
        >
          <RiQuestionLine className="w-6 h-6" />
        </button>
        {helpDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={closeHelpDropdown}
            ></div>
            <div className={`z-20 absolute rounded-lg shadow w-32 top-full right-40 ${dropdownTheme}`}>
              <ul className="p-2 text-sm text-gray-950 gap-1 flex flex-col">
                {HelpOptions.map((option) => (
                  <li key={option.id} className={option.style}>
                    <Link
                      title={option.title}
                      onClick={closeHelpDropdown}
                      className="flex items-center justify-center py-2"
                      to={option.url}
                    >
                      {option.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        <div className="text-black dark:text-[#F4F4F4]">
          <RiNotificationBadgeLine className="w-6 h-6" />
        </div>
        <div className="relative text-black flex items-center gap-x-3 dark:text-[#F4F4F4]">
          {userData.img ? <img className="w-[24px] h-[24px] rounded-full" src={userData.img} alt="profile pic" /> : <FaRegUserCircle className="w-6 h-6 mt-1" />}
          
          <div className="flex flex-col">
            <span>{userData.name}</span>
            <span className="text-[10px]">Admin</span>
          </div>
          <button
            title="settings"
            onClick={toggleDropdown}
            className="text-black dark:text-[#F4F4F4]"
          >
            <RiArrowDropDownLine className="w-6 h-6 mt-1" />
          </button>
        </div>
        {dropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={closeDropdown}></div>
            <div className={`z-20 absolute rounded-lg shadow w-32 top-full right-0 ${dropdownTheme}`}>
              <ul className="p-2 text-sm text-gray-950 gap-1 flex flex-col">
                {profileSettings.map((setting) => (
                  <li key={setting.id} className={setting.style}>
                    <Link
                      title={setting.title}
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
    </nav>
  );
};

export default Navbar;
