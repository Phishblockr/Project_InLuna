import React, { useState, useEffect } from "react";
import { RiDeleteBinLine, RiEyeLine } from "react-icons/ri";
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from "react-icons/md";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";
import { useDispatch, useSelector } from "react-redux";
import { setPerPageRec } from "../../features/PerPageRec/perPageRecSlice";
import debounce from "debounce";
import Pagination from "../Pagination";

const Email = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const token = getToken();

    const perPageRec = useSelector((state) => state.perPageRec);
    const dispatch = useDispatch();

    const [templates, setTemplates] = useState([]);

    // For Pagination and Data Filter
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState("");
    const [group, setGroup] = useState("all");
    const [groupOptions, setGroupOptions] = useState([]);

    // temporary
    const [totalPages, setTotalPages] = useState(1);

    // For Loading Overlay
    const [dataLoading, setDataLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        /*setDataLoading(true)
        let loadingTimer = setTimeout(() => {
            setShowLoading(true);
        }, 500);
                dispatch(getUsers({ page: currentPage, limit: perPageRec, search: query, status, token }))
            .unwrap()
            .finally(() => {
                clearTimeout(loadingTimer);
                setShowLoading(false);
                setDataLoading(false);
            })
        */
        fetchTemplates({ page: currentPage, limit: perPageRec, search: query, group, token });
        fetchOptions();
        // dispatch(startListeningToSocket(token));
    }, []);

    const fetchTemplates = async ({ page, limit, search, group, token }) => {
        try {
            const res = await fetch(`${apiUrl}/emailTemplate/getAll?page=${page}&limit=${limit}&search=${search}&group=${group}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (res.ok) {
                setTemplates(data.templates);
                setTotalPages(data.totalPages);
            } else {
                toast.error(data.message || "Error fetching templates");
            }
        } catch (error) {
            toast.error("Error fetching templates:", error.message)
        }
    }

    const fetchOptions = async () => {
        try {
            const response = await fetch(`${apiUrl}/emailTemplate/getGroups`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }); // Backend endpoint
            const data = await response.json();
            setGroupOptions(data);
        } catch (error) {
            console.error("Error fetching options:", error);
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

    const handleSetPerPageRec = (value) => {
        dispatch(setPerPageRec(value));
        fetchTemplates({ page: currentPage, limit: value, search: query, group, token });
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

    const handleSearch = debounce((value) => {
        setQuery(value)
        fetchTemplates({ page: 1, limit: perPageRec, search: value, group, token });
    }, 300);

    const handleGroup = (value) => {
        setGroup(value)
        fetchTemplates({ page: 1, limit: perPageRec, search: query, group: value, token });
    }

    return (
        <div className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            <div>

                <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">Email Templates</h1>
                    </div>
                    <div className="flex items-center gap-x-3">
                        <input
                            type="text"
                            placeholder="Search Template..."
                            className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleSearch(e.target.value)}
                        />

                        <select
                            name="filters"
                            id="filters"
                            className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleGroup(e.target.value)}
                        >
                            <option value="all">Group</option>
                            {groupOptions.map((groupOption, index) => (
                                <option key={index} value={groupOption}>
                                    {groupOption}
                                </option>
                            ))}
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
                        // onClick={() => setIsModalOpen(true)}
                        >
                            Add Templates via CSV
                        </button>
                        <Link
                            to={"/emails/emailCreator"}
                            className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-[#f4f4f4] cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition-colors"
                        >
                            <span>
                                Add Template
                            </span>
                        </Link>
                    </div>
                </div>
                {templates.length === 0 ? (
                    <p>No templates found.</p>
                ) : (
                    <div>
                        <table className="w-full dark:text-[#F4F4F4]">
                            <thead className="border-separate">
                                <tr>
                                    <th className="py-3 text-left">Title</th>
                                    <th className="py-3 text-left">Phishing</th>
                                    <th className="py-3 text-left">Group</th>
                                    <th className="py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((template) => (
                                    <tr
                                        key={template._id}
                                        className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                    >
                                        <td className="py-2 pl-2">
                                            <Link
                                                to={`/emails/emailEditor/${template._id}`}
                                                title="Click to view details"
                                            >
                                                <span className="font-medium">{template.title}</span>
                                            </Link>
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {template.isPhishing.toString()}
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {template.group}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => navigate(`/emails/emailEditor/${template._id}`)}
                                                title="Click to view details"
                                            ><RiEyeLine size={24} className="hover:text-[#0364BD] transition-colors" /></button>
                                            {/* <button onClick={() => handlePasswordModalOpen(template._id, "delete")}>
                                                <RiDeleteBinLine className="w-6 h-6 text-red-500 hover:text-red-700 transition-colors" />
                                            </button> */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                        setCurrentPage (page);
                        // Optionally, fetch new data when the page changes:
                        fetchTemplates({ page, limit: perPageRec, search: query, group, token });
                    }}
                />
            </div>
        </div>
    );
}

export default Email;