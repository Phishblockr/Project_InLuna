import React from "react";
import { NavLink } from "react-router-dom";
import { IoEyeOutline } from "react-icons/io5";
import sampleVideo from "../assets/flower.webm"

const courses = [
  {
    id: 1,
    name: "Identifying Threats",
    completion: "10",
    category: "Security",
    interactive: true,
    status: "Not Completed",
    url:'/identifying-threats'
  },
  {
    id: 2,
    name: "Phishing Basics",
    completion: "80",
    category: "General",
    interactive: true,
    status: "Completed",
    url:'/phishing-basics'
  },
  {
    id: 3,
    name: "How to download software safely",
    completion: "30",
    category: "Network",
    interactive: true,
    status: "Not Completed",
    url:'how-to-download-software-safely'
  },
];

const Overview = () => {
  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="flex gap-x-5 py-5 px-5">
        <div className="h-[270px] w-[750px] bg-[#e6e6e6] rounded-lg overflow-hidden">
          <a>
            <video controls className="h-[270px] w-[750px]">
              <source src={sampleVideo} type="video/webm"/>
            </video>
          </a>
        </div>
        <div className="flex flex-col justify-between w-full py-4">
          <div className="">
            <h1 className="font-semibold text-3xl">Phishing Tutorial</h1>
            <p className="text-base">Course Name / Module Name</p>
          </div>
          <div className="flex gap-x-5">
            <NavLink
              to={"/training"}
              className={`bg-[#e6e6e6] py-2 px-8 rounded-xl`}
            >
              Start Over
            </NavLink>
            <NavLink
              to={"/training"}
              className={`bg-[#0364BD] py-2 px-4 rounded-xl text-white`}
            >
              Continue Watching
            </NavLink>
          </div>
        </div>
      </div>
      <div className="w-full">
        <h2 className="text-2xl">Currently Enrolled Courses</h2>
        <table className="w-full">
          <thead >
            <tr className="">
              <th className="font-normal text-left py-2">Course Name</th>
              <th className="font-normal py-2">Completion</th>
              <th className="font-normal py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr
                key={course.id}
                className={`${
                  course.id % 2 === 0 ? "bg-[#F7F4F4]" : "bg-white"
                } hover:bg-gray-100 `}
              >
                <td className="py-2">{course.name}</td>
                <td className="text-center py-2">{course.completion}%</td>
                <td className="flex justify-center items-center py-2">
                  <NavLink to={course.url}>
                    <IoEyeOutline className="text-2xl font-semibold h-6 hover:text-[#0364BD] cursor-pointer" />
                  </NavLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div></div>
    </div>
  );
};

export default Overview;
