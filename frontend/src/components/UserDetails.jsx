import React from "react";
import { RiLoopLeftLine, RiDeleteBinLine } from "react-icons/ri";

const user = {
  id: 1,
  profileImage:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  name: "Johnita Doe",
  email: "johnitadoe@gmail.com",
  department: "Software",
  role: "Developer",
  status: "Active",
};

const statusActive =
  "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg";
const statusInactive =
  "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg";

const EditUser = () => {
  return (
    <div className="z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max">
        <div>
          <h1 className="text-2xl font-normal tracking-tight mb-5">
            User Details
          </h1>
        </div>
        <div className="flex flex-row gap-x-5 items-center">
          <img
            className="w-[10rem] h-[10rem] rounded-full object-cover"
            src={user.profileImage}
            alt="user Profile"
          />
          <ul className="flex flex-col">
            <li className="font-normal text-3xl my-2">{user.name}</li>
            <li className="font-normal mb-1">
              <span className="text-gray-500 mr-2">E-mail:</span>
              <span>{user.email}</span>
            </li>
            <li className="font-normal mb-1">
              <span className="text-gray-500 mr-2">Department:</span>
              <span>{user.department}</span>
            </li>
            <li className="font-normal mb-2">
              <span className="text-gray-500 mr-2">Role:</span>
              <span>{user.role}</span>
            </li>
            <li className="font-normal mb-1">
              <span className="text-gray-500 mr-2">Status:</span>
              <span
                className={
                  user.status === "Active" ? statusActive : statusInactive
                }
              >
                {user.status}
              </span>
            </li>
          </ul>
        </div>
        <div className="text-right mt-5">
          <button className="bg-[#0364BD] hover:bg-[#003A70] p-2 text-white font-normal rounded-lg mr-2">
            {" "}
            <span className="flex flex-row items-center gap-x-1">
              <RiLoopLeftLine className="w-6 h-6" /> Update Status
            </span>
          </button>
          <button className="bg-red-500 hover:bg-red-700 p-2 text-white font-normal rounded-lg">
            <span className="flex flex-row items-center gap-x-1">
              <RiDeleteBinLine className="w-6 h-6" /> Remove User
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUser;
