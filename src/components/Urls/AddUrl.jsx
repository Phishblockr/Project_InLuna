import React, { useState } from "react";
import { RiLoopLeftLine, RiDeleteBinLine, RiCloseLine, RiAddFill } from "react-icons/ri";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUrl } from "../../features/Urls/urlSlice";
import { toast } from "sonner";


const AddUrl = () => {
    const [newTag, setNewTag] = useState(""); // For adding new tags
    const [url, setUrl] = useState({
        url: "", category: [], status: "", isPhishing: false, isVerified: false
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleAddUrl = (e) => {
        e.preventDefault(); // Prevent form from refreshing the page
        dispatch(addUrl(url));
        toast.success(`URL added.`);
        navigate("/urllists");
    }

    const handleAddTag = () => {
        if (newTag.trim() && !url.category.includes(newTag)) {
            setUrl({ ...url, category: [...url.category, newTag.trim()] })
            setNewTag("")
        }
    };

    const handleRemoveTag = (index) => {
        const updatedTags = url.category.filter((_, i) => i !== index);
        setUrl({ ...url, category: updatedTags })
    }

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            <div className="z-1 w-full font-medium bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <div>
                    <h1 className="pt-3 pl-5 text-2xl font-medium">Add URL</h1>
                </div>
                <form className="mt-3 flex flex-col w-full items-center" onSubmit={handleAddUrl}>
                    <div className="flex flex-col">
                        <label htmlFor="url">URL: </label>
                        <input
                            type="text"
                            id="url"
                            name="url"
                            value={url.url}
                            className=" w-[40rem] p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
                            onChange={(e) =>
                                setUrl({ ...url, [e.target.name]: e.target.value })
                            }
                        />
                    </div>

                    <div className="mt-3 flex flex-col">
                        <label htmlFor="category">Category: </label>
                        <div className="w-[40rem] p-2 rounded-lg border border-gray-300 dark:bg-[#001C40] dark:border-[#001C40] flex flex-wrap gap-2">
                            {url.category.map((tag, index) => (
                                <div key={index} className="bg-gray-200 text-black px-2 py-1 rounded flex items-center gap-1">
                                {tag}
                                <button onClick={() => handleRemoveTag(index)} className="text-red-500">
                                <RiCloseLine size={24} />
                                </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2">
                            <input type="text" value={newTag} placeholder="Add a category" onChange={(e) => {setNewTag(e.target.value)}} className="p-2 border border-gray-300 rounded-lg w-[35rem] dark:bg-[#001C40] dark:border-[#001C40]" />
                            <button
                            type="button" 
                            className="ml-2 px-3 py-2 bg-gray-200 rounded-lg"
                            onClick={handleAddTag}>
                            <RiAddFill size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-col">
                        <label htmlFor="status">Status: </label>
                        <select
                            className="w-[40rem] py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
                            name="status"
                            id="status"
                            value={url.status}
                            onChange={(e) =>
                                setUrl({ ...url, [e.target.name]: e.target.value })
                            }
                        >
                            <option value="blacklisted">Blacklist</option>
                            <option value="whitelisted">Whitelist</option>
                        </select>
                    </div>
                    <div className="mt-3 flex flex-col">
                        <label htmlFor="isPhishing">Is this a url phishing url?: </label>
                        <select
                            className="w-[40rem] py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
                            name="isPhishing"
                            id="isPhishing"
                            value={url.isPhishing}
                            onChange={(e) =>
                                setUrl({ ...url, [e.target.name]: e.target.value })
                            }
                        >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <div className="mt-3 flex flex-col">
                        <label htmlFor="isVerified">Was url verified by human?: </label>
                        <select
                            className="w-[40rem] py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
                            name="isVerified"
                            id="isVerified"
                            value={url.isVerified}
                            onChange={(e) =>
                                setUrl({ ...url, [e.target.name]: e.target.value })
                            }
                        >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                    <button
                    type="submit"
                        className=" mt-9 mb-2 rounded-lg text-white font-medium w-[40rem] bg-[#0364BD] hover:bg-[#003A70] transition p-2 "
                    >
                        <span className="flex flex-row justify-center items-center">
                            <RiAddFill className="w-6 h-6 mr-1" /> Submit
                        </span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddUrl;
