import React, { useEffect, useState } from "react";
import { RiAddFill, RiDeleteBinLine, RiShareBoxLine, RiEyeLine } from "react-icons/ri";
import {
    MdOutlineArrowBackIos,
    MdOutlineArrowForwardIos,
} from "react-icons/md";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { delUrl, getUrls, startListeningToSocket, uploadUrlCsv } from "../../features/Urls/urlSlice";
import { toast } from "sonner";
import { setPerPageRec } from "../../features/PerPageRec/perPageRecSlice";
import LoadingOverlay from "../../utils/LoadingOverlay";
import CsvUploadUrlModal from "../../utils/CsvUploadUrlModal";
import AuthenticateModal from "../../utils/AuthenticateModal";
import { handleVerifyPwd } from "../../utils/handleVerifyPwd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";


export default function UrlLists() {

    const apiUrl = import.meta.env.VITE_API_URL
    const { getToken } = useAuth();
    const token = getToken();
    const navigate = useNavigate();

    const [dataLoading, setDataLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isCsvUploadModalOpen, setIsCsvUploadModalOpen] = useState(false);
    const [csvData, setCsvData] = useState(null);
    const [status, setStatus] = useState("all")
    const [error, setErrors] = useState(null);
    const [operationType, setOperationType] = useState(null);
    const [selectedUrl, setSelectedUrl] = useState(null);


    // Redux
    const perPageRec = useSelector((state) => state.perPageRec);
    const urlData = useSelector((state) => state.urls.urls);
    const totalPages = useSelector((state) => state.urls.totalPages);
    const dispatch = useDispatch();
    // End of Redux

    // NOTE: This Logic is for demonstration purposes only and should be replaced to optimise database queries
    // Start of Search Logic
    const [query, setQuery] = useState("");
    const keys = ["url", "category", "status"];
    const search = (data) => {
        return data.filter((item) =>
            keys.some((key) => item[key].toLowerCase().includes(query.toLowerCase()))
        );
    };
    // End of Search Logic

    // Start of Filter Logic
    const [dataFilter, setDataFilter] = useState(null);
    const filter = (data) => {
        if (dataFilter === "whitelisted") {
            return data.filter((item) => item.status === "Whitelisted");
        } else if (dataFilter === "blacklisted") {
            return data.filter((item) => item.status === "Blacklisted");
        } else {
            return data;
        }
    };

    const handleStatus = (value) => {
        setStatus(value)
        dispatch(getUrls({ page: currentPage, limit: perPageRec, search: query, status: value, token }));
    }

    // End of Filter Logic

    // Start of Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);

    function nextPage() {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    }

    function prePage() {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    }

    function changeCPage(n) {
        setCurrentPage(n);
    }

    const handleSetPerPageRec = (value) => {
        dispatch(setPerPageRec(value));
    };

    useEffect(() => {
        setDataLoading(true)
        let loadingTimer = setTimeout(() => {
            setShowLoading(true); // Only show loading overlay after delay
        }, 500);
        dispatch(getUrls({ page: currentPage, limit: perPageRec, search: query, status, token }))
            .unwrap()
            .finally(() => {
                clearTimeout(loadingTimer);
                setShowLoading(false);
                setDataLoading(false);
            })

        dispatch(startListeningToSocket(token));
    }, [dispatch, currentPage, perPageRec, query])
    // End of Pagination Logic

    const formatUrl = (url, maxLen = 70) => {
        return url.length > maxLen ? url.substring(0, maxLen) + "..." : url;
    };

    const handleRemUrl = async (id) => {
        try {
            await dispatch(delUrl({ urlId: id, token })).unwrap();
            toast.success(`URL removed`);

            const updatedRecords = urlData.slice(0, perPageRec - 1);
            if (updatedRecords.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1)
            } else {
                dispatch(getUrls({ page: currentPage, limit: perPageRec, search: query, status, token }));
            }
        } catch (e) {
            toast.error(`Error: ${e}`);
        }
    };

    const handlePasswordModalOpen = (url, type) => {
        setSelectedUrl(url);
        setOperationType(type);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = async (password) => {
        // const token = JSON.parse(localStorage.getItem("user")).token;
        const result = await handleVerifyPwd(password, apiUrl, token);

        if (result) {
            if (operationType === "delete") {
                handleRemUrl(selectedUrl);
            } else if (operationType === "add") {
                executeCsvUpload()
            }
            setIsPasswordModalOpen(false);
        }
    };

    const handleCsvUpload = async ({ file, urlHeader, categoryHeader, status, isPhishing, isVerified }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("urlHeader", urlHeader);
        formData.append("categoryHeader", categoryHeader);
        formData.append("status", status);
        formData.append("isPhishing", isPhishing);
        formData.append("isVerified", isVerified);

        setCsvData(formData);
        handlePasswordModalOpen(null, "add");
    };

    const executeCsvUpload = async () => {
        try {
            const response = await dispatch(uploadUrlCsv({ formData: csvData, token })).unwrap();
            if (response.errors) {
                setErrors(response.errors);
                toast.error("CSV contains errors. Please correct them and try again.");
            } else {
                toast.success("CSV uploaded successfully");
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to upload CSV! Make sure your CSV doesn't contain duplicate email & phone values.");
        }
    }

    function getVisiblePages(totalPages, currentPage) {
        const maxVisibleAround = 6;
        const pages = [];

        if (totalPages === 1) {
            pages.push(1);
            return pages;
        }

        pages.push(1);

        if (currentPage > maxVisibleAround + 2) {
            pages.push("...");
        }

        const start = Math.max(2, currentPage - maxVisibleAround);
        const end = Math.min(totalPages - 1, currentPage + maxVisibleAround);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - (maxVisibleAround + 1)) {
            pages.push("...");
        }

        pages.push(totalPages);

        return pages;
    }

    const visiblePages = getVisiblePages(totalPages, currentPage);

    function changeCPage(n) {
        if (typeof n === "number") {
            setCurrentPage(n);
        }
    }

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100vh-65px)] flex flex-col justify-between relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            {showLoading && <LoadingOverlay loading={dataLoading} />}
            <CsvUploadUrlModal
                isOpen={isCsvUploadModalOpen}
                onClose={() => setIsCsvUploadModalOpen(false)}
                onFileSubmit={handleCsvUpload}
            />

            <AuthenticateModal isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            />
            <div>
                <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">URL List</h1>
                    </div>
                    <div className="flex items-center gap-x-3">
                        <input
                            type="text"
                            placeholder="Search Urls..."
                            className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <select
                            name="filters"
                            id="filters"
                            className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleStatus(e.target.value)}
                        >
                            <option value="all">Status</option>
                            <option value="whitelisted">Whitelisted</option>
                            <option value="blacklisted">Blacklisted</option>
                        </select>
                        <select
                            name="perPageRec"
                            id="perPageRec"
                            className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleSetPerPageRec(e.target.value)}
                            value={perPageRec}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <button className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-300 dark:dark:bg-[#001733] dark:hover:bg-[#001733] dark:text-gray-400 transition"
                            onClick={() => setIsCsvUploadModalOpen(true)}>Add urls via CSV</button>
                        <Link
                            to={"/urllists/addurl"}
                            className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-[#f4f4f4] cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition"
                        >
                            <span>
                                Add URL <RiAddFill className="inline-block w-6 h-6 -mt-1" />
                            </span>
                        </Link>
                    </div>
                </div>
                {urlData.length === 0 ? (
                    <div className="flex justify-center font-medium dark:text-[#F4F4F4]">
                        <span>No Records Found!</span>
                    </div>
                ) : (
                    <div>
                        <table className="w-full dark:text-[#F4F4F4]">
                            <thead className="border-separate">
                                <tr>
                                    <th className="py-3 text-left">URL</th>
                                    <th className="py-3 text-left">Category</th>
                                    <th className="py-3 text-left">Status</th>
                                    <th className="py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {urlData.map((url) => (
                                    <tr
                                        key={url._id}
                                        className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                    >
                                        <td className="font-medium text-left text-gray-500 p-5 dark:text-[#F4F4F4] max-w-[400px] truncate">
                                            <Link
                                                to={`/urllists/urldetails/${url._id}`}
                                                title="Click to view details"
                                                className="block overflow-hidden whitespace-nowrap overflow-ellipsis"
                                            >
                                                {formatUrl(url.url)}
                                            </Link>
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {url.category && url.category.length > 0 ? url.category.join(", ") : "NA"}
                                        </td>
                                        <td className="text-left font-medium">
                                            <span
                                                className={`px-2 py-1 rounded-full text-sm font-medium capitalize ${url.status === "whitelisted"
                                                    ? "bg-green-100 text-green-800 dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400"
                                                    : url.status === "unknown"
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-[rgba(238,247,187,0.1)] dark:text-yellow-400"
                                                        : "bg-red-100 text-red-800 dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400"
                                                    }`}
                                            >
                                                {url.status}
                                            </span>
                                        </td>
                                        <td className=" mt-5 flex flex-row gap-2 items-center text-left ">
                                            <button
                                                onClick={() => navigate(`/urllists/urldetails/${url._id}`)}
                                                title="View Url Details"
                                            ><RiEyeLine size={24} className="hover:text-[#0364BD] transition-colors" /></button>
                                            <button
                                                title="Visit Url"
                                                onClick={() => { window.open(url.url, '_blank'); }}
                                            ><RiShareBoxLine size={24} className="hover:text-[#0364BD] transition-colors" /></button>
                                            <button
                                                onClick={() => handlePasswordModalOpen(url._id, "delete")}
                                                title="Delete Url"
                                            >
                                                <RiDeleteBinLine size={24} className="text-red-500 hover:text-red-700 transition-colors" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <nav className="flex gap-x-1 justify-between">
                    <button
                        className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    >
                        <MdOutlineArrowBackIos className="w-6 h-6" /> Previous
                    </button>
                    <div className="flex gap-x-2 items-center">
                        {visiblePages.map((page, index) =>
                            typeof page === "number" ? (
                                <button
                                    key={index}
                                    className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-[#f4f4f4] transition dark:hover:bg-[#0364BD] ${currentPage === page
                                        ? "bg-[#0364BD] text-[#f4f4f4] dark:bg-[#0364BD]"
                                        : "bg-gray-200 dark:bg-[#001C40]"
                                        }`}
                                    onClick={() => changeCPage(page)}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={index} className="px-2 py-1">
                                    {page}
                                </span>
                            )
                        )}
                    </div>
                    <button
                        className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                        Next <MdOutlineArrowForwardIos className="w-6 h-6" />
                    </button>
                </nav>
            </div>
        </div>
    );
}
