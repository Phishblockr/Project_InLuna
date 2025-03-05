import React, { useState, useEffect } from "react";
import { IoSearchOutline, IoEyeOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useAuth } from "../utils/AuthProvider";

const Training = () => {
  const { getToken } = useAuth();
  const token = getToken();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const { details } = useSelector((state) => state.userProfile);
  const id = details?._id;
  const [assignCourses, setAssignCourses] = useState([]);
  const [courseLinks, setCourseLinks] = useState({}); // Store course links dynamically

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };
  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

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

      // Determine the correct video ID for each course
      const updatedCourseLinks = {};
      for (const course of data) {
        const courseId = course.courseId._id;
        const courseName = course.courseId.name.replace(/\s+/g, "-");

        // Step 1: Check progress API
        const progressRes = await fetch(
          `${apiUrl}/userCourse/progress/${courseId}/${id}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const progressData = await progressRes.json();
        let selectedVideoId = null;

        if (progressData.success && progressData.watchStatus.length > 0) {
          selectedVideoId =
            progressData.watchStatus[progressData.watchStatus.length - 1]; // Get last watched video
        } else {
          // Step 2: Fetch first video from course details
          const detailsRes = await fetch(
            `${apiUrl}/userCourse/details/${courseId}/${id}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const detailsData = await detailsRes.json();

          selectedVideoId = detailsData.videos[0]._id; // First video
        }
        // Store the generated link as an object with videoId
        updatedCourseLinks[courseId] = {
          url: `/training/course/${courseName}/learn/lecture/${selectedVideoId}`,
          videoId: selectedVideoId, // Store video ID for passing in state
        };
      }
      setCourseLinks(updatedCourseLinks);
    } catch (error) {
      toast.error("Error Fetching courses: ", error.message);
    }
  };

  useEffect(() => {
    FetchAssignedCourses(token, id);
  }, [token, id]);

  // Filter assignCourses based on search, category, and status
  const filteredCourses = assignCourses.filter((course) => {
    const matchesSearch =
      course.courseId.name.toLowerCase().includes(searchTerm) ||
      searchTerm === "";

    const matchesCategory =
      selectedCategory === "All" ||
      course.courseId.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "All" || course.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (!details) {
    return null;
  }

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div>
        <div className="flex items-center gap-4 bg-white px-3">
          <h2 className="text-xl font-bold">My Courses</h2>
          <div className="flex items-center gap-4 py-2">
            <div className="relative w-1/3">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearch}
                className="border border-gray-300 rounded-lg px-10 py-2 w-full"
              />
              <span className="absolute left-3 top-2/4 -translate-y-2/4 text-gray-400">
                <IoSearchOutline className="text-xl" />
              </span>
            </div>
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="All">Category</option>
              <option value="Security">Security</option>
              <option value="General">General</option>
              <option value="Network">Network</option>
            </select>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="border border-gray-300 rounded-lg px-4 py-2 "
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Not Completed">Not Completed</option>
            </select>
          </div>
        </div>
        <div className="mt-10">
          <table className="w-full rounded-lg">
            <thead className="">
              <tr>
                <th className="text-left px-4 py-2">Course Name</th>
                <th className="px-4 py-2">Completion</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Interactive (emails)</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course) => (
                <tr
                  key={course._id}
                  className={`${
                    course.id % 2 === 0 ? "bg-[#F7F4F4]" : "bg-white"
                  } hover:bg-gray-100 `}
                >
                  <td className="px-4 py-2 hover:text-[#0364BD]">
                    {courseLinks[course.courseId._id] && (
                      <Link
                        to={courseLinks[course.courseId._id].url}
                        state={{
                          courseId: course.courseId._id,
                          userId: id,
                          videoId: courseLinks[course.courseId._id].videoId, // Pass videoId dynamically
                        }}
                      >
                        {course.courseId.name}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">{course.progress} %</td>
                  <td className="px-4 py-2 text-center">
                    {course.courseId.category}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {course.interactive ? "✔️" : "❌"}
                  </td>
                  <td className="px-4 py-2 flex justify-center items-center">
                    {courseLinks[course.courseId._id] && (
                      <Link
                        to={courseLinks[course.courseId._id].url}
                        state={{
                          courseId: course.courseId._id,
                          userId: id,
                          videoId: courseLinks[course.courseId._id].videoId,
                        }}
                      >
                        <IoEyeOutline className="cursor-pointer text-2xl hover:text-blue-500" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Training;
