import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import Log from "./Log";
import {
    MdOutlineArrowBackIos,
    MdOutlineArrowForwardIos,
} from "react-icons/md";
import { BsFileEarmarkArrowDown } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { getLogs } from "../features/Logs/logsSlice";
import { setPerPageRec } from "../features/PerPageRec/perPageRecSlice";
import debounce from "debounce";
import LoadingOverlay from "../utils/LoadingOverlay";
import { formatDate } from "../utils/formatDate.jsx"

const LogDetailsModal = ({ show, onClose, logData }) => {
    if (!show || !logData) return null;

    const { userDetails = {}, entityDetails = {}, entityId, entityType, operationType, operationsPerformed, createdAt } = logData;

    return (
        <div className="fixed bg-black/50 top-0 left-0 right-0 bottom-0 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-[#2b2e32] dark:text-[#F4F4F4] p-5 rounded-lg w-full max-w-[1000px] relative">
                <h1 className="text-2xl font-semibold mb-2">Detailed Info</h1>
                <button onClick={onClose} className="absolute top-3 right-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="rounded-lg p-4 mt-2">
                    <h2 className="font-medium text-xl mb-2">Updates made by</h2>
                    {userDetails.name ? (
                        <Link to={`/users/userDetails/${userDetails._id}`} title="Click to view details">
                            <p className="font-medium text-blue-500 underline">{userDetails.name}</p>
                        </Link>
                    ) : (
                        <p className="text-gray-500">No user details available</p>
                    )}
                    <div className="flex flex-row gap-2">
                        <p>Email:</p>
                        <p className="text-gray-500">{userDetails.email || "N/A"}</p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <p>Department:</p>
                        <p className="text-gray-500">{userDetails.department || "N/A"}</p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <p>Operation Type:</p>
                        <p className="text-gray-500">{operationType || "N/A"}</p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <p>Operations Performed:</p>
                        <p className="text-gray-500">{operationsPerformed || "N/A"}</p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <p>On:</p>
                        <p className="text-gray-500">{createdAt ? formatDate(createdAt, "24hours") : "N/A"}</p>
                    </div>
                </div>
                <div className="rounded-lg p-4 mt-2">
                    <h2 className="font-medium text-xl mb-2">Updates made to</h2>
                    <div className="flex flex-row gap-2">
                        <p>ID:</p>
                        <p className="text-gray-500">{entityId || "N/A"}</p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <p>Type:</p>
                        <p className="text-gray-500">{entityType || "N/A"}</p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <p>From:</p>
                        {entityDetails.from ? (
                            <Link to={`/users/userDetails/${entityDetails.from}`} title="Click to view details">
                                <p className="text-blue-500 underline">{entityDetails.from}</p>
                            </Link>
                        ) : (
                            <p className="text-gray-500">N/A</p>
                        )}
                    </div>
                    <div className="flex flex-row gap-2">
                        <p>Identifier:</p>
                        <p className="text-gray-500 break-words overflow-hidden w-full">{entityDetails.identifier || "N/A"}</p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <p>Status:</p>
                        <p className="text-gray-500">{entityDetails.status || "N/A"}</p>
                    </div>
                    <div className="flex flex-row gap-2">
                        <p>Extra info:</p>
                        <p className="text-gray-500">{entityDetails.extraInfo || "N/A"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

function Log({ blog, setBlog, showBlog }) {
    return (
        <div className="flex rounded-lg shadow-md bg-white justify-between items-center dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
            <div className="flex">
                <div
                    className={`${blog.operationType === "delete" ? "bg-[#C62828]" : "bg-[#00695C]"
                        } rounded-s-lg p-3`}
                ></div>
                <div className="p-5 text-right flex gap-5">
                    <span className="pr-8 border-r-2 border-gray-500">
                        {/* TODO: Add hour Type in settings Page */}
                        {formatDate(blog.createdAt, "24hours")}
                    </span>
                    <span className="pr-8 border-r-2 border-gray-500">
                        {blog.operationType}
                    </span>
                    <span className="pr-8 border-r-2 border-gray-500">
                        {blog.operationsPerformed}
                    </span>
                </div>
            </div>
            <div className="flex justify-center items-center pr-3">
                <button onClick={() => setBlog(!showBlog)}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

const Logs = () => {

    const perPageRec = useSelector((state) => state.perPageRec)
    const logsData = useSelector((state) => state.logs.logs);
    const totalPages = useSelector((state) => state.logs.totalPages);

    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // For Loading Overlay
    const [dataLoading, setDataLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    // For Handling errors
    const [error, setErrors] = useState(null);

    // Start of Search Logic
    const [query, setQuery] = useState("");

    const handleSearch = debounce((value) => {
        setQuery(value);
        dispatch(getLogs({ page: 1, limit: perPageRec, search: value, operationType, dateRangeFilter }));
    }, 300);
    // End of Search Logic

    // Start of Filter Logic
    const [operationType, setOperationType] = useState("all")

    const handleOperationType = (value) => {
        setOperationType(value);
        dispatch(getLogs({ page: 1, limit: perPageRec, search: query, operationType: value, dateRangeFilter }));
    }
    // End of Filter Logic

    // Start of DateRangeFilter Logic
    const [dateRangeFilter, setDateRangeFilter] = useState("all")

    const handleDateRangeFilter = (value) => {
        setDateRangeFilter(value);
        dispatch(getLogs({ page: 1, limit: perPageRec, search: query, operationType, dateRangeFilter: value }));
    }
    // End of DateRangeFilter Logic

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

    const openLogDetails = (log) => {
        setSelectedLog(log);
        setShowModal(true);
    };

    useEffect(() => {
        setDataLoading(true)
        let loadingTimer = setTimeout(() => {
            setShowLoading(true);
        }, 500);
        dispatch(getLogs({ page: currentPage, limit: perPageRec, search: query, operationType, dateRangeFilter }))
            .unwrap()
            .finally(() => {
                clearTimeout(loadingTimer);
                setShowLoading(false);
                setDataLoading(false);
            })
    }, [dispatch, perPageRec, currentPage]);

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100vh-65px)] flex flex-col justify-between relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            {showLoading && <LoadingOverlay loading={dataLoading} />}
            <LogDetailsModal show={showModal} onClose={() => setShowModal(false)} logData={selectedLog} />
            <div>
                <header className="bg-white dark:bg-[#002451] dark:text-[#F4F4F4] p-4 rounded-xl shadow flex justify-between items-center">
                    <h1 className="text-2xl font-medium">Logs</h1>
                    <div className="flex gap-3 items-center">
                        <input onChange={(e) => handleSearch(e.target.value)} type="text" placeholder="Search Logs" className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0" />
                        <select onChange={(e) => handleOperationType(e.target.value)} defaultValue="all" className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0">
                            <option value="all">Operation Type</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="add">Add</option>
                            <option value="approved">Approved</option>
                        </select>
                        <select onChange={(e) => handleDateRangeFilter(e.target.value)} defaultValue="all" className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0">
                            <option value="all">Date Range Filter</option>
                            <option value="this_week">This Week</option>
                            <option value="last_week">Last Week</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="this_quarter">This Quarter</option>
                            <option value="last_quarter">Last Quarter</option>
                            <option value="this_year">This Year</option>
                            <option value="last_year">Last Year</option>
                        </select>
                        <select value={perPageRec} onChange={(e) => handleSetPerPageRec(e.target.value)} className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0">
                            {[5, 10, 25, 50, 100].map((val) => (
                                <option key={val} value={val}>
                                    {val}
                                </option>
                            ))}
                        </select>
                        <Link to="/insights/addemp" className="flex items-center gap-2 p-2 rounded-lg text-[#f4f4f4] bg-[#0364BD] hover:bg-[#003A70]">
                            <span>to CSV</span>
                            <BsFileEarmarkArrowDown className="w-6 h-6" />
                        </Link>
                    </div>
                </header>
                <section className="mt-5 flex flex-col gap-2">
                    {logsData.map((log) => (
                        <Log key={log._id} blog={log} setBlog={() => openLogDetails(log)} showBlog={showModal} />
                    ))}
                </section>
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
};

export default Logs;
