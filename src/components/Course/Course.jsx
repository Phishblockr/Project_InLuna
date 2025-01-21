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

const Course = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const token = getToken();

    const perPageRec = useSelector((state) => state.perPageRec);
    const dispatch = useDispatch();

    const [courses, setCourses] = useState([]);

    // For Pagination and Data Filter
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [categoryOptions, setCategoryOptions] = useState([]);

    // temporary
    const [totalPages, setTotalPages] = useState(1);

    // For Loading Overlay
    const [dataLoading, setDataLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    const fetchCourses = async ({ page, limit, search, category, token }) => {
        try {
            const res = await fetch(`${apiUrl}/course/getAll?page=${page}&limit=${limit}&search=${search}&category=${category}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (res.ok) {
                setCourses(data.courses);
                setTotalPages(data.totalPages);
            } else {
                toast.error(data.message || "Error fetching courses");
            }
        } catch (error) {
            toast.error("Error fetching courses:", error.message)
        }
    }

    const fetchCategories = async () => {
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

    useEffect(() => {
        /*setDataLoading(true)
        let loadingTimer = setTimeout(() => {
            setShowLoading(true);
        }, 500);
                dispatch(getUsers({ page: currentPage, limit: perPageRec, search: query, category, token }))
            .unwrap()
            .finally(() => {
                clearTimeout(loadingTimer);
                setShowLoading(false);
                setDataLoading(false);
            })
        */
            fetchCourses({ page: currentPage, limit: perPageRec, search: query, category, token });
            fetchCategories();
        // dispatch(startListeningToSocket(token));
    }, []);

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
        fetchCourses({ page: 1, limit: perPageRec, search: value, category, token });
    }, 300);

    const handleCategory = (value) => {
        setCategory(value)
        fetchCourses({ page: 1, limit: perPageRec, search: query, category: value, token });
    }

    return (
        <div className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            <div>

                <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">Courses</h1>
                    </div>
                    <div className="flex items-center gap-x-3">
                        <input
                            type="text"
                            placeholder="Search Course..."
                            className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleSearch(e.target.value)}
                        />

                        <select
                            name="filters"
                            id="filters"
                            className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleCategory(e.target.value)}
                        >
                            <option value="all">Category</option>
                            {categoryOptions.map((categoryOption, index) => (
                                <option key={index} value={categoryOption}>
                                    {categoryOption}
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
                        <Link
                            to={"/courses/courseCreator"}
                            className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-[#f4f4f4] cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition-colors"
                        >
                            <span>
                                Add Course
                            </span>
                        </Link>
                    </div>
                </div>
                {courses.length === 0 ? (
                    <p>No courses found.</p>
                ) : (
                    <div>
                        <table className="w-full dark:text-[#F4F4F4]">
                            <thead className="border-separate">
                                <tr>
                                    <th className="py-3 text-left">Title</th>
                                    <th className="py-3 text-left">Course Duration</th>
                                    <th className="py-3 text-left">Category</th>
                                    <th className="py-3 text-left">Interactive</th>
                                    <th className="py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((course) => (
                                    <tr
                                        key={course._id}
                                        className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                    >
                                        <td className="py-2 pl-2">
                                            <Link
                                                to={`/courses/courseEditor/${course._id}`}
                                                title="Click to view details"
                                            >
                                                <span className="font-medium">{course.name}</span>
                                            </Link>
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            Duration
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {course.category}
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            Interactive
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => navigate(`/courses/courseEditor/${course._id}`)}
                                                title="Click to view details"
                                            ><RiEyeLine size={24} className="hover:text-[#0364BD] transition-colors" /></button>
                                            {/* <button onClick={() => handlePasswordModalOpen(course._id, "delete")}>
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

export default Course;