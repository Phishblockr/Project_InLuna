import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { IoEyeOutline } from "react-icons/io5";
import sampleVideo from "../assets/flower.webm";
import { useAuth } from "../utils/AuthProvider";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const courses = [
  {
    id: 1,
    name: "Identifying Threats",
    completion: "10",
    category: "Security",
    interactive: true,
    status: "Not Completed",
    url: "/identifying-threats",
  },
  {
    id: 2,
    name: "Phishing Basics",
    completion: "80",
    category: "General",
    interactive: true,
    status: "Completed",
    url: "/phishing-basics",
  },
  {
    id: 3,
    name: "How to download software safely",
    completion: "30",
    category: "Network",
    interactive: true,
    status: "Not Completed",
    url: "how-to-download-software-safely",
  },
];

const Overview = () => {
  const { getToken } = useAuth();
  const token = getToken();
  const apiUrl = import.meta.env.VITE_API_URL;
  const { details } = useSelector((state) => state.userProfile);
  const id = details?._id;
  const [assignCourses, setAssignCourses] = useState([]);

  const FetchAssignedCourses = async (token, id) => {
    if (!token || !id) return; // Prevent the function from running with invalid inputs
    try {
      const res = await fetch(`${apiUrl}/userCourse/getAssigned/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setAssignCourses(
        data.map((course) => ({
          ...course,
          status: course.progress === 100 ? "Completed" : "Not Completed",
        }))
      );
    } catch (error) {
      toast.error("Error Fetching courses: ", error.message);
    }
  };

  useEffect(() => {
    FetchAssignedCourses(token, id);
  }, [token, id]);

  if (!details) {
    return null;
  }

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="flex gap-x-5 py-5 px-5">
        <div className="h-[270px] w-[750px] bg-[#e6e6e6] rounded-lg overflow-hidden">
          <a>
            <video controls className="h-[270px] w-[750px]">
              <source src={sampleVideo} type="video/webm" />
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
        <h2 className="text-2xl mb-4">Currently Enrolled Courses</h2>
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="font-normal text-left py-2 px-4 w-[60%]">
                Course Name
              </th>
              <th className="font-normal py-2 w-[20%] text-center">
                Completion
              </th>
              <th className="font-normal py-2 w-[20%] text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {assignCourses.map((course, index) => (
              <tr
                key={course._id}
                className={`${
                  index % 2 === 0 ? "bg-[#F7F4F4]" : "bg-white"
                } hover:bg-gray-100`}
              >
                <td className="px-4 py-2 w-[60%]">
                  <Link
                    className="hover:text-[#0364BD]"
                    to={`/courses/${course.courseId.name.replace(/\s+/g, "-")}`}
                    state={{ courseId: course.courseId._id, userId: id }}
                  >
                    {course.courseId.name}
                  </Link>
                </td>
                <td className="text-center py-2">{course.progress}%</td>
                <td className="text-center py-2 flex justify-center">
                  <NavLink
                    to={`/courses/${course.courseId.name.replace(/\s+/g, "-")}`}
                    state={{ courseId: course.courseId._id, userId: id }}
                  >
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
