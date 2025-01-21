import React, { useState, useRef, useMemo, useEffect } from "react";
import "react-quill/dist/quill.snow.css";
import ReactQuill, { Quill } from "react-quill";
import DOMPurify from "dompurify";
import { RiArrowDownSFill } from "react-icons/ri";
import LoadingOverlay from "../../utils/LoadingOverlay";
import { useAuth } from "../../utils/AuthProvider";

const CourseCreator = () => {

    const apiUrl = import.meta.env.VITE_API_URL;

    const { getToken } = useAuth();
    const token = getToken();

    const [categoryOptions, setCategoryOptions] = useState([]);
    const [emailGroups, setEmailGroups] = useState([]);
    const quillRef = useRef(null); // Ref for ReactQuill

    const [loading, setLoading] = useState(true);

    const [course, setCourse] = useState({
        name: "",
        category: "",
        description: "",
        isDraft: true,
        videos: [],
    })


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

    const deleteVideo = (index) => {
        setCourse((prevCourse) => ({
            ...prevCourse,
            videos: prevCourse.videos.filter((_, i) => i !== index),
        }));
    };

    const handleDraftChange = (value) => {
        setCourse((prevCourse) => ({
            ...prevCourse,
            isDraft: value === "publish" ? false : true,
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
        updateLecture(index, "description", value)
    }

    useEffect(() => {
        setLoading(true); // Start loading
        fetchCategory();
        fetchEmailGropus();
        setLoading(false); // Stop loading
    }, [])

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
                        onChange={(e) => handleInputChange("name", e.target.value)}
                    />

                    <label htmlFor="selectField" className="block text-lg font-medium mb-2">
                        Category
                    </label>
                    <select
                        id="selectField"
                        className="bg-white w-full p-2 border border-gray-300 rounded mb-4"
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
                    {course.category === "other" && (
                        <div>
                            <label htmlFor="otherField" className="block text-lg font-medium mb-2">
                                Enter Other Value
                            </label>
                            <input
                                id="otherField"
                                type="text"
                                className="w-full p-2 mb-4 border border-gray-300 rounded"
                                value={course.category}
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
                                            onChange={(e) =>
                                                updateLecture(index, "title", e.target.value)
                                            }
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
                                                <input
                                                    type="file"
                                                    id="videoFile"
                                                    className="p-2 border border-gray-300 rounded"
                                                    onChange={(e) =>
                                                        updateLecture(
                                                            index,
                                                            "url",
                                                            URL.createObjectURL(e.target.files[0])
                                                        )
                                                    }

                                                />
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
                                            onClick={() => deleteVideo(index)}
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
            <div className="flex gap-2">
                <button
                    className="my-2 text-white bg-[#0364BD] border-2 hover:bg-[#003A70] border-[#0364BD] transition-colors rounded w-[200px] mb-2"
                >Publish</button>
                <button
                    className="my-2 bg-gray-200 border-2 border-gray-300 rounded w-[200px] mb-2"
                >Save Draft</button>
            </div>
        </div>
    )
}

export default CourseCreator