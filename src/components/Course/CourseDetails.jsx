import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";
import { toast } from "sonner";
import VideoPlayer from "../VideoPlayer/VideoPlayer";

const CourseDetails = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { getToken } = useAuth();
  const token = getToken();
  const location = useLocation();
  const { courseId, userId, videoId } = location.state;
  console.log("CourseId", courseId);
  console.log("UserId", userId);
  console.log("VideoId", videoId);

  const [courseDetails, setCourseDetails] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoLink, setVideoLink] = useState("");
  const [currentVideoId, setCurrentVideoId] = useState(videoId); // Track video ID separately

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return;
      try {
        const res = await fetch(
          `${apiUrl}/userCourse/details/${courseId}/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await res.json();
        console.log("Data Videos:", data.videos);
        setCourseDetails(data);
      } catch (error) {
        console.log(error);
        toast.error("Error fetching course details");
      }
    };

    fetchCourseDetails();
  }, [courseId, userId, token]);

  // Update selected video when videoId changes
  useEffect(() => {
    if (courseDetails && videoId) {
      const video = courseDetails.videos.find((vid) => vid._id === videoId);
      if (video) {
        setSelectedVideo(video);
        setVideoLink(video.url);
        setCurrentVideoId(videoId); // ✅ Immediately update current video ID
      }
    }
  }, [videoId, courseDetails]);

  if (!courseDetails || !selectedVideo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4 overflow-hidden">
      <div className="">
        <div className="flex z-2 w-[calc(100svw-35rem)] justify-center flex-col p-2">
          <div className="pb-5 w-full">
            <div className="h-auto w-full rounded-xl overflow-hidden">
              {/* ✅ Force reloading of VideoPlayer by using `key={currentVideoId}` */}
              <VideoPlayer
                key={currentVideoId}
                options={{
                  controls: true,
                  responsive: true,
                  fluid: true,
                  sources: [
                    {
                      src: videoLink, // ✅ Always the correct video URL
                      type: "video/mp4",
                    },
                  ],
                }}
              />
            </div>
          </div>
          {/* Video Details */}
          <h1 className="text-2xl font-bold">{selectedVideo.title}</h1>
          <p className="mt-2">{selectedVideo.description}</p>
          {/* Resources */}
          {selectedVideo.resources.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Resources</h3>
              <ul className="list-disc list-inside mt-2">
                {selectedVideo.resources.map((res) => (
                  <li key={res._id}>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      {res.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="w-64 right-0 top-[62px] bg-white fixed h-full px-4 py-2 z-10 dark:bg-[#002451]">
          <h2 className="text-lg font-bold">Course Content</h2>
          <ul>
            {courseDetails.videos.map((video) => (
              <li key={video._id} className="py-2">
                <Link
                  to={`/training/course/${courseId}/learn/lecture/${video._id}`}
                  state={{ courseId, userId, videoId: video._id }}
                  className={`w-full text-left ${
                    video._id === videoId ? "text-blue-500 font-bold" : ""
                  }`}
                >
                  {video.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
