import React from "react";
import { RiSendPlane2Line } from "react-icons/ri";

const Settings = () => {
  return (
    <div className="z-1 w-[calc(100svw-16rem)] h-[calc(100svh-10%)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className='<div className="z-1 w-full font-medium bg-white rounded-xl shadow-xl p-3 h-full">'>
        <div>
          <h1 className="mb-10 pt-3 pl-5 text-2xl font-medium">
            Phisblokr Settings
          </h1>
        </div>
        <div className="grid grid-cols-[minmax(10%,_1fr)_300px]  gap-2">
          <div className="p-3 bg-gray-100 rounded-lg">
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
            <select className="w-[200px] p-2 rounded-lg" name="theme" id="theme">
              <option value="default">Theme</option>
              <option value="default">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <div>
          {/* add social media links */}
        </div>
      </div>
    </div>
  );
};

export default Settings;
