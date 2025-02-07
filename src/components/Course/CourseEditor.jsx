import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from "../../utils/AuthProvider";
import { useParams } from "react-router-dom";
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import { RiArrowDownSFill } from "react-icons/ri";
import DOMPurify from "dompurify";
import LoadingOverlay from "../../utils/LoadingOverlay";
import axios from "axios";

const CourseEditor = () => {
    const { id } = useParams();
    const apiUrl = import.meta.env.VITE_API_URL;
    const { getToken } = useAuth();
    const token = getToken();

    const quillRef = useRef(null); // Ref for ReactQuill

    const [course, setCourse] = useState({
        name: "",
        category: "",
        description: "",
        isDraft: true,
        videos: [],
    })
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [emailGroups, setEmailGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    const [otherValue, setOtherValue] = useState("");

    const [uploadingVideos, setUploadingVideos] = useState({});
    const [uploadProgress, setUploadProgress] = useState({});

    const fetchCourses = async () => {
        try {
            const res = await fetch(`${apiUrl}/course/get/${id}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await res.json();

            if (res.ok) {
                const courseWithDetails = {
                    ...result.course,
                    videos: result.course.videos.map((video) => ({
                        ...video,
                        showDetails: false,
                    })),
                }
                setCourse(courseWithDetails)
            } else {
                toast.error(course.message || "Error fetching templates");
            }
        } catch (error) {
            toast.error("Error fetching templates:", error.message)
        }
    }

    const fetchCategory = async () => {
        try {
            const response = await fetch(`${apiUrl}/course/getCategories`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }); // Backend endpoint
            const data = await response.json();
            setCategoryOptions(data);
        } catch (error) {
            console.error("Error fetching options:", error);
        }
    };

    const fetchEmailGropus = async () => {
        setLoading(true); // Start loading
        try {
            const response = await fetch(`${apiUrl}/emailTemplate/getGroups`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }); // Backend endpoint
            const data = await response.json();
            setEmailGroups(data);
        } catch (error) {
            console.error("Error fetching options:", error);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // Add a new lecture to the course
    const addLecture = () => {
        setCourse((prevCourse) => ({
            ...prevCourse,
            videos: [
                ...prevCourse.videos,
                {
                    title: "",
                    url: "",
                    duration: 0,
                    description: "",
                    assignEmail: "",
                    showDetails: false,
                },
            ],
        }));
    };

    // Update lecture fields
    const updateLecture = (index, field, value) => {
        setCourse((prevCourse) => {
            const updatedVideos = [...prevCourse.videos];
            updatedVideos[index] = {
                ...updatedVideos[index],
                [field]: value,
            };
            return { ...prevCourse, videos: updatedVideos };
        });
    };

    const deleteVideo = (index, videoUrl) => {
        handleDeleteVideo(index, videoUrl);
        setCourse((prevCourse) => ({
            ...prevCourse,
            videos: prevCourse.videos.filter((_, i) => i !== index),
        }));
    };

    const handleInputChange = (field, value) => {
        setCourse((prevCourse) => ({
            ...prevCourse,
            [field]: value,
        }));
    };

    const handleTextInput = (value) => {
        // Sanitize the input value using DOMPurify
        const sanitizedContent = DOMPurify.sanitize(value);
        handleInputChange("description", sanitizedContent);
    }

    const handleVidDescInput = (index, value) => {
        const sanitizedContent = DOMPurify.sanitize(value);
        updateLecture(index, "description", sanitizedContent)
    }

    const handleVideoUpload = async (index, file, courseName, lectureTitle) => {
        if (!courseName || !lectureTitle) {
            toast.error("Please first enter Course Name and Lecture Title")
            return
        }
        const sanitizedLectureTitle = lectureTitle.replace(/[^a-zA-Z0-9]/g, "-"); // Remove special characters
        const sanitizedCourseName = courseName.replace(/[^a-zA-Z0-9]/g, "-"); // Remove special characters
        const videoName = `${sanitizedCourseName}-Lecture-${index + 1}-${sanitizedLectureTitle}${file.name.substring(file.name.lastIndexOf("."))}`;
        console.log(videoName)

        if (!file) {
            toast.error("Please select valid video file");
            return
        }

        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = function () {
            window.URL.revokeObjectURL(video.src);
            const duration = Math.round(video.duration); // Duration in seconds
            console.log("Extracted Duration:", duration);

            updateLecture(index, "duration", duration);
        };

        video.src = URL.createObjectURL(file);

        const formData = new FormData();
        formData.append("file", file, videoName);

        setUploadingVideos((prev) => ({ ...prev, [index]: true })); // Show progress bar

        try {
            const res = await axios.post(`${apiUrl}/course/uploadCourseVideo`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setUploadProgress((prev) => ({ ...prev, [index]: percentComplete }));
                }
            });

            if (res.data.success) {
                updateLecture(index, "url", res.data.message);
            } else {
                toast.error("Video upload failed: ", res.data.error);
            }
        } catch (error) {
            toast.error("Error uploading video: ", error);
        } finally {
            setUploadingVideos((prev) => ({ ...prev, [index]: false })); // Hide progress bar
        }
    };

    const handleDeleteVideo = async (index, videoUrl) => {
        try {
            const res = await fetch(`${apiUrl}/course/deleteCourseVideo`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ videoUrl })
            });

            const data = await res.json();
            if (data.success) {
                updateLecture(index, "url", "");
                // deleteVideo(index);
            } else {
                toast.error("Failed to delete video: ", data.error);
            }
        } catch (error) {
            toast.error("Error deleting video: ", error)
        }
    }

    const handleSaveCourse = async (isDraft) => {
        if (!course.name || (!course.category && !otherValue)) {
            toast.error("Course Name and Category are required!");
            return;
        }

        const finalCategory = course.category === "other" ? otherValue : course.category;

        const courseData = {
            ...course,
            category: finalCategory,
            isDraft,
        };

        try {
            const res = await fetch(`${apiUrl}/course/update/${id}`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(courseData)
            });

            const data = await res.json();

            if (data.success) {
                toast.success(isDraft ? "Draft saved successfully" : "Course updated successfully!");
            } else {
                toast.error(`Unable to update course: ${data.error}`);
            }
        } catch (error) {
            console.error("Unable to update course - Internal error: ", error);
        }
    };

    const handleGetSignedUrl = async (fileName) => {
        try {
            const res = await fetch(`${apiUrl}/course/getSignedUrl?fileName=${encodeURIComponent(fileName)}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();
            if (data.url) {
                window.open(data.url, "_blank"); // Open video in new tab
            } else {
                toast.error("Unable to fetch video URL.");
            }
        } catch (error) {
            console.error("Error fetching signed URL:", error);
            toast.error("Error fetching video.");
        }
    };



    useEffect(() => {
        setLoading(true); // Start loading
        fetchCourses()
        fetchCategory();
        fetchEmailGropus();
        setLoading(false); // Stop loading
    }, [])

    if (!course) {
        return <div>Error: Unable to fetch course</div>;
    }

    console.log(course.name)
    return (
        <div className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            {loading && <LoadingOverlay loading={loading} />}
            <div>
                <h1 className="pt-3 pl-5 text-2xl font-medium">Add Course</h1>
                <div>
                    <label htmlFor="name" className="block text-lg font-medium mb-2">Name:</label>
                    <input
                        className="w-full p-[10px] mb-[10px]"
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Enter Course Name"
                        value={course.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                    />

                    <label htmlFor="selectField" className="block text-lg font-medium mb-2">
                        Category
                    </label>
                    <select
                        id="selectField"
                        className="bg-white w-full p-2 border border-gray-300 rounded mb-4"
                        value={course.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                    >
                        <option value="null">-- category --</option>
                        {categoryOptions.map((categoryOption, index) => (
                            <option key={index} value={categoryOption}>
                                {categoryOption}
                            </option>
                        ))}
                        <option value="other">Other</option>

                    </select>
                    {categoryOptions === "other" && (
                        <div>
                            <label htmlFor="otherField" className="block text-lg font-medium mb-2">
                                Enter Other Value
                            </label>
                            <input
                                id="otherField"
                                type="text"
                                className="w-full p-2 mb-4 border border-gray-300 rounded"
                                value={otherValue}
                                onChange={(e) => handleInputChange("category", e.target.value)}
                                placeholder="Enter custom value"
                            />
                        </div>
                    )}
                    <label htmlFor="description" className="block text-lg font-medium mb-2">Description</label>
                    <ReactQuill
                        className="quill-editor-container"
                        ref={quillRef}
                        value={course.description}
                        onChange={handleTextInput}
                    />
                    {/* Lecture section */}
                    <div>
                        <h2 className="block text-lg font-medium mb-2 mt-5">Lecture Structure</h2>
                        {course.videos.map((video, index) => (
                            <div className="mb-5">
                                <div className="flex flex-row gap-5 border-2 rounded bg-white p-2">
                                    <div className=" justify-center items-center w-full mx-2 flex gap-2">
                                        <label className="text-lg font-medium w-[150px]" htmlFor="lectureName">Lecture {index + 1} Title:</label>
                                        <input
                                            value={video.title}
                                            onChange={(e) => updateLecture(index, "title", e.target.value)}
                                            className=" w-full border-2 rounded" type="text" name="lectureName" />
                                    </div>
                                    <button
                                        className="flex items-center justify-center p-2"
                                        onClick={() => updateLecture(index, "showDetails", !video.showDetails)}
                                    ><RiArrowDownSFill /></button>
                                </div>


                                {/* Details Section */}
                                {video.showDetails && (
                                    <div className="bg-white border-x-2 border-b-2 p-2 rounded flex-row">
                                        {/* Video Upload Section */}
                                        <div className="mb-5">
                                            <div className="flex flex-col gap-2">
                                                <label htmlFor="videoFile" className="block text-lg font-medium mb-2">
                                                    Upload Video:
                                                </label>
                                                {video.url ? (
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="text-blue-600 underline cursor-pointer"
                                                            onClick={() => handleGetSignedUrl(video.url.split("/").pop())} // Extract file name
                                                        >
                                                            {video.url.split("/").pop()}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            ({video.duration ? `${Math.floor(video.duration / 60)}m ${Math.round(video.duration % 60)}s` : "Calculating..."})
                                                        </span>
                                                        <button
                                                            className="text-red-600 border px-3 py-1 rounded"
                                                            onClick={() => handleDeleteVideo(index, video.url)}
                                                        >
                                                            x
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="file"
                                                            id={`videoFile-${index}`}
                                                            className="p-2 border border-gray-300 rounded"
                                                            onChange={(e) => handleVideoUpload(index, e.target.files[0], course.name, video.title)}
                                                            disabled={uploadingVideos[index]}
                                                        />
                                                        {/* Progress Bar*/}
                                                        {uploadingVideos[index] && (
                                                            <div className="relative w-full bg-gray-200 rounded h-4">
                                                                <div className="absolute top-0 left-0, h-4 bg-blue-500"
                                                                    style={{ width: `${uploadProgress[index] || 0}%` }}
                                                                >
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            {/* Description */}
                                            <label htmlFor="description" className="block text-lg font-medium mb-2">Lecture Description</label>
                                            <ReactQuill
                                                className="mb-5 quill-editor-container"
                                                ref={quillRef}
                                                value={video.description}
                                                onChange={(value) => handleVidDescInput(index, value)}
                                            />
                                        </div>
                                        <div>
                                            {/* interactive Email */}
                                            <div className="flex flex-col">
                                                <label htmlFor="emailGroup" className="block text-lg font-medium mb-2">Select Email Group for Email based Interactive Lectures</label>
                                                <select
                                                    name="emailGroup"
                                                    id="emailGroup"
                                                    value={video.assignEmail}
                                                    className="bg-white w-full p-2 border border-gray-300 rounded mb-4"
                                                    onChange={(e) => updateLecture(index, "assignEmail", e.target.value)}
                                                >
                                                    <option value="null">--Select Email Group--</option>
                                                    {emailGroups.map((emailGroup, index) => (
                                                        <option key={index} value={emailGroup}>
                                                            {emailGroup}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="text-gray-700">If you don't want to include or send training email after completion of video just leave field as it is.</span>
                                                <span className="text-gray-700">When you select email groups emails will be randomly assigned (with in given group) to the user after user completes the video.</span>
                                            </div>
                                        </div>
                                        <button className="my-2 text-red-700 bg-gray-200 border-2 border-gray-300 rounded w-[200px] mb-2"
                                            onClick={() => deleteVideo(index, video.url)}
                                        >Delete Lecture</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button
                            className="my-2 bg-gray-200 border-2 border-gray-300 rounded w-[200px] mb-2"
                            onClick={addLecture}
                        >+ Lecture</button>
                    </div>
                </div>
            </div>
            <span>Notice: If this course has already been assigned, saving it as a draft will temporarily restrict user access until it is published again.</span>
            <div className="flex gap-2">
                <button
                    className="my-2 text-white bg-[#0364BD] border-2 hover:bg-[#003A70] border-[#0364BD] transition-colors rounded w-[200px] mb-2"
                    onClick={() => handleSaveCourse(false)}
                >Update / Publish</button>
                <button
                    className="my-2 bg-gray-200 border-2 border-gray-300 rounded w-[200px] mb-2"
                    onClick={() => handleSaveCourse(true)}
                >Save Draft</button>
            </div>
        </div>
    )
}

export default CourseEditor