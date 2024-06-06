import React from "react";
import {
  RiInstagramFill,
  RiLinkedinBoxFill,
  RiGithubFill,
} from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../features/Theme/themeSlice";

const Settings = () => {
  // Redux
  const theme = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  console.log(theme);
  // End of Redux

  const handleSetTheme = (value) => {
    dispatch(setTheme(value))
  }


  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] h-[90svh] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="z-1 relative w-full font-medium bg-white rounded-xl shadow-xl p-3 h-full dark:bg-[#001C40]">
        <div>
          <h1 className="mb-10 pt-3 pl-5 text-2xl font-medium dark:text-[#F4F4F4]">
            Phisblokr Settings
          </h1>
        </div>
        <div className="absolute top-20 bottom-5 left-5 right-5 flex flex-col justify-between">
          <div className="grid grid-cols-[minmax(10%,_1fr)_300px]  gap-5">
            <div className="p-3 bg-gray-100 rounded-lg dark:bg-[#002451] dark:text-[#F4F4F4]">
              <span className="text-xl font-medium">About</span>
              <div>
                <span>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                  accumsan dolor tempor, lacinia risus et, sollicitudin turpis.
                  Pellentesque vestibulum vestibulum lorem eget consequat.
                </span>
              </div>
            </div>
            <div>
              <select
                className="w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#002451] dark:text-[#F4F4F4]"
                name="theme"
                id="theme"
                onChange={(e) => handleSetTheme(e.target.value)}
                value={theme}
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
              </select>
            </div>
          </div>
            <div className="flex justify-end gap-2 dark:text-[#F4F4F4]">
              <a href="#">
                <RiInstagramFill className="w-6 h-6"/>
              </a>
              <a href="#">
                <RiLinkedinBoxFill className="w-6 h-6"/>
              </a>
              <a href="#">
                <RiGithubFill className="w-6 h-6"/>
              </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
