import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";
import { toast } from "sonner";

const CourseDetails = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { getToken } = useAuth();
  const token = getToken();
  const location = useLocation();
  const { courseId, userId } = location.state;
  console.log("CourseId", courseId);
  
  const [courseDetails, setCourseDetails] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return;
      try {
        const res = await fetch(
          `${apiUrl}/course/details/${courseId}/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();
        console.log("Data:",data.videos);
        setCourseDetails(data);
      } catch (error) {
        console.log(error);

        toast.error("Error fetching course details");
      }
    };

    fetchCourseDetails();
  }, [courseId, token]);

  if (!courseDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <h1 className="text-2xl font-bold">{courseDetails.name}</h1>
      <p className="mt-2">{courseDetails.description}</p>
      <h2 className="mt-4 text-xl">Videos</h2>
      <ul>
        {courseDetails.videos.map((video, index) => (
          <li key={index}>
          <p>{video.title}</p>
          <p>Desc: {video.description}</p>
            <a href={video} target="_blank" rel="noopener noreferrer">
              Video {index + 1}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4">Progress: {courseDetails.progress}%</p>
    </div>
  );
};

export default CourseDetails;
