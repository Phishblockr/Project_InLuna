import React, { useEffect, useState } from "react";
import { RiLoopLeftLine, RiDeleteBinLine } from "react-icons/ri";
import {
    MdOutlineArrowBackIos,
    MdOutlineArrowForwardIos,
} from "react-icons/md";
import { PiUserCircleLight } from "react-icons/pi";

import { useDispatch, useSelector } from "react-redux";
import { delReq, updateStatus, fetchReqs, approveReq, startListeningToSocket } from "../features/Requests/requestsSlice";
import { setPerPageRec } from "../features/PerPageRec/perPageRecSlice";
import { toast } from "sonner";
import debounce from "debounce";
import AuthenticateModal from "../utils/AuthenticateModal"
import { handleVerifyPwd } from "../utils/handleVerifyPwd";


export default function Requests() {
    const apiUrl = import.meta.env.VITE_API_URL
    // Redux
    const perPageRec = useSelector((state) => state.perPageRec)
    const requestData = useSelector((state) => state.requests.requests);
    const totalPages = useSelector((state) => state.requests.totalPages);
    const dispatch = useDispatch();

    const statusActive = "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400 dark:border-green-400";
    const statusInactive = "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400 dark:border-red-400";

    // For Loading Overlay
    const [dataLoading, setDataLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    // For AuthenticateModal
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [operationType, setOperationType] = useState(null);
    const [selectedReq, setSelectedReq] = useState(null);

    // For Handling errors
    const [error, setErrors] = useState(null);

    // Start of Search Logic
    const [query, setQuery] = useState("");

    const handleSearch = debounce((value) => {
        setQuery(value);
        dispatch(fetchReqs({ page: 1, limit: perPageRec, search: value, status }));
    }, 300);
    // End of Search Logic

    // Start of Filter Logic
    const [dataFilter, setDataFilter] = useState(null);
    const [status, setStatus] = useState("all")

    const handleStatus = (value) => {
        setStatus(value);
        dispatch(fetchReqs({ page: 1, limit: perPageRec, search: query, status: value }));
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
        dispatch(setPerPageRec(value))
    }
    // End of Pagination Logic

    useEffect(() => {
        setDataLoading(true)
        let loadingTimer = setTimeout(() => {
            setShowLoading(true); // Only show loading overlay after delay
        }, 500);
        dispatch(fetchReqs({ page: currentPage, limit: perPageRec, search: query, status }))
            .unwrap()
            .finally(() => {
                clearTimeout(loadingTimer);
                setShowLoading(false);
                setDataLoading(false);
            })
        dispatch(startListeningToSocket());
    }, [dispatch, currentPage, perPageRec, query])

    async function handleRem(id) {
        try {
            await dispatch(delReq({reqId: id})).unwrap();
            toast.success(`Request id: ${id} removed`);

            const updatedRecords = requestData.slice(0, perPageRec - 1);

            if (updatedRecords.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1)
            } else {
                dispatch(fetchReqs({ page: currentPage, limit: perPageRec, search: query, status }))
            }

        } catch (error) {
            toast.error(`Something went wrong: ${error}`);
        }
    }

    async function handleApproveReq(id) {
        try {
            await dispatch(approveReq({reqId: id}));
            toast.success(`Request id: ${id} updated`);
        } catch (error) {
            toast.error(`Something went wrong: ${error}`);
        }
    }

    const handlePasswordModalOpen = (req, type) => {
        setSelectedReq(req);
        setOperationType(type);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = async (password) => {
        const token = JSON.parse(localStorage.getItem("user")).token;
        const result = await handleVerifyPwd(password, apiUrl, token);

        if (result) {
            if (operationType === "delete") {
                handleRem(selectedReq);
            } else if (operationType === "update") {
                handleApproveReq(selectedReq)
            }
            setIsPasswordModalOpen(false);
        }
    };

    const truncateUrl = (url, maxLength = 120) => {
        return url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;
    };

    console.log(totalPages)

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100vh-65px)] flex flex-col justify-between relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            <div>
                <div className=" bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">Requests</h1>
                    </div>
                    <div className="flex items-center justify-evenly gap-x-3">
                        <input
                            type="text"
                            placeholder="Search Request..."
                            className="rounded-lg border-gray-300 border-2 text-gray-400 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <select
                            name="filters"
                            id="filters"
                            className="rounded-lg border-gray-300 border-2 text-gray-400 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
                            onChange={(e) => handleStatus(e.target.value)}
                        >
                            <option value="all">Status</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                        </select>
                        <select
                            name="perPageRec"
                            id="perPageRec"
                            className="rounded-lg border-gray-300 border-2 text-gray-400 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
                            onChange={(e) => handleSetPerPageRec(e.target.value)}
                            value={perPageRec}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
                {requestData.length === 0 ? (
                    <div className="flex justify-center font-medium">
                        <span>No Records Found!</span>
                    </div>
                ) : (
                    requestData.map((request) => (
                        <div
                            className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max whitespace-pre-wrap dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none my-5"
                            key={request._id}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-row items-center justify-between">
                                    <div className="flex flex-row gap-x-5 items-center">
                                    {request.profileImage ? (
                                        <img
                                            className="w-[5rem] h-[5rem] rounded-full object-cover"
                                            src={request.profileImage}
                                            alt="user Profile"
                                        />
                                    ) : (
                                        <svg
                                            className="w-[5rem] h-[5rem] rounded-full object-cover"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="16 16 224 224"
                                        >
                                            <path
                                                d="M63.8,199.37a72,72,0,0,1,128.4,0"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="12"
                                            />
                                            <circle
                                                cx="128"
                                                cy="128"
                                                r="96"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="12"
                                            />
                                            <circle
                                                cx="128"
                                                cy="120"
                                                r="40"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="12"
                                            />
                                        </svg>
                                    )}
                                    <ul className="flex flex-col">
                                        <li className="font-medium text-3xl my-2">
                                            {request.userDetails.name}
                                        </li>
                                        <li className="font-medium mb-1">
                                            <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">E-mail:</span>
                                            <span>{request.userDetails.email}</span>
                                        </li>
                                        <li className="font-medium mb-1">
                                            <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">Status:</span>
                                            <span
                                                className={
                                                    request.status === "approved"
                                                        ? statusActive
                                                        : statusInactive
                                                }
                                            >
                                                {request.status}
                                            </span>
                                        </li>
                                    </ul>
                                    </div>
                                    <div className="">
                                <button
                                    onClick={() => handleApproveReq(request._id)}
                                    className="bg-[#0364BD] hover:bg-[#003A70] p-3 text-[#f4f4f4] font-medium rounded-lg mr-2"
                                >
                                    <span className="flex flex-row items-center gap-x-1">
                                        <RiLoopLeftLine className="w-6 h-6" /> Update URL Status
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleRem(request._id)}
                                    className="bg-gray-200 hover:bg-gray-300 text-red-500 p-3 font-medium rounded-lg transition-colors dark:dark:bg-[#001733] dark:hover:bg-[#001733]"
                                >
                                    <span className="flex flex-row items-center gap-x-1">
                                        <RiDeleteBinLine className="w-6 h-6" /> Remove Request
                                    </span>
                                </button>
                            </div>
                                </div>
                                
                                <div>
                                    <p className="font-medium p-2">
                                        <span>URL: </span>
                                        <a
                                            href={request.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                             className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis"
                                            title={request.url} // Shows full URL on hover
                                        >
                                            {truncateUrl(request.url)}
                                        </a>
                                    </p>
                                    <p className="mt-2 bg-gray-100 rounded-lg p-2 dark:bg-[#001733]">
                                        <span className="font-medium">Reason: </span>{" "}
                                        {request.reason}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <nav className="flex gap-x-1 justify-between">
                    <div>
                        <button
                            className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={currentPage === 1}
                            onClick={prePage}
                        >
                            <MdOutlineArrowBackIos className="w-6 h-6" /> Previous
                        </button>
                    </div>
                    <div className="flex gap-x-2 items-center">
                        {totalPages && totalPages > 0 ? (
                            [...Array(totalPages).keys()].map((n) => (
                                <button
                                    className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-[#f4f4f4] transition dark:hover:bg-[#0364BD] ${currentPage === n + 1 ? "bg-[#0364BD] text-[#f4f4f4] dark:bg-[#0364BD]" : "bg-gray-200 dark:bg-[#001C40]"
                                        }`}
                                    key={n + 1}
                                    onClick={() => changeCPage(n + 1)}
                                >
                                    {n + 1}
                                </button>
                            ))
                        ) : (
                            <span></span>
                        )}
                    </div>
                    <div>
                        <button
                            className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={currentPage === totalPages}
                            onClick={nextPage}
                        >
                            Next <MdOutlineArrowForwardIos className="w-6 h-6" />
                        </button>
                    </div>
                </nav>
            </div>
        </div>
    );
}
