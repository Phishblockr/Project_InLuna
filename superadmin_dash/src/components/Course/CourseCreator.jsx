import React, { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import DOMPurify from "dompurify";
import { RiArrowDownSFill } from "react-icons/ri";
import LoadingOverlay from "../../utils/LoadingOverlay";
import { useAuth } from "../../utils/AuthProvider";
import { toast } from "sonner";
import axios from "axios";

/*
  CourseCreator
  - Preserves existing behavior (fetch categories, email groups, upload videos, create course)
  - Adds explicit borders for light and dark mode
  - Improves file upload button styling and shows chosen filename / upload state
*/

const CourseCreator = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const { getToken } = useAuth();
    const token = getToken();

    const [categoryOptions, setCategoryOptions] = useState([]);
    const [emailGroups, setEmailGroups] = useState([]);
    const [otherValue, setOtherValue] = useState("");
    const [loading, setLoading] = useState(true);

    const [course, setCourse] = useState({
        name: "",
        category: "",
        description: "",
        isDraft: true,
        videos: [],
    });

    // uploadingVideos: { [index]: boolean }
    const [uploadingVideos, setUploadingVideos] = useState({});
    // uploadProgress: { [index]: number }
    const [uploadProgress, setUploadProgress] = useState({});
    // selectedFiles: { [index]: filename }
    const [selectedFiles, setSelectedFiles] = useState({});

    // fetch helpers
    const fetchCategory = async () => {
        try {
            const res = await fetch(`${apiUrl}/course/getCategories`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();
            setCategoryOptions(data || []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const fetchEmailGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/emailTemplate/getGroups`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();
            setEmailGroups(data || []);
        } catch (err) {
            console.error("Error fetching email groups:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchCategory();
        fetchEmailGroups();
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // course helpers
    const handleInputChange = (field, value) =>
        setCourse((prev) => ({ ...prev, [field]: value }));

    const handleTextInput = (value) => {
        const sanitized = DOMPurify.sanitize(value);
        handleInputChange("description", sanitized);
    };

    const addLecture = () =>
        setCourse((prev) => ({
            ...prev,
            videos: [
                ...prev.videos,
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

    const updateLecture = (index, field, value) =>
        setCourse((prev) => {
            const videos = [...prev.videos];
            videos[index] = { ...videos[index], [field]: value };
            return { ...prev, videos };
        });

    const removeLecture = (index, videoUrl) => {
        handleDeleteVideo(index, videoUrl);
        setCourse((prev) => ({
            ...prev,
            videos: prev.videos.filter((_, i) => i !== index),
        }));
        // cleanup file state
        setSelectedFiles((s) => {
            const copy = { ...s };
            delete copy[index];
            return copy;
        });
        setUploadProgress((s) => {
            const copy = { ...s };
            delete copy[index];
            return copy;
        });
        setUploadingVideos((s) => {
            const copy = { ...s };
            delete copy[index];
            return copy;
        });
    };

    // file upload handler (keeps original behavior)
    const handleVideoUpload = async (index, file, courseName, lectureTitle) => {
        if (!courseName || !lectureTitle) {
            toast.error("Please first enter Course Name and Lecture Title");
            return;
        }
        if (!file) {
            toast.error("Please select valid video file");
            return;
        }

        // show filename immediately
        setSelectedFiles((s) => ({ ...s, [index]: file.name }));

        const sanitizedLectureTitle = lectureTitle.replace(
            /[^a-zA-Z0-9]/g,
            "-",
        );
        const sanitizedCourseName = courseName.replace(/[^a-zA-Z0-9]/g, "-");
        const ext = file.name.substring(
            file.name.lastIndexOf(".") || file.name.length,
        );
        const videoName = `${sanitizedCourseName}-Lecture-${index + 1}-${sanitizedLectureTitle}${ext}`;

        // extract duration
        try {
            const vid = document.createElement("video");
            vid.preload = "metadata";
            vid.onloadedmetadata = function () {
                window.URL.revokeObjectURL(vid.src);
                const duration = Math.round(vid.duration);
                updateLecture(index, "duration", duration);
            };
            vid.src = URL.createObjectURL(file);
        } catch (err) {
            // non-blocking
            console.warn("Could not extract duration:", err);
        }

        const formData = new FormData();
        formData.append("file", file, videoName);

        setUploadingVideos((s) => ({ ...s, [index]: true }));
        setUploadProgress((s) => ({ ...s, [index]: 0 }));

        try {
            const res = await axios.post(
                `${apiUrl}/course/uploadCourseVideo`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                    onUploadProgress: (progressEvent) => {
                        if (!progressEvent.total) return;
                        const percentComplete = Math.round(
                            (progressEvent.loaded / progressEvent.total) * 100,
                        );
                        setUploadProgress((s) => ({
                            ...s,
                            [index]: percentComplete,
                        }));
                    },
                },
            );

            if (res?.data?.success) {
                updateLecture(index, "url", res.data.message);
                toast.success("Video uploaded");
            } else {
                toast.error("Video upload failed");
                console.error("upload response", res?.data);
            }
        } catch (err) {
            toast.error("Error uploading video");
            console.error(err);
        } finally {
            setUploadingVideos((s) => ({ ...s, [index]: false }));
        }
    };

    const handleDeleteVideo = async (index, videoUrl) => {
        try {
            const res = await fetch(`${apiUrl}/course/deleteCourseVideo`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ videoUrl }),
            });
            const data = await res.json();
            if (data.success) {
                updateLecture(index, "url", "");
                toast.success("Video deleted");
            } else {
                toast.error("Failed to delete video");
            }
        } catch (err) {
            toast.error("Error deleting video");
            console.error(err);
        }
    };

    const handleSaveCourse = async (isDraft) => {
        if (!course.name || !course.category) {
            toast.error("Course Name and Category are required!");
            return;
        }
        const finalCategory =
            course.category === "other" ? otherValue : course.category;
        const courseData = { ...course, category: finalCategory, isDraft };

        try {
            const res = await fetch(`${apiUrl}/course/create`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(courseData),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(
                    isDraft
                        ? "Draft saved successfully"
                        : "Course published successfully",
                );
            } else {
                toast.error("Unable to save course");
            }
        } catch (err) {
            console.error("Unable to save course:", err);
            toast.error("Unable to save course");
        }
    };

    // open signed url
    const handleGetSignedUrl = async (fileName) => {
        try {
            const res = await fetch(
                `${apiUrl}/course/getSignedUrl?fileName=${encodeURIComponent(fileName)}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );
            const data = await res.json();
            if (data.url) {
                window.open(data.url, "_blank");
            } else {
                toast.error("Unable to fetch video URL.");
            }
        } catch (err) {
            console.error("Error fetching signed URL:", err);
            toast.error("Error fetching video.");
        }
    };

    return (
        <div
            id="course-creator"
            className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between p-4 gap-4 bg-white text-gray-900
                 dark:bg-[#002451] dark:text-white border border-gray-300 dark:border-none rounded transition-colors"
        >
            {loading && <LoadingOverlay loading={loading} />}

            <style>{`
        /* scoped scrollbar for course creator */
        #course-creator::-webkit-scrollbar { width: 8px; height: 8px; }
        #course-creator::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius:9999px; }
        @media (prefers-color-scheme: dark) {
          #course-creator::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }
        }
        #course-creator { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.12) transparent; }
      `}</style>

            <div>
                <h1 className="pt-3 pl-1 text-2xl font-medium">Add Course</h1>

                <div className="mt-4 space-y-4">
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-lg font-medium mb-2"
                        >
                            Name:
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Enter Course Name"
                            className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-400
                         dark:bg-[#001c40] dark:border-none dark:text-white"
                            onChange={(e) =>
                                handleInputChange("name", e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="selectField"
                            className="block text-lg font-medium mb-2"
                        >
                            Category
                        </label>
                        <select
                            id="selectField"
                            className="bg-white w-full p-2 border border-gray-300 rounded mb-4 text-gray-900
                           dark:bg-[#001c40] dark:border-none dark:text-white"
                            onChange={(e) =>
                                handleInputChange("category", e.target.value)
                            }
                        >
                            <option value="null">-- category --</option>
                            {categoryOptions.map((opt, i) => (
                                <option key={i} value={opt}>
                                    {opt}
                                </option>
                            ))}
                            <option value="other">Other</option>
                        </select>
                        {course.category === "other" && (
                            <div className="mt-2">
                                <label
                                    htmlFor="otherField"
                                    className="block text-lg font-medium mb-2"
                                >
                                    Enter Other Value
                                </label>
                                <input
                                    id="otherField"
                                    type="text"
                                    value={otherValue}
                                    onChange={(e) =>
                                        setOtherValue(e.target.value)
                                    }
                                    placeholder="Enter custom value"
                                    className="w-full p-2 rounded border border-gray-300 bg-white text-gray-900
                             dark:bg-[#001c40] dark:border-none dark:text-white"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-lg font-medium mb-2">
                            Description
                        </label>
                        <div className="rounded border border-gray-300 bg-white dark:bg-[#001c40] dark:border-none p-2">
                            <RichTextEditor
                                value={course.description}
                                onChange={handleTextInput}
                                placeholder="Course description..."
                            />
                        </div>
                    </div>

                    {/* Lectures */}
                    <div>
                        <h2 className="block text-lg font-medium mb-2 mt-2">
                            Lecture Structure
                        </h2>

                        <div className="space-y-4">
                            {course.videos.map((video, index) => (
                                <div key={index} className="space-y-2">
                                    <div
                                        className="flex items-center gap-4 p-2 rounded border border-gray-300 bg-white
                                  dark:bg-[#001c40] dark:border-none"
                                    >
                                        <div className="flex-1 flex items-center gap-3">
                                            <label
                                                htmlFor={`lectureName-${index}`}
                                                className="w-[150px] text-lg font-medium"
                                            >
                                                Lecture {index + 1} Title:
                                            </label>
                                            <input
                                                id={`lectureName-${index}`}
                                                type="text"
                                                className="flex-1 p-2 rounded border border-gray-300 bg-white text-gray-900
                                   dark:bg-[#002451] dark:border-none dark:text-white"
                                                onChange={(e) =>
                                                    updateLecture(
                                                        index,
                                                        "title",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="p-2 rounded text-gray-700 dark:text-gray-200"
                                            onClick={() =>
                                                updateLecture(
                                                    index,
                                                    "showDetails",
                                                    !video.showDetails,
                                                )
                                            }
                                            aria-expanded={!!video.showDetails}
                                            aria-controls={`lecture-details-${index}`}
                                        >
                                            <RiArrowDownSFill />
                                        </button>
                                    </div>

                                    {video.showDetails && (
                                        <div
                                            id={`lecture-details-${index}`}
                                            className="p-4 rounded border border-gray-300 bg-white
                                                                    dark:bg-[#001c40] dark:border-[#00469d]"
                                        >
                                            {/* Upload Row */}
                                            <div className="mb-4 space-y-2">
                                                <label className="block text-lg font-medium">
                                                    Upload Video:
                                                </label>

                                                {video.url ? (
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            className="text-blue-600 underline dark:text-blue-300"
                                                            onClick={() =>
                                                                handleGetSignedUrl(
                                                                    video.url
                                                                        .split(
                                                                            "/",
                                                                        )
                                                                        .pop(),
                                                                )
                                                            }
                                                        >
                                                            {video.url
                                                                .split("/")
                                                                .pop()}
                                                        </button>
                                                        <div className="text-gray-600 dark:text-gray-300">
                                                            {video.duration
                                                                ? `${Math.floor(video.duration / 60)}m ${Math.round(video.duration % 60)}s`
                                                                : "Calculating..."}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="ml-auto text-red-600 px-3 py-1 rounded bg-gray-100 dark:bg-transparent border border-gray-300 dark:border-[#00469d]"
                                                            onClick={() =>
                                                                handleDeleteVideo(
                                                                    index,
                                                                    video.url,
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-4">
                                                        {/* Styled upload button (label) */}
                                                        <label
                                                            htmlFor={`videoFile-${index}`}
                                                            className="inline-flex items-center gap-2 px-3 py-2 rounded border border-gray-300 bg-gray-50 text-gray-900 cursor-pointer hover:bg-gray-100
                                         dark:bg-[#001c40] dark:border-[#073055] dark:text-white dark:hover:bg-[#073055] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:focus:ring-[#0364BD]"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8M8 12l4-4 4 4"
                                                                />
                                                            </svg>
                                                            <span className="text-sm">
                                                                Choose file
                                                            </span>
                                                        </label>
                                                        <input
                                                            id={`videoFile-${index}`}
                                                            type="file"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const f =
                                                                    e.target
                                                                        .files?.[0];
                                                                if (f)
                                                                    handleVideoUpload(
                                                                        index,
                                                                        f,
                                                                        course.name,
                                                                        video.title,
                                                                    );
                                                            }}
                                                            disabled={
                                                                !!uploadingVideos[
                                                                    index
                                                                ]
                                                            }
                                                        />

                                                        {/* filename / upload state */}
                                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                                            {uploadingVideos[
                                                                index
                                                            ]
                                                                ? `Uploading... ${uploadProgress[index] || 0}%`
                                                                : selectedFiles[
                                                                      index
                                                                  ] ||
                                                                  "No file chosen"}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Progress bar (visible when uploading) */}
                                                {uploadingVideos[index] && (
                                                    <div className="w-full bg-gray-200 rounded h-3 overflow-hidden dark:bg-[#00314d] mt-2">
                                                        <div
                                                            className="h-3 bg-[#0364BD]"
                                                            style={{
                                                                width: `${uploadProgress[index] || 0}%`,
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Lecture description */}
                                            <div className="mb-4">
                                                <label className="block text-lg font-medium mb-2">
                                                    Lecture Description
                                                </label>
                                                <div
                                                    className="rounded border border-gray-300 bg-white p-2
                                        dark:bg-[#002451] dark:border-[#00469d]"
                                                >
                                                    <RichTextEditor
                                                        value={
                                                            video.description
                                                        }
                                                        onChange={(v) =>
                                                            updateLecture(
                                                                index,
                                                                "description",
                                                                DOMPurify.sanitize(
                                                                    v,
                                                                ),
                                                            )
                                                        }
                                                        placeholder={`Lecture ${index + 1} description...`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    className="px-4 py-2 rounded border border-gray-300 bg-gray-100 text-red-700
                                     dark:bg-[#6f0000] dark:border-none dark:text-white"
                                                    onClick={() =>
                                                        removeLecture(
                                                            index,
                                                            video.url,
                                                        )
                                                    }
                                                >
                                                    Delete Lecture
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div>
                                <button
                                    className="px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-900
                             dark:bg-[#001c40] dark:border-[#00469d] dark:text-white"
                                    onClick={addLecture}
                                >
                                    + Lecture
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    className="px-4 py-2 rounded bg-[#0364BD] text-white border-2 border-[#0364BD] hover:bg-[#003A70]"
                    onClick={() => handleSaveCourse(false)}
                >
                    Publish
                </button>

                <button
                    className="px-4 py-2 rounded border-2 border-gray-300 bg-gray-100 dark:bg-[#001c40] dark:border-[#00469d] dark:text-white"
                    onClick={() => handleSaveCourse(true)}
                >
                    Save Draft
                </button>
            </div>
        </div>
    );
};

export default CourseCreator;
