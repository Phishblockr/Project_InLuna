import React, { useEffect, useState } from "react";
import { RiAddFill, RiDeleteBinLine, RiShareBoxLine, RiEyeLine, RiPresentationFill } from "react-icons/ri";
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from "react-icons/md";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { delUser, getUsers, uploadCsv, startListeningToSocket } from "../../features/Users/usersSlice";
import { toast } from "sonner";
import { setPerPageRec } from "../../features/PerPageRec/perPageRecSlice";
import { PiUserCircleLight } from "react-icons/pi";
import LoadingOverlay from "../../utils/LoadingOverlay";
import FileUploadModal from "../../utils/FileUploadModal";
import AuthenticateModal from "../../utils/AuthenticateModal"
import { useAuth } from "../../utils/AuthProvider";
import { handleVerifyPwd } from "../../utils/handleVerifyPwd";
import debounce from "debounce";
import { useNavigate } from "react-router-dom";

export default function Users() {
    const apiUrl = import.meta.env.VITE_API_URL
    const { getToken } = useAuth();
    const token = getToken();
    const navigate = useNavigate();

    const usersData = useSelector((state) => state.users.users);
    const totalPages = useSelector((state) => state.users.totalPages);
    const perPageRec = useSelector((state) => state.perPageRec);
    const dispatch = useDispatch();

    // For Loading Overlay
    const [dataLoading, setDataLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    // For CSV Upload
    const [csvData, setCsvData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // For Pagination and Data Filter
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");

    // For Handling errors
    const [error, setErrors] = useState(null);

    // For AuthenticateModal
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [operationType, setOperationType] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        setDataLoading(true)
        let loadingTimer = setTimeout(() => {
            setShowLoading(true); // Only show loading overlay after delay
        }, 500);
        dispatch(getUsers({ page: currentPage, limit: perPageRec, search: query, status, token }))
            .unwrap()
            .finally(() => {
                clearTimeout(loadingTimer);
                setShowLoading(false);
                setDataLoading(false);
            })

        dispatch(startListeningToSocket(token));
    }, [dispatch, currentPage, perPageRec, query, token]);

    const handleSearch = debounce((value) => {
        setQuery(value)
        dispatch(getUsers({ page: 1, limit: perPageRec, search: value, status, token }));
    }, 300);

    const handleStatus = (value) => {
        setStatus(value)
        dispatch(getUsers({ page: 1, limit: perPageRec, search: query, status: value, token }));
    }

    const handleFileSubmit = async (file) => {
        const formData = new FormData();
        formData.append("file", file)
        setCsvData(formData);
        handlePasswordModalOpen(null, "add");
    }

    const executeCsvUpload = async () => {
        try {
            const response = dispatch(uploadCsv({ formData: csvData, token })).unwrap()
            if (response.errors) {
                setErrors(response.errors);
                toast.error("CSV contains errors. Please correct them and try again.");
            } else {
                toast.success("CSV uploaded successfully");
            }
        } catch (error) {
            toast.error("Failed to upload CSV! Make sure your CSV don't contain duplicate email & phone values");
        }
    }

    const handleSetPerPageRec = (value) => {
        dispatch(setPerPageRec(value));
    };

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

    const handleRemUser = async (id) => {
        try {
            await dispatch(delUser({ id, token })).unwrap();
            toast.success(`User ${id} removed`);

            const updatedRecords = usersData.slice(0, perPageRec - 1);

            if (updatedRecords.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            } else {
                dispatch(getUsers({ page: currentPage, limit: perPageRec, search: query, status, token }));
            }
        } catch (error) {
            toast.error(`Something went wrong: ${error}`);
        }
    };

    const handlePasswordModalOpen = (user, type) => {
        setSelectedUser(user);
        setOperationType(type);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = async (password) => {
        // const token = JSON.parse(localStorage.getItem("user")).token;
        const result = await handleVerifyPwd(password, apiUrl, token);

        if (result) {
            if (operationType === "delete") {
                handleRemUser(selectedUser);
            } else if (operationType === "add") {
                executeCsvUpload()
            }
            setIsPasswordModalOpen(false);
        }
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
        <div className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            <FileUploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onFileSubmit={handleFileSubmit}
                FileMsg="Make sure csv contains following headers 'name, email, phone, gender, role, department'"
                FileType="csv"
            />
            {showLoading && <LoadingOverlay loading={dataLoading} />}

            <AuthenticateModal isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            />

            <div>

                <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">Users</h1>
                    </div>
                    <div className="flex items-center gap-x-3">
                        <input
                            type="text"
                            placeholder="Search User..."
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
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
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
                            onClick={() => setIsModalOpen(true)}>Add users via CSV</button>
                        <Link
                            to={"/users/adduser"}
                            className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-[#f4f4f4] cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition-colors"
                        >
                            <span>
                                Add User
                            </span>
                        </Link>
                    </div>
                </div>
                {usersData.length === 0 ? (
                    <div className="flex justify-center font-medium dark:text-[#F4F4F4]">
                        <span>No Records Found!</span>
                    </div>
                ) : (
                    <div>
                        <table className="w-full dark:text-[#F4F4F4]">
                            <thead className="border-separate">
                                <tr>
                                    <th className="py-3 text-left">Name</th>
                                    <th className="py-3 text-left">Email</th>
                                    <th className="py-3 text-left">Department</th>
                                    <th className="py-3 text-left">Role</th>
                                    <th className="py-3 text-left">Status</th>
                                    <th className="py-3 text-left">Extension Status</th>
                                    <th className="py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersData.map((user) => (
                                    <tr
                                        key={user._id}
                                        className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                    >
                                        <td className="py-2 pl-2">
                                            <Link
                                                to={`/users/userDetails/${user._id}`}
                                                title="Click to view details"
                                            >
                                                <div className="flex items-center gap-x-3">
                                                    {user.img ? <img src={user.img} alt="" className="h-12 w-12 rounded-full" /> : <PiUserCircleLight className="h-12 w-12" />}
                                                    <span className="font-medium">{user.name}</span>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {user.email}
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {user.department}
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {user.role}
                                        </td>
                                        <td className="text-left font-medium">
                                            <span
                                                className={`px-2 py-1 rounded-full text-sm font-medium capitalize ${user.status === "active"
                                                    ? "bg-green-100 text-green-800 dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400"
                                                    : user.status === "not initialized"
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-[rgba(238,247,187,0.1)] dark:text-yellow-400"
                                                        : "bg-red-100 text-red-800 dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400"
                                                    }`}
                                            >
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="text-left font-medium">
                                            <span
                                                className={`px-2 py-1 rounded-full text-sm font-medium capitalize ${user.heartBeatStatus === "active"
                                                    ? "bg-green-100 text-green-800 dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400"
                                                    : user.heartBeatStatus === "not initialized"
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-[rgba(238,247,187,0.1)] dark:text-yellow-400"
                                                        : "bg-red-100 text-red-800 dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400"
                                                    }`}
                                            >
                                                {user.heartBeatStatus}
                                            </span>
                                        </td>
                                        <td className="flex flex-row items-center gap-2 mt-5 text-left">
                                            <button
                                                onClick={() => navigate(`/users/userDetails/${user._id}`)}
                                                title="Click to view details"
                                            ><RiEyeLine size={24} className="hover:text-[#0364BD] transition-colors" /></button>

                                            <button
                                            onClick={() => navigate(`/training/individualTraining/${user._id}`)}
                                            title="Assign Training"
                                            ><RiPresentationFill size={24} className="hover:text-[#0364BD] transition-colors" /></button>

                                            <button 
                                            onClick={() => handlePasswordModalOpen(user._id, "delete")}
                                            title="Delete User"
                                            >
                                                <RiDeleteBinLine className="w-6 h-6 text-red-500 hover:text-red-700 transition-colors" />
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
