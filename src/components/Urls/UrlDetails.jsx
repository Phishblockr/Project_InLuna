import React, { useEffect, useState } from "react";
import { RiLoopLeftLine, RiDeleteBinLine, RiCloseLine, RiAddFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { delUrl, updateUrl } from "../../features/Urls/urlSlice";
import { toast } from "sonner";
import { handleVerifyPwd } from "../../utils/handleVerifyPwd";
import AuthenticateModal from "../../utils/AuthenticateModal";
import { useAuth } from "../../utils/AuthProvider";

const UrlDetails = () => {
    const { getToken } = useAuth();
    const token = getToken();
    const textBarStyle = "w-full p-2 rounded-t-lg border-b-2 border-dashed bg-gray-100 border-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"

    const [editUrlData, setEditUrlData] = useState({ url: "", category: [], status: "", isPhishing: false, isVerified: false });
    const [newTag, setNewTag] = useState(""); // For adding new tags
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [operationType, setOperationType] = useState(null);
    const apiUrl = import.meta.env.VITE_API_URL
    const { id } = useParams();
    const navigate = useNavigate();
    const url = useSelector((state) => state.urls.urls.find((url) => url._id === id));
    const dispatch = useDispatch();

    useEffect(() => {
        if (url) {
            setEditUrlData({ url: url.url, category: url.category || [], status: url.status, isPhishing: url.isPhishing, isVerified: url.isVerified });
        }
    }, [url]);

    const handleRemUrl = () => {
        try {
            dispatch(delUrl({urlId: id, token}));
            toast.success(`URL ${url.url} removed`);
            navigate("/urllists");
        } catch (e) {
            toast.error(e.message);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setEditUrlData({ ...editUrlData, [name]: value });
    };

    const executeEditUrl = async () => {
        await dispatch(updateUrl({ id, editUrlData, token })).unwrap();
        toast.success("URL updated successfully");
        navigate("/urllists");
    };

    const handleEditUrl = (event) => {
        event.preventDefault();
        handlePasswordModalOpen(null, "edit");
    };

    const handleAddTag = () => {
        if (newTag.trim() && !editUrlData.category.includes(newTag)) {
            setEditUrlData({ ...editUrlData, category: [...editUrlData.category, newTag.trim()] })
            setNewTag("")
        }
    };

    const handleRemoveTag = (index) => {
        const updatedTags = editUrlData.category.filter((_, i) => i !== index);
        setEditUrlData({ ...editUrlData, category: updatedTags })
    }

    if (!url) {
        return <div>URL not found</div>;
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
            if (operationType === "delete") {
                handleRemUrl();
            } else if (operationType === "edit") {
                executeEditUrl();
            }
            setIsPasswordModalOpen(false);
        }
    };

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100vh-65px)] flex flex-col justify-between relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            <AuthenticateModal isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            />
            <div className="z-1 w-full font-medium bg-white rounded-xl shadow-xl p-3 h-full dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <div>
                    <h1 className="pt-3 pl-5 text-2xl font-medium">URL Details</h1>
                </div>
                <form className="mt-3 px-3 flex flex-col w-full items-center" onSubmit={handleEditUrl}>
                    <div className="w-full flex flex-col">
                        <label htmlFor="url">URL: </label>
                        <input
                            type="text"
                            id="url"
                            name="url"
                            value={editUrlData.url}
                            onChange={handleChange}
                            className={textBarStyle}
                        />
                    </div>

                    <div className="mt-5 w-full flex flex-col">
                        <label htmlFor="category">Category: </label>
                        <div className={`${editUrlData.category.length === 0 ? "p-5" : "p-2"
                            } rounded-lg border-dashed border-2 border-gray-300 dark:bg-[#001C40] dark:border-[#001C40] flex flex-wrap gap-2`}
                        >
                            {editUrlData.category.map((tag, index) => (
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
                            value={editUrlData.status}
                            onChange={handleChange}
                        >
                            <option value="blacklisted">Blacklist</option>
                            <option value="whitelisted">Whitelist</option>
                        </select>
                    </div>
                    <div className=" mt-5 flex flex-row gap-5 w-full">
                        <div className="w-full mt-5 flex flex-col">
                            <label htmlFor="isPhishing">Is this a url phishing url?: </label>
                            <select
                                className={textBarStyle}
                                name="isPhishing"
                                id="isPhishing"
                                value={editUrlData.isPhishing}
                                onChange={handleChange}
                            >
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        <div className="w-full mt-5 flex flex-col">
                            <label htmlFor="isVerified">Was url verified by human?: </label>
                            <select
                                className={textBarStyle}
                                name="isVerified"
                                id="isVerified"
                                value={editUrlData.isVerified}
                                onChange={handleChange}
                            >
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-9 flex flex-row justify-end gap-x-2 w-full">
                        <button
                            type="button"
                            onClick={() => handlePasswordModalOpen(null, "delete")}
                            className="bg-gray-200 hover:bg-gray-300 text-red-500 p-2 w-[200px] h-[50px] font-medium rounded-lg dark:bg-[#001C40] dark:hover:bg-[#001733] transition-colors"
                        >
                            <span className="flex flex-row gap-x-2 items-center justify-center">
                                <RiDeleteBinLine className="w-6 h-6" /> Delete URL
                            </span>
                        </button>
                        <button
                            type="submit"
                            className="bg-[#0364BD] hover:bg-[#003A70] w-[200px] h-[50px] p-2 text-[#f4f4f4] font-medium rounded-lg transition-colors"
                        >
                            <span className="flex flex-row gap-x-2 items-center justify-center">
                                <RiLoopLeftLine className="w-6 h-6" /> Update URL
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UrlDetails;
