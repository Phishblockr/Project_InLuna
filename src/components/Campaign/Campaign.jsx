import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RiDeleteBinLine, RiEyeLine } from "react-icons/ri";
import { HiOutlineClipboardCheck } from "react-icons/hi";
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from "react-icons/md";
import { delCampaign, getCampaigns, updateCampaign } from '../../features/Campaign/Campaign';
import { setPerPageRec } from "../../features/PerPageRec/perPageRecSlice";
import { useAuth } from "../../utils/AuthProvider";

export default function Campaign() {
    const { getToken } = useAuth();
    const token = getToken();
    const dispatch = useDispatch();

    // For Loading Overlay
    const [dataLoading, setDataLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    // For Pagination and Data Filter
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");

    // For Handling errors
    const [error, setErrors] = useState(null);

    // For AuthenticateModal
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [operationType, setOperationType] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    const { campaigns } = useSelector((state) => state.campaign);
    const totalPages = useSelector((state) => state.campaign.totalPages);
    const perPageRec = useSelector((state) => state.perPageRec);

    useEffect(() => {
        setDataLoading(true);
        let loadingTimer = setTimeout(() => {
            setShowLoading(true);
        }, 500);
        dispatch(getCampaigns({ page: currentPage, limit: perPageRec, search: query, status, token }))
            .unwrap()
            .finally(() => {
                clearTimeout(loadingTimer);
                setShowLoading(false);
                setDataLoading(false);
            })
        // dispatch(startListeningToSocket(token));
    }, [dispatch, currentPage, perPageRec, query, token]);

    const handleDelete = (id) => {
        dispatch(delCampaign({id, token}));
    };

    const handleUpdateStatus = (id, newStatus, newStatusColor) => {
        dispatch(
            updateCampaign({
                id,
                updatedData: { status: newStatus, statusColor: newStatusColor },
                token
            })
        );
    };

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
            {/* <AuthenticateModal isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            /> */}
            <div>
                <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    {/* Header Section */}
                    <div className="flex w-full justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Training Campaign</h1>
                        </div>
                        <div className="flex items-center gap-x-3">
                            <input
                                type="text"
                                placeholder="Search campaigns..."
                                className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <select
                                name="filters"
                                id="filters"
                                className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                                onChange={(e) => handleStatus(e.target.value)}
                            >
                                <option value="all">Status</option>
                                <option value="completed">Completed</option>
                                <option value="inProgress">In Progress</option>
                                <option value="scheduled">Scheduled</option>
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
                            <Link to={'/campaign/add'}>
                                <button className="rounded-lg text-sm p-3 px-4 bg-[#0364BD] text-white font-medium">
                                    Add Campaign
                                </button>
                            </Link>     
                            <Link to={'/campaign/manageTemplate'}>
                                <button className="rounded-lg text-sm p-3 px-4 bg-[#0364BD] text-white font-medium">
                                    Add Template
                                </button>
                            </Link>
                            <Link to={'/campaign/manageBlog'}>
                                <button className="rounded-lg text-sm p-3 px-4 bg-[#0364BD] text-white font-medium">
                                    Add Blogs
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
                {campaigns.length === 0 ? (
                    <div className="flex justify-center font-medium dark:text-[#F4F4F4]">
                        <span>No Records Found!</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-300 dark:border-gray-700">
                                    <th className="text-left px-4 py-2 font-medium">Campaign Name</th>
                                    <th className="text-left px-4 py-2 font-medium">Groups</th>
                                    <th className="text-left px-4 py-2 font-medium">Courses</th>
                                    <th className="text-left px-4 py-2 font-medium">Start Date</th>
                                    <th className="text-left px-4 py-2 font-medium">End Date</th>
                                    <th className="text-left px-4 py-2 font-medium">Status</th>
                                    <th className="text-left px-4 py-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((campaign) => (
                                    <tr
                                        key={campaign._id}
                                        className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                    >
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col">
                                                <p>{campaign.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">{campaign.groups}</td>
                                        <td className="px-4 py-2">{campaign.courses}</td>
                                        <td className="px-4 py-2">{campaign.startDate}</td>
                                        <td className="px-4 py-2">{campaign.endDate}</td>
                                        <td className="px-4 py-2">
                                            <span
                                                className={`px-2 py-1 rounded-full text-sm font-medium capitalize ${campaign.status === "completed"
                                                    ? "bg-green-100 text-green-800 dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400"
                                                    : campaign.status === "in progress"
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-[rgba(238,247,187,0.1)] dark:text-yellow-400"
                                                        : "bg-red-100 text-red-800 dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400"
                                                    }`}
                                            >
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                title="Click to view details"
                                            >
                                                <RiEyeLine size={24} className="hover:text-[#0364BD] transition-colors" />
                                            </button>
                                            <button
                                                className="mx-1"
                                                title='Delete'
                                                onClick={() => handleDelete(campaign._id)}
                                            >
                                                <RiDeleteBinLine className="w-6 h-6 text-red-500 hover:text-red-700 transition-colors" />
                                            </button>
                                            {campaign.status !== "completed" && (
                                                <button
                                                    title='Mark as Completed'
                                                    onClick={() =>
                                                        handleUpdateStatus(campaign._id, "completed", "bg-green-500")
                                                    }
                                                >
                                                    <HiOutlineClipboardCheck className="w-6 h-6 text-blue-500 hover:text-blue-700 transition-colors" />
                                                </button>
                                            )}
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
