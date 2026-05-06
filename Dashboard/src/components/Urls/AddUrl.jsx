import React, { useState } from "react";
import { RiLoopLeftLine, RiDeleteBinLine, RiCloseLine, RiAddFill } from "react-icons/ri";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUrl } from "../../features/Urls/urlSlice";
import { toast } from "sonner";
import { handleVerifyPwd } from "../../utils/handleVerifyPwd";
import AuthenticateModal from "../../utils/AuthenticateModal";
import { useAuth } from "../../utils/AuthProvider";



const AddUrl = () => {
    const { getToken } = useAuth();
    const token = getToken();
    const textBarStyle = "w-full p-2 rounded-t-lg border-b-2 border-dashed bg-gray-100 border-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-[#001C40]"

    const [newTag, setNewTag] = useState(""); // For adding new tags
    const [url, setUrl] = useState({
        url: "", category: [], status: "blacklisted", isPhishing: false, isVerified: false
    });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [operationType, setOperationType] = useState(null);
    const apiUrl = import.meta.env.VITE_API_URL

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleAddUrl = (e) => {
        e.preventDefault();
        handlePasswordModalOpen(null, "add");
    }

    const executeAddUrl = () => {
        dispatch(addUrl({url, token}));
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

    const handlePasswordModalOpen = (url, type) => {
        // setSelectedUrl(url);
        setOperationType(type);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = async (password) => {
        // const token = JSON.parse(localStorage.getItem("user")).token;
        const result = await handleVerifyPwd(password, apiUrl, token);

        if (result) {
            if (operationType === "add") {
                executeAddUrl();
            }
            setIsPasswordModalOpen(false);
        }
    };

    return (
        <div className="z-1 h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            <AuthenticateModal isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            />
            <div className="z-1 w-full font-medium bg-white rounded-xl shadow-xl p-3 h-full dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <div>
                    <h1 className="pt-3 pl-5 text-2xl font-medium">Add URL</h1>
                </div>
                <form className="mt-5 px-3 flex flex-col w-full items-center" onSubmit={handleAddUrl}>
                    <div className="w-full flex flex-col">
                        <label htmlFor="url">URL: </label>
                        <input
                            type="text"
                            id="url"
                            name="url"
                            value={url.url}
                            className={textBarStyle}
                            onChange={(e) =>
                                setUrl({ ...url, [e.target.name]: e.target.value })
                            }
                        />
                    </div>

                    <div className="mt-5 w-full flex flex-col">
                        <label htmlFor="category">Category: </label>
                        <div className={`${url.category.length === 0 ? "p-5" : "p-2"
                            } rounded-lg border-dashed border-2 border-gray-300 dark:bg-[#001C40] dark:border-[#001C40] flex flex-wrap gap-2`}
                        >
                            {url.category.map((tag, index) => (
                                <div key={index} className="bg-gray-200 text-black px-2 py-1 rounded flex items-center gap-1 dark:bg-[#001733] dark:text-[#f4f4f4]">
                                    {tag}
                                    <button onClick={() => handleRemoveTag(index)} className="text-red-500">
                                        <RiCloseLine size={24} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex flex-row items-center">
                            <input type="text" value={newTag} placeholder="Add a category" onChange={(e) => { setNewTag(e.target.value) }} className={textBarStyle} />
                            <button
                                type="button"
                                className="ml-2 px-4 py-2 bg-gray-200 rounded-lg dark:bg-[#001C40]"
                                onClick={handleAddTag}>
                                <RiAddFill size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="w-full mt-5 flex flex-col">
                        <label htmlFor="status">Status: </label>
                        <select
                            className={textBarStyle}
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
                    <div className=" mt-5 flex flex-row gap-5 w-full">
                        <div className="w-full flex flex-col">
                            <label htmlFor="isPhishing">Is this a url phishing url?: </label>
                            <select
                                className={textBarStyle}
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
                        <div className="w-full flex flex-col">
                            <label htmlFor="isVerified">Was url verified by human?: </label>
                            <select
                                className={textBarStyle}
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
                    </div>
                    <button
                        type="submit"
                        className=" mt-9 mb-2 rounded-lg text-[#f4f4f4] font-medium w-full bg-[#0364BD] hover:bg-[#003A70] transition p-2 "
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
